import matplotlib.pyplot as plt
import json, datetime
import numpy as np

if __name__=='__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--frequencies", type=str, help="json")
    parser.add_argument("--region", type=str, help="regions to plot")
    parser.add_argument("--clades", nargs='+', type=str, help="plots")
    parser.add_argument("--output", type=str, help="mask containing `{cat}` to plot")

    args = parser.parse_args()

    with open(args.frequencies, 'r') as fh:
        d = json.load(fh)


    dates = [datetime.datetime.strptime(x, "%Y-%m-%d") for x in d['dates'].values()]
    region = args.region.replace('_', ' ')
    fig = plt.figure()
    for ci,clade in enumerate(args.clades):
        if clade not in d[region]["frequencies"]: continue
        plt.plot(dates, [d[region]['counts'][clade].get(t, 0)/d[region]['totals'].get(t,0)
                            if d[region]['counts'][clade].get(t, 0) else np.nan
                                for t in d['dates']], 'o', c=f"C{ci}")
        plt.plot(dates, [d[region]["frequencies"][clade][t]['val'] for t in d["dates"]], c=f"C{ci}", label=clade)
        plt.fill_between(dates,
                        [d[region]["frequencies"][clade][t]['lower'] for t in d["dates"]],
                        [d[region]["frequencies"][clade][t]['upper'] for t in d["dates"]], color=f"C{ci}", alpha=0.2)
    fig.autofmt_xdate()
    plt.legend(loc=2)
    plt.savefig(args.output)
