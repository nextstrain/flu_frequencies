"""
Script to aggregate results from a lower hierarchy to a higher one
Input:
    - variant/country frequences from fit_hierarchical_frequencies
    - population sizes
Output:
    - csv file similar to the one from fit_hierarchical_frequencies
      but with higher level estimate replaced by pop weighted average
"""

from functools import lru_cache
from hmac import new
from pathlib import Path
from typing import Annotated

import polars as pl
from polars import col as c
import typer
from typer import Option
from scipy.optimize import minimize
from scipy.stats import beta
import numpy as np


def weighted_average(df: pl.DataFrame, region_dict: dict):
    """
    Calculate weighted average for a region
    Use region frequency for countries not listed
    This imputation should be done before calling this function
    Input DataFrame should have the following columns:
        - date
        - region
        - country
        - variant
        - freqMi
        - population
    Output DataFrame will have the following columns:
        - date
        - region
        - variant
        - freqMi
    """

    df = df.clone()

    # Remove all rows for which region == country
    # df = df.filter(c("region") != c("country"))

    # rdm = {"region":list(region_dict.keys()), "population":list(region_dict.values())}
    region_pop = pl.from_dict(
        {
            "region": list(region_dict.keys()),
            "region_population": list(region_dict.values()),
        }
    )

    # Get non-represented countries and impute from region
    # Need a df with column: region, represented_population, total_population, missing_population, freqMi
    represented_pop = (
        df.filter((c("region") != c("country")) & (c("country") != "other"))
        .unique("country")
        .groupby("region")
        .agg(represented_pop=c("population").sum())
    )

    region_pop_df = (
        represented_pop.join(region_pop, on="region", how="left")
        .select(["region", "represented_pop", "region_population"])
        .with_columns(missing_pop=c("region_population") - c("represented_pop"))
    )

    prepped_df = (
        df.join(region_pop_df, on="region", how="left")
        .with_columns(
            population=pl.when(c("country") == "other").then(c("missing_pop"))
            # .then(1000000000)
            # .then(10000000000)
            .otherwise(c("population"))
        )
        .filter(c("region") != c("country"))
    )

    print(prepped_df)

    # Group by region
    # Create new columns "freqMi_weighted_sum", "freqLo_weighted_sum", "freqUp_weighted_sum"
    # Divide by "population_sum" to get the weighted average
    df = (
        prepped_df.with_columns(
            freqMi_pop_product=c("freqMi") * c("population"),
            freqErr_pop_product=pl.max(
                [c("freqMi") - c("freqLo"), c("freqUp") - c("freqMi")]
            )
            ** 2 # square it
            * c("population"),
        )
        .groupby(["date", "region", "variant"])
        .agg(
            freqMi_pop_product_sum=c("freqMi_pop_product").sum(),
            freqErr_pop_product_sum=c("freqErr_pop_product").sum(),
            population_sum=c("population").sum(),
        )
        .join(region_pop, on="region", how="left")
        .select(
            ["date", "region", "variant"],
            freqMi=c("freqMi_pop_product_sum") / c("population_sum"),
            freqErr=(c("freqErr_pop_product_sum") / c("population_sum")).sqrt()
        )
        .select(
            pl.exclude("freqErr"),
            freqLo=pl.max([c("freqMi") - c("freqErr"), 0]),
            freqUp=pl.min([c("freqMi") + c("freqErr"), 1]),
        )
    )

    print(df)

    return df


def main(
    fit_results: Annotated[
        str, Option()
    ] = "results/h3n2/region-country-frequencies.csv",
    pop_size: Annotated[
        str, Option()
    ] = "defaults/country_region_population.csv",
    output_csv: Annotated[
        str, Option()
    ] = "results/h3n2/region-country-frequencies-pop-weighted.csv",
):
    """Script to aggregate results from a lower hierarchy to a higher one"""
    # Read in fit results
    df_fit_results = pl.read_csv(fit_results)

    # Read in population sizes
    # The population file also provides hierarchy information for each country
    # Necessary for imputing frequencies for countries not listed in fit results
    df_pop_size = pl.read_csv(pop_size).with_columns(
        country=c("country").str.replace("China", "China(PRC)")
    )

    # Calculate region population
    region_dict = dict(
        df_pop_size.groupby("region")
        .agg(population=c("population").sum())
        .iter_rows()
    )

    # Join population sizes to fit results on country
    df = df_fit_results.join(
        df_pop_size.select(["country", "population"]), on="country", how="left"
    )

    # Print out countries not in population file
    print("Countries not in population file:")
    print(
        df.filter(c("population").is_null() & (c("region") != c("country")))
        .get_column("country")
        .unique()
        .to_list()
    )

    # Calculate weighted average for each region
    weighted = weighted_average(df, region_dict).sort(
        ["region", "variant", "date"]
    )

    print(weighted)

    df = weighted.join(
        df.filter(c("country") == c("region")).select(
            ["date", "region", "variant", "count", "total"]
        ),
        on=["date", "region", "variant"],
        how="left",
    ).with_columns(
        country=c("region"),
    )

    # For weighted freqLo and freqHi estimate the uncertainty in the original region data (treating Lo/Hi as 2SD of a beta distribution)
    # Using this parametrization, get the effective sample size
    # Use this effective sample size to get confidence intervals for the weighted average (can be read off from the beta distribution)

    # Generate weighted freqLo and freqHi
    # based on estimated sample size of beta distribution for unweighted
    # ess=mean_lo_hi.apply(lambda t: get_ess(round(t[1],1), (round(t[2],1), round(t[3],1))))
    # new_ci = mean_lo_hi.apply(
    #     lambda t: get_new_ci(
    #         t[0], round(t[1], 2), (round(t[2], 2), round(t[3], 2))
    #     )
    # )  # .select(freqLo=c("column_0"), freqUp=c("column_1"))

    # Generate new dataframes: one for unweighted, one for weighted
    # One takes the freqMi column and has _weighted suffix in region names
    # Other gets freqMi_unweighted and has _unweighted suffix in region names

    # Concatenate the two dataframes

    print(df)

    # Write out the data
    df.write_csv(output_csv, float_precision=5)

    # For each region, calculate the population weighted average
    pass


if __name__ == "__main__":
    typer.run(main)
