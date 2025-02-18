#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Converts data from intermediate format into a format suitable for consumption by the web app
"""
import argparse
import json
import logging
import posixpath
import shutil
from datetime import datetime
from os import makedirs
from os.path import dirname, join
from typing import List, Union

import polars as pl
from PIL import Image, ImageOps

from colorhash import colorhash
from country_lookup_from_file import CountryLookupFromFile

logging.basicConfig(level=logging.INFO)
l = logging.getLogger(" ")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-pathogens-json", type=str,
                        help="Path to pathogens.json file containing a list of pathogen descriptions")
    parser.add_argument("--output-dir", type=str, help="Path to directory to output data in web format")
    args = parser.parse_args()

    input_dir = dirname(args.input_pathogens_json)

    input_pathogens = json_read(args.input_pathogens_json)

    all_pathogens = []
    all_regions = set()
    all_countries = set()
    for pathogen in input_pathogens:
        if pathogen["isVisible"]:
            pathogen, regions, countries = process_one_pathogen(pathogen, input_dir, args.output_dir)
            all_pathogens.append(pathogen)
            all_regions.update(set(regions))
            all_countries.update(set(countries))

    # Make index.json
    index_json = {
        "lastUpdate": date_to_iso(date_now()),
        "pathogens": all_pathogens
    }
    json_write(index_json, join(args.output_dir, "index.json"))

    cl = CountryLookupFromFile("profiles/flu/iso3_to_region.tsv")
    global_geography_json = {
        "lastUpdate": date_to_iso(date_now()),
        "countryNames": {
            country_code: cl.iso3_to_name(country_code) if country_code != "other" else "Other"
            for country_code in all_countries
        }
    }
    json_write(global_geography_json, join(args.output_dir, "global_geography.json"))

    # Update additional keys for the internationalization
    all_country_names = [v for k, v in global_geography_json["countryNames"].items()]
    all_pathogen_names = [pathogen["nameFriendly"] for pathogen in all_pathogens]
    i18n_keys_file = join(input_dir, "../../web/src/i18n/additional_keys.json")
    i18n_keys = json_read(i18n_keys_file)
    i18n_keys.extend(all_country_names)
    i18n_keys.extend(all_regions)
    i18n_keys.extend(all_pathogen_names)
    i18n_keys = list(sorted(set(i18n_keys)))
    json_write(i18n_keys, i18n_keys_file)


def get_country_name(iso3_codes: pl.DataFrame, country_code: str):
    return iso3_codes.row(by_predicate=(pl.col("iso3") == country_code))


def process_one_pathogen(pathogen: dict, input_dir: str, output_dir: str):
    color = colorhash(pathogen["name"], reverse=True, prefix="321")
    image_url = process_image(pathogen, color, input_dir, output_dir)

    l.info(f"Processing {pathogen['name']}")

    min_date = ''
    max_date = ''
    n_regions = 0
    n_countries = 0
    n_variants = 0
    regions = []
    countries = []
    if pathogen["isEnabled"]:
        df = csv_read(join(input_dir, f'{pathogen["name"]}.csv')).sort("date")

        condition = (pl.col('country') == '?') | (pl.col('region') == '?')
        if len(df.filter(condition)) > 0:
            l.warning("there are rows with 'country' or 'region' coloumns having value '?'. Dropping these rows.")
            df = df.filter(~condition)

        min_date = df["date"].min()
        max_date = df["date"].max()

        regions_json = extract_geography_hierarchy(df)
        countries = regions_json["countries"]
        regions = regions_json["regions"]
        n_regions = len(regions_json["regions"])
        n_countries = len(regions_json["countries"])
        json_write(regions_json, join(output_dir, "pathogens", pathogen["name"], "geography.json"))
        process_geography(df, pathogen, output_dir)

        variants_json = extract_list_of_variants(df)
        n_variants = len(variants_json["variants"])
        json_write(variants_json, join(output_dir, "pathogens", pathogen["name"], "variants.json"))
        process_variants(df, pathogen, output_dir)

    pathogen_json = {
        **pathogen,
        "color": color,
        "minDate": min_date,
        "maxDate": max_date,
        "nRegions": n_regions,
        "nCountries": n_countries,
        "nVariants": n_variants,
        "image": {
            **pathogen["image"],
            "file": image_url
        }
    }
    json_write(pathogen_json, join(output_dir, "pathogens", pathogen["name"], "pathogen.json"))

    return pathogen_json, regions, countries


def two_columns_to_dict(date_df, key_column, value_column):
    """
    Collects adict of key-value pairs for 2 columns: one acts as a key and another as a value
    """
    values = date_df.select([key_column, value_column])
    return {k: v for k, v in values.iter_rows()}


def process_geography(df: pl.DataFrame, pathogen: dict, output_dir: str):
    for region_name, region_df in partition_by(df, ["region"]):
        for country_name, country_df in partition_by(region_df, ["country"]):

            values = []
            for date, country_date_df in partition_by(country_df, ["date"]):
                avgs = two_columns_to_dict(country_date_df, "variant", "freqMi")
                counts = two_columns_to_dict(country_date_df, "variant", "count")
                totals = two_columns_to_dict(country_date_df, "variant", "total")

                ranges = country_date_df.select([
                    "variant",
                    pl.concat_list(["freqLo", "freqUp"]).alias("range")
                ])
                ranges = {variant: val_range for variant, val_range in ranges.iter_rows()}

                values.append({"date": date, "avgs": avgs, "ranges": ranges, "counts": counts, "totals": totals})

            country_json = {
                "region": region_name,
                "country": country_name,
                "values": values
            }

            filepath_base = join(output_dir, "pathogens", pathogen["name"], "geography", country_name)
            csv_write(country_df, f"{filepath_base}.csv")
            json_write(country_json, f"{filepath_base}.json")


def process_variants(df: pl.DataFrame, pathogen: dict, output_dir: str):
    df = df.drop("region")
    for variant_name, variant_df in partition_by(df, ["variant"]):

        values = []

        for date, variant_date_df in partition_by(variant_df, ["date"]):
            avgs = two_columns_to_dict(variant_date_df, "country", "freqMi")
            counts = two_columns_to_dict(variant_date_df, "country", "count")
            totals = two_columns_to_dict(variant_date_df, "country", "total")

            ranges = variant_date_df.select([
                "country",
                pl.concat_list(["freqLo", "freqUp"]).alias("range")
            ])
            ranges = {country: val_range for country, val_range in ranges.iter_rows()}

            values.append({"date": date, "avgs": avgs, "ranges": ranges, "counts": counts, "totals": totals})

        variant_json = {
            "variant": variant_name,
            "values": values
        }
        filepath_base = join(output_dir, "pathogens", pathogen["name"], "variants", f"{variant_name}")
        csv_write(variant_df, f"{filepath_base}.csv")
        json_write(variant_json, f"{filepath_base}.json")


def extract_geography_hierarchy(df: pl.DataFrame):
    regions = list(sorted(df["region"].unique(maintain_order=True)))
    countries = list(sorted(set(df["country"].unique(maintain_order=True).drop_nulls()) - set(regions)))

    geo_items = df \
        .select(["region", "country"]) \
        .unique(subset=['country'], maintain_order=True) \
        .partition_by(by=["region"], as_dict=True, maintain_order=True) \
        .items()

    geography = {region: list(sorted(set(region_df["country"]) - {region})) for region, region_df in geo_items}

    styles = {country: {"color": colorhash(country), "lineStyle": "normal"} for country in regions + countries}

    return {"geography": geography, "regions": regions, "countries": countries, "geographyStyles": styles}


def extract_list_of_variants(df: pl.DataFrame):
    variants = list(sorted(df["variant"].unique(maintain_order=True)))
    styles = {variant: {"color": colorhash(variant), "lineStyle": "normal"} for variant in variants}
    return {"variants": variants, "variantsStyles": styles}


def process_image(pathogen, color, input_dir, output_dir):
    input_image_path = join(input_dir, pathogen["image"]["file"])
    output_image_path = join(output_dir, "pathogens", pathogen["name"], "image.png")
    image_url = posixpath.join("pathogens", pathogen["name"], "image.png")

    image = Image.open(input_image_path)
    image = ImageOps.fit(image, (250, 200))

    if not pathogen["isEnabled"]:
        image = image.convert('L')  # convert to grayscale
        image = ImageOps.autocontrast(image)
        # image = ImageOps.colorize(image, (0, 0, 0, 0), color)

    ensure_dir(output_image_path)
    image.save(output_image_path)

    return image_url


def partition_by(df: pl.DataFrame, column_names: List[str]):
    """
    Splits rows of the dataframe `df` by different values of the column `column_name`, into an iterator of pairs `(k, v)`,
    where `k` is one value in that column and `v` is a dataframe consisting from all rows with that value in that column.
    """
    for k, v in df.partition_by(by=column_names, as_dict=True, maintain_order=True).items():
        # We drop the target column, because its values are the same (and the same as `k`)
        v = v.drop(column_names)
        yield k, v


def json_read(filepath: str):
    with open(filepath, "r") as f:
        return json.load(f)


def json_write(obj: Union[dict, list], filepath: str):
    ensure_dir(filepath)
    with open(filepath, "w") as f:
        json.dump(obj, f, indent=2, sort_keys=True, ensure_ascii=False)


def csv_read(filepath: str, **kwargs):
    return pl.read_csv(filepath, infer_schema_length=1_000_000, **kwargs)


def csv_write(df: pl.DataFrame, filepath: str):
    pass
    # ensure_dir(filepath)
    # df.write_csv(filepath)


def ensure_dir(filepath: str):
    makedirs(dirname(filepath), exist_ok=True)


def file_copy(src, dst):
    ensure_dir(dst)
    return shutil.copyfile(src, dst, follow_symlinks=True)


def date_now():
    return datetime.utcnow()


def date_to_iso(date: datetime):
    return date.strftime("%Y-%m-%dT%H:%M:%SZ")


def remove_prefix(text: str, prefix: str):
    return text[text.startswith(prefix) and len(prefix):]


if __name__ == '__main__':
    main()
