import polars as  pl
from datetime import datetime
import numpy as np
from fit_single_frequencies import fit_single_category, load_and_aggregate
from collections import defaultdict

if __name__=='__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", type=str, help="filename with metadata")
    parser.add_argument("--geo-categories", nargs='+', type=str, help="field to use for geographic categories")
    parser.add_argument("--days", default=7, type=int, help="number of days in one time bin")
    parser.add_argument("--min-date", type=str, help="date to start frequency calculation")
    parser.add_argument("--max-date", type=str, help="date to end frequency calculation")
    parser.add_argument("--cutoff", type=float, default=0.1)
    parser.add_argument("--output", type=str, help="file for json output")

    args = parser.parse_args()
    stiffness = 500/args.days

    d = pl.read_csv(args.metadata, separator='\t', try_parse_dates=False, columns=["region", "aaSubstitutions", 'date'])
    d = d.filter((pl.col('date')>=args.min_date)&(pl.col('date')<args.max_date))

    mutation_count_by_year = defaultdict(int)
    sequence_count_by_year = defaultdict(int)

    for row in d.iter_rows():
        year = int(row[0][:4])
        try:
            for mut in row[2].split(','):
                mutation_count_by_year[(year, mut[:-1])]+=1
            sequence_count_by_year[year]+=1
        except:
            pass


    mutations_to_keep = set()
    for (year, mut), count in mutation_count_by_year.items():
        if count/sequence_count_by_year[year]>args.cutoff:
            mutations_to_keep.add(mut)


    def extract_mut(muts, mutation):
        if type(muts)==str:
            a = [y for y in muts.split(',') if y.startswith(mutation)]
            return a[0] if len(a) else mutation
        else:
            return mutation

    new_columns = []
    for mut in mutations_to_keep:
        new_columns.append(d["aaSubstitutions"].apply((lambda x:extract_mut(x, mut))).alias(mut))

    d = d.with_columns(new_columns + [pl.col('date').apply(lambda x:'dummy').alias('dummy'),
                        pl.col("date").str.strptime(pl.Date, format="%Y-%m-%d", strict=False)])

    frequencies = {}
    traj_counts = {}
    for mut in mutations_to_keep:
        print(mut)
        data, tmp_totals, counts, time_bins = load_and_aggregate(d, ['dummy'], mut,
                                                    bin_size=args.days, min_date=args.min_date)

        geo_label = 'dummy'
        totals = {k[-1]:v for k,v in tmp_totals.items() if k[0]==geo_label}
        sub_counts = {}
        for fcat in counts.keys():
            sub_counts[fcat] = {k[-1]:v for k,v in counts[fcat].items() if k[0]==geo_label}
            freqs, A = fit_single_category(totals, sub_counts[fcat],
                                           sorted(time_bins.keys()), stiffness=stiffness)

            if max([x['val'] for x in freqs.values()])>args.cutoff and min([x['val'] for x in freqs.values()])<1-args.cutoff:
                frequencies[fcat] = freqs
                traj_counts[fcat] = [(sub_counts[fcat].get(ti,0), totals.get(ti,0)) for ti in time_bins]
                print(len(frequencies), fcat)


    import matplotlib.pyplot as plt
    fig, axs = plt.subplots(1,2, figsize=(12,5))
    n_pre = 720//args.days
    n_past = 6*360//args.days
    width = 0.1
    average_trajectories = []
    std_trajectories = []
    all_trajectories = {}
    time_axis = np.arange(-n_pre,n_past)*args.days
    plot_threshold=0.3
    thresholds = np.linspace(0.1, 0.8, 8)
    axs[0].fill_between(time_axis[n_pre:], np.ones_like(time_axis[n_pre:])*plot_threshold,
                        np.ones_like(time_axis[n_pre:])*plot_threshold+width, color='k', alpha=0.2)
    axs[0].plot([0,0], [0,1], c='k', lw=1)
    for threshold in thresholds:
        normalized_traj = {}
        for fcat in frequencies:
            new_mut = False
            freqs = [x['val'] for x in frequencies[fcat].values()]
            counts = traj_counts[fcat]
            for fi, f in enumerate(freqs[:-(n_past//2)]):
                if max(freqs[fi:n_pre+fi])<0.03:
                    new_mut=True
                if new_mut and f>threshold and freqs[fi-1]<threshold and counts[fi][1]>300 and f<threshold+width:
                    normalized_traj[(fcat, fi)] = freqs[fi-n_pre:fi+n_past] + [freqs[len(freqs)-1]]*max(0,fi+n_past - len(freqs))
                    new_mut = False
                if fi and max(freqs[max(0,fi-n_pre):fi])>threshold+width:
                    new_mut = False


        normalized_traj_array = np.array([x for x in normalized_traj.values()])
        average_trajectories.append(normalized_traj_array.mean(axis=0))
        std_trajectories.append(normalized_traj_array.std(axis=0)/np.sqrt(normalized_traj_array.shape[0]))
        all_trajectories[threshold] = normalized_traj
        if np.abs(threshold-plot_threshold)<1e-6:
            for traj in normalized_traj_array:
                axs[0].plot(time_axis, traj, c='C0' if traj[-1]<threshold else 'C1')
            axs[0].plot(time_axis, average_trajectories[-1], lw=3, color='k', alpha=0.5)
    axs[0].set_xlabel('days')
    axs[0].set_ylabel('frequency')

    for ti, traj in enumerate(average_trajectories):
        axs[1].plot(time_axis, traj, lw=2, c=f"C{ti}")
        axs[1].plot([0,time_axis[-1]],[thresholds[ti]+width*0.5, thresholds[ti]+width*0.5] , lw=2, c='k', alpha=0.5)
        axs[1].fill_between(time_axis, traj-std_trajectories[ti], traj+std_trajectories[ti], color=f"C{ti}", alpha=0.3)
    axs[1].set_xlabel('days')

    plt.savefig(args.output)


