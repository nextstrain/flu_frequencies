import matplotlib.pyplot as plt
import json, datetime
import numpy as np

if __name__=='__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--frequencies", type=str, help="json")
    parser.add_argument("--region", type=str, help="region to plot")
    parser.add_argument("--country", type=str, help="country to plot")
    parser.add_argument("--max-freq", type=float, help="plot clades above this frequencies")
    parser.add_argument("--output", type=str, help="mask containing `{cat}` to plot")

    args = parser.parse_args()

    with open(args.frequencies, 'r') as fh:
        d = json.load(fh)


    dates = [datetime.datetime.strptime(x, "%Y-%m-%d") for x in d['dates'].values()]
    region = args.region.replace('_', ' ')
    country = args.country.replace('-', ' ')
    fig = plt.figure()
    label = f"frequencies-{country}"
    plt.title(args.country)
    for ci,clade in enumerate(sorted(d[region]["frequencies"])):
        freqs = [d[region][label][clade][t]['val'] for t in d["dates"]]
        if max(freqs)<args.max_freq: continue
        plt.plot(dates, [d[region]['counts'][clade][country].get(t, 0)/d[region]['totals'][country].get(t,0)
                            if d[region]['counts'][clade][country].get(t, 0) else np.nan
                                for t in d['dates']], 'o', c=f"C{ci}")
        plt.plot(dates, freqs, c=f"C{ci}", label=clade)
        plt.fill_between(dates,
                        [d[region][label][clade][t]['lower'] for t in d["dates"]],
                        [d[region][label][clade][t]['upper'] for t in d["dates"]], color=f"C{ci}", alpha=0.2)
    fig.autofmt_xdate()
    plt.legend(loc=2)
    plt.savefig(args.output)
