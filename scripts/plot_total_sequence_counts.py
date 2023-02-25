import polars as  pl
from datetime import datetime,timedelta
import numpy as np
from fit_single_frequencies import load_and_aggregate
import  matplotlib.pyplot as plt

if __name__=='__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", nargs='+', type=str, help="filename with metadata")
    parser.add_argument("--names", nargs='+', type=str, help="filename with metadata")
    parser.add_argument("--days", default=7, type=int, help="number of days in one time bin")
    parser.add_argument("--min-date", type=str, help="date to start frequency calculation")
    parser.add_argument("--output-plot", type=str, help="file for json output")
    fs=14
    args = parser.parse_args()

    plt.figure(figsize=(10,6))
    for fname, name in zip(args.metadata, args.names):
        d = pl.read_csv(fname, sep='\t', parse_dates=False, columns=['date'])

        d = d.with_columns([pl.col("date").str.strptime(pl.Date, fmt="%Y-%m-%d", strict=False),
                            pl.col('date').apply(lambda x:'dummy').alias('dummy')])

        data, totals, counts, time_bins = load_and_aggregate(d, ['dummy'], 'dummy',
                                                            bin_size=args.days, min_date=args.min_date)
        if 'H1N1pdm' in name:
            time_bins = {k:v for k,v in time_bins.items() if v>datetime(2009,3,1) - timedelta(days=args.days)}
        if 'SARS-CoV-2' in name:
            time_bins = {k:v for k,v in time_bins.items() if v>datetime(2019,12,1) - timedelta(days=args.days)}
        if 'Yam' not in name:
            time_bins = {k:v for k,v in list(time_bins.items())[:-1]}

        plt.plot(time_bins.values(), [totals[('dummy', x)] for x in time_bins], label=name, lw=2)

    plt.tight_layout()
    plt.yscale('log')
    plt.legend(loc=2, fontsize=fs)
    plt.tick_params(labelsize=0.8*fs)
    plt.savefig(args.output_plot)


