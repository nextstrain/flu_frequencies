import pandas as  pd
import numpy as np
from fit_single_frequencies import load_and_aggregate, zero_one_clamp
import matplotlib.pyplot as plt

def fit_hierarchical_frequencies(totals, counts, time_bins, stiffness=0.5, stiffness_minor=0.1, mu=0.3):

    minor_cats = list(totals.keys())
    n_tp = len(time_bins)
    pc=3
    values, column, row = [], [], []
    b = []
    sq_confidence = []
    # deal with major frequency parameters
    for ti, t in enumerate(time_bins):
        if ti==0:
            diag = stiffness
            values.append(-stiffness); row.append(ti); column.append(ti+1)
        elif ti==n_tp-1:
            diag = stiffness
            values.append(-stiffness); row.append(ti); column.append(ti-1)
        else:
            diag = 2*stiffness
            values.append(-stiffness); row.append(ti); column.append(ti+1)
            values.append(-stiffness); row.append(ti); column.append(ti-1)

        res = 0
        b_res = 0
        total_n = 0
        total_k = 0
        for ci, cat in enumerate(minor_cats):
            k = counts.get(cat, {}).get(t, 0)
            n = totals.get(cat, {}).get(t, 0)
            pre_fac = n**2/(k + pc)/(n - k + pc)
            values.append(n*pre_fac); row.append(ti); column.append(ti + (ci+1)*n_tp)
            total_n += n
            total_k += k
            res += n*pre_fac
            b_res += k*pre_fac

        pre_fac = total_n**2/(total_k + pc)/(total_n - total_k + pc)
        extra_major = 1.0
        values.append(diag + res + extra_major*total_n*pre_fac); row.append(ti); column.append(ti)
        sq_confidence.append((total_k + pc)*(total_n - total_k + pc)/(total_n**3+pc))
        b.append(b_res + extra_major*total_k*pre_fac)


    # deal with frequency adjustment parameters
    for ci, cat in enumerate(minor_cats):
        for ti, t in enumerate(time_bins):
            row_index = ti + (ci+1)*n_tp
            if ti==0:
                diag = stiffness_minor
                values.append(-stiffness_minor); row.append(row_index); column.append(row_index+1)
            elif ti==n_tp-1:
                diag = stiffness_minor
                values.append(-stiffness_minor); row.append(row_index); column.append(row_index-1)
            else:
                diag = 2*stiffness_minor
                values.append(-stiffness_minor); row.append(row_index); column.append(row_index+1)
                values.append(-stiffness_minor); row.append(row_index); column.append(row_index-1)

            k = counts.get(cat, {}).get(t, 0)
            n = totals.get(cat, {}).get(t, 0)
            pre_fac = n**2/(k + pc)/(n - k + pc)
            diag += n*pre_fac
            values.append(diag + mu); row.append(row_index); column.append(row_index)
            values.append(n*pre_fac); row.append(row_index); column.append(ti)
            sq_confidence.append(1.0/((n**3+pc)/(k+pc)/(n-k+pc) + mu))
            b.append(k*pre_fac)

    from scipy.sparse import csr_matrix
    from scipy.sparse.linalg import spsolve
    A = csr_matrix((values, (row, column)), shape=(len(b), len(b)))
    sol = spsolve(A,b)

    freqs = {"time_points": time_bins}
    freqs["major_frequencies"] = {t:{"val": zero_one_clamp(sol[ti]),
                                     "upper":zero_one_clamp(sol[ti]+np.sqrt(sq_confidence[ti])),
                                     "lower":zero_one_clamp(sol[ti]-np.sqrt(sq_confidence[ti]))}
                                     for ti,t in enumerate(time_bins)}
    for ci, cat in enumerate(minor_cats):
        freqs[cat] = {}
        for ti,t in enumerate(time_bins):
            row_index = ti + (ci+1)*n_tp
            val = zero_one_clamp(sol[ti] + sol[row_index])
            dev = np.sqrt(sq_confidence[ti] + sq_confidence[row_index])
            freqs[cat][t] = {"val": val, "upper": zero_one_clamp(val+dev), "lower": zero_one_clamp(val-dev)}

    return freqs

if __name__=='__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", type=str, help="filename with metadata")
    parser.add_argument("--frequency-category", type=str, help="field to use for frequency categories")
    parser.add_argument("--geo-categories", nargs='+', type=str, help="field to use for geographic categories")
    parser.add_argument("--days", default=7, type=int, help="number of days in one time bin")
    parser.add_argument("--min-date", type=str, help="date to start frequency calculation")
    parser.add_argument("--output-json", type=str, help="output json file")

    args = parser.parse_args()

    data, totals, counts, time_bins = load_and_aggregate(args.metadata, args.geo_categories, args.frequency_category,
                                                         bin_size=args.days, min_date=args.min_date)

    dates = [time_bins[k] for k in time_bins]

    major_geo_cats = set([tuple(k[:-2]) for k in totals])
    output_data = {"dates": {t:v.strftime('%Y-%m-%d') for t,v in time_bins.items()}}
    # major_geo_cats = set([('Europe',)])
    stiffness = 50000/args.days
    for geo_cat in major_geo_cats:
        minor_geo_cats = set([k[-2] for k in totals if k[:-2]==geo_cat])
        sub_totals = {}
        data_totals = {}
        for minor_geo_cat  in minor_geo_cats:
            tmp = {k[-1]:v for k,v in totals.items() if k[:-2]==geo_cat and k[-2]==minor_geo_cat}
            data_totals[minor_geo_cat] = sum(tmp.values())
            if data_totals[minor_geo_cat]>100:
                sub_totals[minor_geo_cat] = tmp
        sub_counts = {}
        frequencies = {}
        for fcat in counts.keys():
            sub_counts[fcat] = {}
            for minor_geo_cat in sub_totals:
                sub_counts[fcat][minor_geo_cat] = {k[-1]:v for k,v in counts[fcat].items()
                    if k[:-2]==geo_cat and k[-2]==minor_geo_cat}
            frequencies[fcat] = fit_hierarchical_frequencies(sub_totals, sub_counts[fcat],
                                    sorted(time_bins.keys()), stiffness=stiffness,
                                    stiffness_minor=stiffness, mu=5.0)
        output_data[','.join(geo_cat)] = {"counts": sub_counts, "totals": sub_totals,
                                "frequencies":{fcat:frequencies[fcat]["major_frequencies"] for fcat in frequencies}}

        for minor_geo_cat in minor_geo_cats:
            try:
                output_data[','.join(geo_cat)][f"frequencies-{minor_geo_cat}"] = {fcat:frequencies[fcat][minor_geo_cat] for fcat in frequencies}
            except:
                pass


        if sum(data_totals.values())<2000: continue

        fig=plt.figure()
        plt.title(', '.join(geo_cat))
        ls = ['--', '-.', ':']
        for fi, fcat in enumerate(frequencies):
            col = f"C{fi}"
            plt.plot(dates,
                    [frequencies[fcat]["major_frequencies"][t]['val'] for t in frequencies[fcat]["time_points"]], c=col)
            plt.fill_between(dates,
                    [frequencies[fcat]["major_frequencies"][t]['lower'] for t in frequencies[fcat]["time_points"]],
                    [frequencies[fcat]["major_frequencies"][t]['upper'] for t in frequencies[fcat]["time_points"]],
                    color=col, alpha=0.2)

            for ci, (country,n) in enumerate(sorted(data_totals.items(), key=lambda x:x[1], reverse=True)[:3]):
                try:
                    plt.plot(dates,
                        [frequencies[fcat][country][t]['val'] for t in frequencies[fcat]["time_points"]], c=col, ls=ls[ci%3])
                except:
                    pass
                # plt.fill_between(frequencies[fcat]["time_points"],
                #         [frequencies[fcat][country][t]['lower'] for t in frequencies[fcat]["time_points"]],
                #         [frequencies[fcat][country][t]['upper'] for t in frequencies[fcat]["time_points"]],
                #         color=col, alpha=0.2)
        fig.autofmt_xdate()

    import json
    with open(args.output_json, 'w') as fh:
        json.dump(output_data, fh)
