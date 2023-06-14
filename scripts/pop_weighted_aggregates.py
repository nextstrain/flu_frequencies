"""
Script to aggregate results from a lower hierarchy to a higher one
Input:
    - variant/country frequences from fit_hierarchical_frequencies
    - country to population mapping
    - country to region mapping
Output:
    - csv file similar to the one from fit_hierarchical_frequencies
      but with higher level estimate replaced by pop weighted average
"""

from typing import Annotated

import polars as pl
from polars import col as c
import typer
from typer import Option


def read_tsv(path, *args, **kwargs):
    """
    Like polars.read_csv() but with default separator set to tab
    """
    kwargs.setdefault("separator", "\t")
    return pl.read_csv(path, *args, **kwargs)


def country_region_population(
    country_to_population: pl.DataFrame, country_to_region: pl.DataFrame
) -> pl.DataFrame:
    """
    Calculate population of each region
    ### Input
    country_to_population: country, population
    country_to_region: country, region
    ### Output
    columns: country, region, country_population, region_population
    """
    df_out = (
        country_to_population.rename({"population": "country_population"})
        .join(country_to_region, on="country")
        .with_columns(
            region_population=c("country_population").sum().over("region"),
        )
    )
    return df_out


def prepare_data(
    df: pl.DataFrame,
    country_to_population: pl.DataFrame,
    country_to_region: pl.DataFrame,
) -> pl.DataFrame:
    """
    Prepare data for aggregation
    Input df should have the following columns:
        - date
        - region
        - country
        - variant
        - freqMi
        - freqLo
        - freqUp
    Input country_to_population should have the following columns:
        - country
        - population
    Input country_to_region should have the following columns:
        - country
        - region
    Output DataFrame will have the following columns:
        - date
        - region
        - country
        - variant
        - freqMi
        - freqLo
        - freqUp
        - country_population
        - region_population
    """
    # Other country gets difference between region and sum(country).over(region)
    # Each region has represented population (with other counting 0)
    missing_population = (
        country_region_population(country_to_population, country_to_region)
        .filter(c("country").is_in(df.get_column("country")))
        .with_columns(
            missing_population=c("region_population")
            - (c("country_population").sum().over("region")),
        )
        # .with_columns(
        #     missing_population=c("region_population")
        #     - c("represented_population")
        # )
    )
    # Add "other" rows: like df.exclude(["country","country_population"]) with added country="other", country_population=missing_population
    population_with_other = missing_population.vstack(
        missing_population.with_columns(
            country=pl.lit("other"),
            country_population=c("missing_population"),
        ).unique()
    ).select(pl.exclude("missing_population"))

    df_out = df.filter(
        (c("country") != "?") & (c("country") != c("region"))
    ).join(population_with_other, on=["region", "country"], how="left")

    return df_out


def weighted_average(df: pl.DataFrame):
    """
    Calculates population weighted average for a region
    Frequency of special country "other" is used for countries not represented in data
    Weighted error is calculated as weighted average of squared errors
    Input DataFrame should have the following columns:
        - date
        - region
        - country
        - variant
        - freqMi
        - freqLo
        - freqUp
        - country_population
        - region_population
    Output DataFrame will have the following columns:
        - date
        - region
        - variant
        - freqMi
        - freqLo
        - freqUp
    """

    df = (
        df.filter(c("country") != c("region"))
        .with_columns(
            weight=c("country_population") / c("region_population"),
        )
        .with_columns(
            freqMi_pop_product=c("freqMi") * c("weight"),
            freqErr_pop_product=(
                pl.max([c("freqMi") - c("freqLo"), c("freqUp") - c("freqMi")])
                ** 2
            )
            * c("weight"),
        )
        .groupby(["date", "region", "variant"])
        .agg(
            freqMi=c("freqMi_pop_product").sum(),
            freqErr=c("freqErr_pop_product").sum().sqrt(),
            region_population=c("region_population").first(),
        )
        .select(
            ["date", "region", "variant", "freqMi", "region_population"],
            freqLo=pl.max([c("freqMi") - c("freqErr"), 0]),
            freqUp=pl.min([c("freqMi") + c("freqErr"), 1]),
            global_population=(
                df.unique("region").get_column("region_population").sum()
            ),
        )
    )

    global_df = (
        df.with_columns(
            weight=c("region_population") / c("global_population"),
        )
        .with_columns(
            freqMi_pop_product=c("freqMi") * c("weight"),
            freqErr_pop_product=(
                pl.max([c("freqMi") - c("freqLo"), c("freqUp") - c("freqMi")])
                ** 2
            )
            * c("weight"),
        )
        .groupby(["date", "variant"])
        .agg(
            freqMi=c("freqMi_pop_product").sum(),
            freqErr=c("freqErr_pop_product").sum().sqrt(),
        )
        .select(
            ["date", "variant", "freqMi"],
            freqLo=pl.max([c("freqMi") - c("freqErr"), 0]),
            freqUp=pl.min([c("freqMi") + c("freqErr"), 1]),
            region=pl.lit("global"),
        )
    )

    df = pl.concat(
        [
            df.select(pl.exclude(["region_population", "global_population"])),
            global_df,
        ],
        how="diagonal",
    )

    return df


def main(
    _fit_results: Annotated[
        str, Option("--fit-results")
    ] = "results/h3n2/region-country-frequencies.csv",
    _country_to_population: Annotated[
        str, Option("--country-to-population")
    ] = "defaults/iso3_to_pop.tsv",
    _country_to_region: Annotated[
        str, Option("--country-to-region")
    ] = "profiles/flu/iso3_to_region.tsv",
    output_csv: Annotated[
        str, Option()
    ] = "results/h3n2/region-country-frequencies-pop-weighted.csv",
):
    """
    Fit results need to have columns:
    - region (as defined in region_map)
    - country (iso3 or special case "other")
    - date (of bin start)
    - variant
    - count
    - total
    - freqMi
    - freqLo
    - freqUp
    """

    # Filter out unknown regions
    fit_results = pl.read_csv(_fit_results).filter(c("region") != "?")
    country_to_population = read_tsv(_country_to_population).select(
        country=c("iso3"), population=c("population")
    )
    country_to_region = read_tsv(_country_to_region).select(
        country=c("iso3"), region=c("continent")
    )

    # Prepare data
    prepped_data = prepare_data(
        fit_results, country_to_population, country_to_region
    )


    # Calculate weighted average
    weighted = weighted_average(prepped_data).select(
        ["region", c("region").alias("country")], pl.exclude("region")
    )

    pl.Config.set_tbl_cols(12)

    # Add global rows to fit_results with count/total
    global_fit_results = (
        fit_results.filter(c("country") == c("region"))
        .select(
            ["date", "variant", "count", "total"],
        )
        .groupby(["date", "variant"])
        .agg(
            count=c("count").sum(),
            total=c("total").sum(),
            region=pl.lit("global"),
        )
    )

    # Join count and total from original data
    df = weighted.join(
        pl.concat(
            [
                fit_results.filter(c("country") == c("region")).select(
                    ["date", "region", "variant", "count", "total"]
                ),
                global_fit_results,
            ],
            how="diagonal",
        ),
        on=["region", "variant", "date"],
        how="left",
    )

    # Write out the data
    df.write_csv(output_csv, float_precision=5)


if __name__ == "__main__":
    typer.run(main)
