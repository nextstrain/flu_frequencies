import polars as  pl
from datetime import datetime
import numpy as np
import json
from fit_single_frequencies import fit_single_category, load_and_aggregate
from collections import defaultdict

def cluster_trajectories(trajs):
    by_time_point = defaultdict(list)
    for (fcat, fi), traj in trajs.items():
        by_time_point[fi].append((fcat, traj))

    collapsed_trajs = defaultdict(list)
    for fi in by_time_point:
        tmp_traj = []
        tmp_names = []
        for fcat, traj in by_time_point[fi]:
            found = False
            for n,c in zip(tmp_names, tmp_traj):
                if np.mean(traj - np.mean(c, axis=0))**2 < (0.05)**2 and np.max(np.abs(traj - np.mean(c, axis=0)))<0.1:
                    c.append(traj)
                    n.append(fcat)
                    tmp_names
                    found=True
                    break
            if found==False:
                tmp_traj.append([traj])
                tmp_names.append([fcat])
        for n,c in zip(tmp_names, tmp_traj):
            collapsed_trajs[str(fi) + '_' + ','.join(n)] = [float(x) for x in np.mean(c, axis=0)]

    return collapsed_trajs


if __name__=='__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", type=str, help="filename with metadata")
    parser.add_argument("--days", default=7, type=int, help="number of days in one time bin")
    parser.add_argument("--min-date", type=str, help="date to start frequency calculation")
    parser.add_argument("--max-date", type=str, help="date to end frequency calculation")
    parser.add_argument("--cutoff", type=float, default=0.1)
    parser.add_argument("--output-plot", type=str, help="file for plot output")
    parser.add_argument("--output-json", type=str, help="file for data")

    args = parser.parse_args()
    stiffness = 500/args.days
    count_cutoff = 30*args.days/30
    n_pre = 360//args.days
    n_past = 3*360//args.days
    plot_threshold=0.3  ## threshold window for example trajectories
    width = 0.1
    thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
    # width = 0.2
    # thresholds = [0.1, 0.3, 0.5, 0.7]

    d = pl.read_csv(args.metadata, separator='\t', try_parse_dates=False, columns=["region", "aaSubstitutions", 'date']).select(['date', "region", "aaSubstitutions"])
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
        f = count/sequence_count_by_year[year]
        if f*(1-f)>args.cutoff:
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
    average_trajectories = []
    std_trajectories = []
    all_trajectories = {}
    time_axis = np.arange(-n_pre,n_past)*args.days
    axs[0].fill_between(time_axis[n_pre:], np.ones_like(time_axis[n_pre:])*plot_threshold,
                        np.ones_like(time_axis[n_pre:])*plot_threshold+width, color='k', alpha=0.2)
    axs[0].plot([0,0], [0,1], c='k', lw=1)
    for threshold in thresholds:
        normalized_traj = {}
        for fcat in frequencies:
            new_mut = False
            freqs = [x['val'] for x in frequencies[fcat].values()]
            counts = traj_counts[fcat]
            for fi, f in enumerate(freqs[:-(n_past//3)]):
                if max(freqs[fi:n_pre+fi])<0.03:
                    new_mut=True
                # take new trajectories that cross into the window from below
                if new_mut and f>threshold and freqs[fi-1]<threshold and counts[fi][1]>count_cutoff and f<threshold+width:
                    normalized_traj[(fcat, fi)] = freqs[fi-n_pre:fi+n_past] + [freqs[len(freqs)-1]]*max(0,fi+n_past - len(freqs))
                    new_mut = False
                # exclude trajectories that overshoot the window
                if fi and max(freqs[max(0,fi-n_pre):fi])>threshold+width:
                    new_mut = False


        collapsed_trajs = cluster_trajectories(normalized_traj)
        print(f"range {threshold:1.2f}--{threshold+width:1.2f}: {len(normalized_traj)} trajectories, clustered {len(collapsed_trajs)}")
        normalized_traj_array = np.array([x for x in collapsed_trajs.values()])
        average_trajectories.append(normalized_traj_array.mean(axis=0))
        std_trajectories.append(normalized_traj_array.std(axis=0)/np.sqrt(normalized_traj_array.shape[0]))
        all_trajectories[threshold] = collapsed_trajs
        if np.abs(threshold-plot_threshold)<1e-6:
            for traj in normalized_traj_array:
                axs[0].plot(time_axis, traj, c='C0' if traj[-1]<threshold else 'C1')
            axs[0].plot(time_axis, average_trajectories[-1], lw=3, color='k', alpha=0.5)
    axs[0].set_xlabel('days')
    axs[0].set_ylabel('frequency')

    for ti, traj in enumerate(average_trajectories):
        axs[1].plot(time_axis, traj, lw=2, c=f"C{ti}")
        axs[1].plot([0,time_axis[-1]],[thresholds[ti]+width*0.5, thresholds[ti]+width*0.5] , lw=2, c=f"C{ti}", alpha=0.5)
        axs[1].fill_between(time_axis, traj-std_trajectories[ti], traj+std_trajectories[ti], color=f"C{ti}", alpha=0.3)
    axs[1].set_xlabel('days')
    axs[0].plot([0,0], [0,1], c='k', lw=1)

    plt.savefig(args.output_plot)

    with open(args.output_json, 'w') as fh:
        json.dump({'time_points': [float(x) for x in time_axis], 'trajectories': all_trajectories}, fh)


    # t = [time_bins[ti] for ti in time_bins]
    # for fcat in frequencies:
    #     freqs = [x['val'] for x in frequencies[fcat].values()]
    #     if freqs[0]<0.2:
    #         plt.plot(t, freqs, c='C0' if freqs[-1]>0.5 else 'C1')
