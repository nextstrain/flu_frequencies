#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Converts data from intermediate format into a format suitable for consumption by the web app
"""
from datetime import datetime
from os import makedirs
from os.path import join, dirname
import argparse
import json
from typing import Union, List
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

    for pathogen in pathogens:
        process_one_pathogen(pathogen, input_dir, args.output_dir)

    index_json = {
        "pathogens": pathogens,
    }
    json_write(index_json, join(args.output_dir, "index.json"))

    update_json = {
        "lastUpdate": date_to_iso(date_now())
    }
    json_write(update_json, join(args.output_dir, "update.json"))


def process_one_pathogen(pathogen: dict, input_dir: str, output_dir: str):
    json_write(pathogen, join(output_dir, "pathogens", pathogen["name"], "pathogen.json"))

    df = csv_read(join(input_dir, f'{pathogen["name"]}.csv'))

    print(df)

    process_geography(df, pathogen, output_dir)

    process_variants(df, pathogen, output_dir)


def process_geography(df: pl.DataFrame, pathogen: dict, output_dir: str):
    regions_json = extract_geography_hierarchy(df)
    json_write(regions_json, join(output_dir, "pathogens", pathogen["name"], "geography.json"))

    for region_name, region_df in partition_by(df, ["region"]):
        for country_name, country_df in partition_by(region_df, ["country"]):

            values = []
            for date, country_date_df in partition_by(country_df, ["date"]):
                avgs = country_date_df.select(["variant", "freqMi"])
                avgs = {variant: value for variant, value in avgs.iter_rows()}

                ranges = country_date_df.select([
                    "variant",
                    pl.concat_list(["freqLo", "freqUp"]).alias("range")
                ])
                ranges = {variant: val_range for variant, val_range in ranges.iter_rows()}

                values.append({"date": date, "avgs": avgs, "ranges": ranges})

            country_json = {
                "region": region_name,
                "country": country_name,
                "values": values
            }

            filepath_base = join(output_dir, "pathogens", pathogen["name"], "geography", country_name)
            csv_write(country_df, f"{filepath_base}.csv")
            json_write(country_json, f"{filepath_base}.json")


def process_variants(df: pl.DataFrame, pathogen: dict, output_dir: str):
    variants_json = extract_list_of_variants(df)
    json_write(variants_json, join(output_dir, "pathogens", pathogen["name"], "variants.json"))

    df = df.drop("region")
    for variant_name, variant_df in partition_by(df, ["variant"]):

        values = []

        for date, variant_date_df in partition_by(variant_df, ["date"]):
            avgs = variant_date_df.select(["country", "freqMi"])
            avgs = {country: value for country, value in avgs.iter_rows()}

            ranges = variant_date_df.select([
                "country",
                pl.concat_list(["freqLo", "freqUp"]).alias("range")
            ])
            ranges = {country: val_range for country, val_range in ranges.iter_rows()}

            values.append({"date": date, "avgs": avgs, "ranges": ranges})

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
        .partition_by(groups=["region"], as_dict=True, maintain_order=True) \
        .items()

    geography = {region: list(set(region_df["country"]) - {region}) for region, region_df in geo_items}

    styles = {country: {"color": colorhash(country), "lineStyle": "normal"} for country in regions + countries}

    return {"geography": geography, "regions": regions, "countries": countries, "geographyStyles": styles}


def extract_list_of_variants(df: pl.DataFrame):
    variants = list(df["variant"].unique(maintain_order=True))
    styles = {variant: {"color": colorhash(variant), "lineStyle": "normal"} for variant in variants}
    return {"variants": variants, "variantsStyles": styles}


def partition_by(df: pl.DataFrame, column_names: List[str]):
    """
    Splits rows of the dataframe `df` by different values of the column `column_name`, into an iterator of pairs `(k, v)`,
    where `k` is one value in that column and `v` is a dataframe consisting from all rows with that value in that column.
    """
    for k, v in df.partition_by(groups=column_names, as_dict=True, maintain_order=True).items():
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


def date_now():
    return datetime.utcnow()


def date_to_iso(date: datetime):
    return date.strftime("%Y-%m-%dT%H:%M:%SZ")


def remove_prefix(text: str, prefix: str):
    return text[text.startswith(prefix) and len(prefix):]


if __name__ == '__main__':
    main()
