import matplotlib.pyplot as plt
import polars as pl
import numpy as np

if __name__=='__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--frequencies", type=str, help="csv")
    parser.add_argument("--region", type=str, help="regions to plot")
    parser.add_argument("--max-freq", type=float, help="plot clades above this frequencies")
    parser.add_argument("--output", type=str, help="mask containing `{cat}` to plot")

    args = parser.parse_args()
    d = pl.read_csv(args.frequencies, parse_dates=True)
    clades = sorted(d['variant'].unique())
    region = args.region.replace('_', ' ')
    d = d.filter(pl.col('region')==region)

    fig = plt.figure()
    plt.title(region)
    for ci,clade in enumerate(clades):
        subset = d.filter( pl.col('variant')==clade ).sort(by='date')
        dates = subset['date']
        if len(subset)==0 or max(subset['freqMi'])<args.max_freq: continue

        plt.plot(dates, [subset[i,'count']/subset[i,'total'] if subset[i,'total'] else np.nan
                                for i in range(len(dates))], 'o', c=f"C{ci}")
        plt.plot(dates, subset['freqMi'], c=f"C{ci}", label=clade)
        plt.fill_between(dates,
                        subset["freqLo"],
                        subset["freqUp"], color=f"C{ci}", alpha=0.2)

    fig.autofmt_xdate()
    plt.legend(loc=2)
    plt.savefig(args.output)
