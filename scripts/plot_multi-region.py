import matplotlib.pyplot as plt
import polars as pl
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


    d = pl.read_csv(args.frequencies, parse_dates=True)
    clades = sorted(d['variant'].unique())
    all_dates = sorted(d['date'].unique())

    regions = [x.replace('_', ' ') for x in args.regions]

    n_regions = len(regions)
    n_rows = int(np.ceil(n_regions/2))
    fig, axs = plt.subplots(n_rows,2, sharex=True, sharey=True, figsize=(10,3*n_rows))
    clades_to_plot = set()

    for region in regions:
        for clade in clades:
            subset = d.filter((pl.col('region')==region)&(pl.col('variant')==clade)).sort(by='date')
            if len(subset) and max(subset['freqMi'])>args.max_freq:
                clades_to_plot.add(clade)

    clades_to_plot = sorted(clades_to_plot)

    for ri, region in enumerate(regions):
        ax = axs[ri//2, ri%2]
        ax.grid(color='grey', alpha=0.2)
        for ci,clade in enumerate(clades_to_plot):
            clade_color = color_map.get(clade, f"C{ci}")
            subset = d.filter((pl.col('region')==region)&(pl.col('variant')==clade)).sort(by='date')
            dates = subset['date']
            if len(subset):
                ax.plot(dates, [subset[i,'count']/subset[i,'total'] if subset[i,'total'] else np.nan
                                        for i in range(len(dates))], 'o', c=clade_color)
                ax.plot(dates, subset['freqMi'], c=clade_color, label=clade)
                ax.fill_between(dates,
                                subset["freqLo"],
                                subset["freqUp"], color=clade_color, alpha=0.2)
            else:
                ax.plot(all_dates[:2], [0,0], label=clade, c=clade_color)
        ax.plot(all_dates, np.ones(len(all_dates)), c='k', alpha=0.5)
        ax.text(all_dates[len(all_dates)//2], 1.1, region)
        ax.set_ylim(0,1.2)
    fig.autofmt_xdate()
    axs[0,0].legend(loc=3, ncol=2)
    plt.tight_layout()
    plt.savefig(args.output)
