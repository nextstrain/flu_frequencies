import matplotlib.pyplot as plt
import datetime
import polars  as pl
import numpy as np

if __name__=='__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--frequencies", type=str, help="csv")
    parser.add_argument("--region", type=str, help="region to plot")
    parser.add_argument("--country", type=str, help="country to plot")
    parser.add_argument("--max-freq", type=float, help="plot clades above this frequencies")
    parser.add_argument("--output", type=str, help="mask containing `{cat}` to plot")

    args = parser.parse_args()

    d = pl.read_csv(args.frequencies, try_parse_dates=True)

    region = args.region.replace('_', ' ')
    country = args.country.replace('-', ' ')
    clades = sorted(d['variant'].fill_null('other').unique())
    fig = plt.figure()

    d = d.filter((pl.col('region')==region)&(pl.col('country')==country))
    plt.title(args.country)
    for ci,clade in enumerate(clades):
        subset = d.filter( pl.col('variant')==clade ).sort(by='date')
        dates = list(subset['date'])
        if max(subset['freqMi'])<args.max_freq: continue

        plt.plot(dates, [subset[i,'count']/subset[i,'total'] if subset[i,'total'] else np.nan
                                for i in range(len(dates))], 'o', c=f"C{ci}")
        plt.plot(dates, list(subset['freqMi']), c=f"C{ci}", label=clade)
        plt.fill_between(dates,
                        list(subset["freqLo"]),
                        list(subset["freqUp"]), color=f"C{ci}", alpha=0.2)
        print(clade, max(subset['freqUp']))
    fig.autofmt_xdate()
    plt.legend(loc=2)
    plt.savefig(args.output)
