"""
Script to aggregate results from a lower hierarchy to a higher one
Input:
    - variant/country frequences from fit_hierarchical_frequencies
    - population sizes
Output:
    - csv file similar to the one from fit_hierarchical_frequencies
      but with higher level estimate replaced by pop weighted average
"""

from pathlib import Path
from typing import Annotated

import polars as pl
import typer


def weighted_average(df: pl.DataFrame):
    """Calculate weighted average for a region"""

    df = df.clone()
    # Create new column with each of "freqMi", "freqLo", "freqUp" multiplied by "population"
    # Name the new columns "freqMi_weighted", "freqLo_weighted", "freqUp_weighted"
    df = df.with_columns(
        (pl.col("freqMi") * pl.col("population")).alias("freqMi_weighted"),
        (pl.col("freqLo") * pl.col("population")).alias("freqLo_weighted"),
        (pl.col("freqUp") * pl.col("population")).alias("freqUp_weighted"),
    )

    # Remove all rows for which region == country
    df = df.filter(pl.col("region") != pl.col("country"))

    # Group by region
    # Create new columns "freqMi_weighted_sum", "freqLo_weighted_sum", "freqUp_weighted_sum"
    # Divide by "population_sum" to get the weighted average
    df = (
        df.groupby(["date", "region", "variant"])
        .agg(
                pl.col("freqMi_weighted").sum().alias("freqMi_weighted_sum"),
                pl.col("freqLo_weighted").sum().alias("freqLo_weighted_sum"),
                pl.col("freqUp_weighted").sum().alias("freqUp_weighted_sum"),
                pl.col("population").sum().alias("population_sum"),
        )
        .with_columns(
            (pl.col("freqMi_weighted_sum") / pl.col("population_sum")).alias("freqMi"),
            (pl.col("freqLo_weighted_sum") / pl.col("population_sum")).alias("freqLo"),
            (pl.col("freqUp_weighted_sum") / pl.col("population_sum")).alias("freqUp"),
        )
    )

    # print(df)

    return df




def main(
    fit_results: Annotated[Path, typer.Option()] = "results/h3n2/region-country-frequencies.csv",
    pop_size: Annotated[Path, typer.Option()] = "defaults/population.csv",
    output_csv: Annotated[Path, typer.Option()] = "results/h3n2/region-country-frequencies-pop-weighted.csv",
):
    """Script to aggregate results from a lower hierarchy to a higher one"""
    # Read in fit results
    df_fit_results = pl.read_csv(fit_results)

    # Read in population sizes
    df_pop_size = pl.read_csv(pop_size)

    # Join population sizes to fit results on country
    df = df_fit_results.join(df_pop_size, on="country", how="left")

    # Print out the first few rows of the data
    # print(df)

    weighted = weighted_average(df)

    # Subset weighted to "date", "region", "variant", "freqMi", "freqLo", "freqUp"
    weighted = weighted[
        ["date", "region", "variant", "freqMi", "freqLo", "freqUp"]
    ]

    # Join the weighted average back to the original data
    df = weighted.join(df, on=["date", "region", "variant"], how="left", suffix="_unweighted")

    # Keep only rows where region=country and remove country column
    df = df.filter(pl.col("region") == pl.col("country"))

    print(df)

    # Write out the data
    df.write_csv(output_csv, float_precision=5)

    

    # For each region, calculate the population weighted average
    pass


if __name__ == "__main__":
    typer.run(main)


