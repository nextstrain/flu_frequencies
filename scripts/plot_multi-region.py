import matplotlib.pyplot as plt
import json, datetime
import numpy as np

if __name__=='__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--frequencies", type=str, help="json")
    parser.add_argument("--regions", nargs='+', type=str, help="regions to plot")
    parser.add_argument("--max-freq", type=float, help="plot clades above this frequencies")
    parser.add_argument("--auspice-config", help="Auspice config JSON with custom colorings for clades defined in a scale")
    parser.add_argument("--output", type=str, help="mask containing `{cat}` to plot")

    args = parser.parse_args()

    color_map = {}
    if args.auspice_config:
        with open(args.auspice_config, "r", encoding="utf-8") as fh:
            auspice_config = json.load(fh)

        if "colorings" in auspice_config:
            for coloring in auspice_config["colorings"]:
                if coloring["key"] == "clade_membership":
                    if "scale" in coloring:
                        print(f"Using color map defined in {args.auspice_config}")
                        color_map = {
                            clade: color
                            for clade, color in coloring["scale"]
                        }

                    break

    with open(args.frequencies, 'r') as fh:
        d = json.load(fh)

    dates = [datetime.datetime.strptime(x, "%Y-%m-%d") for x in d['dates'].values()]
    regions = [x.replace('_', ' ') for x in args.regions]
    n_regions = len(regions)
    n_rows = int(np.ceil(n_regions/2))
    fig, axs = plt.subplots(n_rows,2, sharex=True, sharey=True, figsize=(10,3*n_rows))
    clades_to_plot = set()
    for region in regions:
        for clade in d[region]["frequencies"]:
            freqs = [d[region]["frequencies"][clade][t]['val'] for t in d["dates"]]
            if max(freqs)>args.max_freq:
                clades_to_plot.add(clade)
    clades_to_plot = sorted(clades_to_plot)

    for ri, region in enumerate(regions):
        ax = axs[ri//2, ri%2]
        ax.grid(color='grey', alpha=0.2)
        for ci,clade in enumerate(clades_to_plot):
            clade_color = color_map.get(clade, f"C{ci}")

            if clade in d[region]["frequencies"]:
                freqs = [d[region]["frequencies"][clade][t]['val'] for t in d["dates"]]
                ax.plot(dates, [d[region]['counts'][clade].get(t, 0)/d[region]['totals'].get(t,0)
                                    if d[region]['totals'].get(t, 0) else np.nan
                                        for t in d['dates']], 'o', c=clade_color)
                ax.plot(dates, freqs, c=clade_color, label=clade if ri==0 else '')
                ax.fill_between(dates,
                                [d[region]["frequencies"][clade][t]['lower'] for t in d["dates"]],
                                [d[region]["frequencies"][clade][t]['upper'] for t in d["dates"]], color=clade_color, alpha=0.2)
            else:
                ax.plot(dates[:2], [0,0], label=clade, c=clade_color)
        ax.plot(dates, np.ones(len(dates)), c='k', alpha=0.5)
        ax.text(dates[len(dates)//2], 1.1, region)
        ax.set_ylim(0,1.2)
    fig.autofmt_xdate()
    axs[0,0].legend(loc=3, ncol=2)
    plt.tight_layout()
    plt.savefig(args.output)
