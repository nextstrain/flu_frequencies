#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Converts data from intermediate format into a format suitable for consumption by the web app
"""
import posixpath
import shutil
from datetime import datetime
from os import makedirs
from os.path import join, dirname
import argparse
import json
from typing import Union, List
from PIL import ImageOps, Image, ImageColor
import polars as pl

from colorhash import colorhash


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-pathogens-json", type=str,
                        help="Path to pathogens.json file containing a list of pathogen descriptions")
    parser.add_argument("--output-dir", type=str, help="Path to directory to output data in web format")
    args = parser.parse_args()

    input_dir = dirname(args.input_pathogens_json)

    pathogens = json_read(args.input_pathogens_json)

    pathogens = [
        process_one_pathogen(pathogen, input_dir, args.output_dir)
        for pathogen in pathogens
        if pathogen["isVisible"]
    ]

    index_json = {
        "lastUpdate": date_to_iso(date_now()),
        "pathogens": pathogens
    }
    json_write(index_json, join(args.output_dir, "index.json"))


def process_one_pathogen(pathogen: dict, input_dir: str, output_dir: str):
    color = colorhash(pathogen["name"], reverse=True, prefix="321")
    image_url = process_image(pathogen, color, input_dir, output_dir)

    min_date = ''
    max_date = ''
    n_regions = 0
    n_countries = 0
    n_variants = 0
    if pathogen["isEnabled"]:
        df = csv_read(join(input_dir, f'{pathogen["name"]}.csv'))

        min_date = df["date"].min()
        max_date = df["date"].max()

        regions_json = extract_geography_hierarchy(df)
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

    return pathogen_json


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
    regions = list(df["region"].unique(maintain_order=True))
    countries = list(set(df["country"].unique(maintain_order=True).drop_nulls()) - set(regions))

    geo_items = df \
        .select(["region", "country"]) \
        .unique(subset=['country'], maintain_order=True) \
        .partition_by(by=["region"], as_dict=True, maintain_order=True) \
        .items()

    geography = {region: list(set(region_df["country"]) - {region}) for region, region_df in geo_items}

    styles = {country: {"color": colorhash(country), "lineStyle": "normal"} for country in regions + countries}

    return {"geography": geography, "regions": regions, "countries": countries, "geographyStyles": styles}


def extract_list_of_variants(df: pl.DataFrame):
    variants = list(df["variant"].unique(maintain_order=True))
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
        json.dump(obj, f, indent=2, sort_keys=True)


def csv_read(filepath: str):
    return pl.read_csv(filepath)


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
