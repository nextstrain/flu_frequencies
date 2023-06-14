"""
Script to estimate binomial probabilities
- for each time bin
- independently for each class of interest variant/mutation (vs rest)
- for 2-level hierarchy of geographic categories
- top levels are estimated independently from each other
- lower levels share information with top level
- information is shared across time bins using Gaussian penalty
"""

import matplotlib.pyplot as plt
import numpy as np
import polars as pl
from fit_single_frequencies import load_and_aggregate, zero_one_clamp


def geo_label_map(x):
    if x=='China': return 'China(PRC)'
    return x

def fit_hierarchical_frequencies(totals, counts, time_bins, stiffness=0.5, stiffness_minor=0.1,
                                 mu=0.3, use_inverse_for_confidence=True):

    # Create copy but with "other" counts set to zero
    # Just for purpose of fitting, as if there was no data for "other"
    counts = counts.copy()
    counts['other'] = {}
    totals = totals.copy()
    totals['other'] = {}

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
        extra_major = 0.2
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

    if use_inverse_for_confidence:
        try:
            window = len(time_bins)
            matrix_conf_intervals = []
            for wi in range(len(b)//window):
                matrix_conf_intervals.extend(np.diag(np.linalg.inv(A[wi*window:(wi+1)*window,wi*window:(wi+1)*window].todense())))
            conf_to_use = matrix_conf_intervals
        except:
            print("Confidence through matrix inversion didn't work, using diagonal approximation instead.")
            conf_to_use = sq_confidence
    else:
        conf_to_use = sq_confidence

    freqs = {"time_points": time_bins}
    freqs["major_frequencies"] = {t:{"val": zero_one_clamp(sol[ti]),
                                     "upper":zero_one_clamp(sol[ti]+np.sqrt(conf_to_use[ti])),
                                     "lower":zero_one_clamp(sol[ti]-np.sqrt(conf_to_use[ti]))}
                                     for ti,t in enumerate(time_bins)}
    for ci, cat in enumerate(minor_cats):
        freqs[cat] = {}
        for ti,t in enumerate(time_bins):
            row_index = ti + (ci+1)*n_tp
            val = zero_one_clamp(sol[ti] + sol[row_index])
            dev = np.sqrt(conf_to_use[ti] + conf_to_use[row_index])
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
    parser.add_argument("--output-csv", type=str, help="output csv file")
    parser.add_argument("--inclusive-clades", type=str, help="whether or not to generate inclusive clade/lineage categories")

    args = parser.parse_args()

    d = pl.read_csv(args.metadata, separator='\t', try_parse_dates=False, columns=args.geo_categories + [args.frequency_category, 'date'])
    freq_cat = args.frequency_category

    d = d.with_columns(pl.col("date").str.strptime(pl.Date, format="%Y-%m-%d", strict=False))

    data, totals, counts, time_bins = load_and_aggregate(d, args.geo_categories, freq_cat,
                                                         bin_size=args.days, min_date=args.min_date, inclusive_clades=args.inclusive_clades)

    dates = [time_bins[k] for k in time_bins]

    major_geo_cats = set([tuple(k[:-2]) for k in totals])
    output_data = []
    # major_geo_cats = set([('Europe',)])
    stiffness = 5000/args.days
    for geo_cat in major_geo_cats:
        geo_label = ','.join(geo_cat)
        minor_geo_cats = set([k[-2] for k in totals if k[:-2]==geo_cat])
        sub_totals = {"other": {}}
        data_totals = {}
        for minor_geo_cat  in minor_geo_cats:
            tmp = {k[-1]:v for k,v in totals.items() if k[:-2]==geo_cat and k[-2]==minor_geo_cat}
            data_totals[minor_geo_cat] = sum(tmp.values())
            if data_totals[minor_geo_cat]>20:
                sub_totals[minor_geo_cat] = tmp
            else:
                # Put all minor categories with less than 20 sequences into one special category
                sub_totals["other"] = {k: tmp.get(k, 0) + sub_totals["other"].get(k, 0) for k in set(tmp) | set(sub_totals["other"])}

        sub_counts = {}
        frequencies = {}
        for fcat in counts.keys():
            sub_counts[fcat] = {"other": {}}
            for minor_geo_cat in minor_geo_cats:
                tmp = {k[-1]:v for k,v in counts[fcat].items() if k[:-2]==geo_cat and k[-2]==minor_geo_cat}
                if minor_geo_cat in sub_totals:
                    sub_counts[fcat][minor_geo_cat] = tmp
                else:
                    sub_counts[fcat]["other"] = {k: tmp.get(k, 0) + sub_counts[fcat].get("other",{}).get(k, 0) for k in set(tmp) | set(sub_counts[fcat].get("other",{}))}
            frequencies[fcat] = fit_hierarchical_frequencies(sub_totals, sub_counts[fcat],
                                    sorted(time_bins.keys()), stiffness=stiffness,
                                    stiffness_minor=stiffness, mu=5.0)

            region_counts = {}
            region_totals = {}
            ## append entries for individual countries.
            for minor_geo_cat in sub_totals:
                for k, date in time_bins.items():
                    output_data.append({"date": date.strftime('%Y-%m-%d'), "region": geo_label, "country": geo_label_map(minor_geo_cat),
                                        "variant":fcat, "count": sub_counts[fcat][minor_geo_cat].get(k,0),
                                        "total": sub_totals[minor_geo_cat].get(k,0),
                                        "freqMi":frequencies[fcat][minor_geo_cat][k]['val'],
                                        "freqLo":frequencies[fcat][minor_geo_cat][k]['lower'],
                                        "freqUp":frequencies[fcat][minor_geo_cat][k]['upper']})
                    region_counts[k] = region_counts.get(k, 0) + sub_counts[fcat][minor_geo_cat].get(k,0)
                    region_totals[k] = region_totals.get(k, 0) + sub_totals[minor_geo_cat].get(k,0)

            ## append entries for region frequencies
            for k, date in time_bins.items():
                output_data.append({"date": date.strftime('%Y-%m-%d'), "region": geo_label,
                                    "country": geo_label, "variant":fcat,
                                    "count": region_counts[k], "total": region_totals[k],
                                    "freqMi":frequencies[fcat]["major_frequencies"][k]['val'],
                                    "freqLo":frequencies[fcat]["major_frequencies"][k]['lower'],
                                    "freqUp":frequencies[fcat]["major_frequencies"][k]['upper']})


    df = pl.DataFrame(output_data, schema={'date':str, 'region':str, 'country':str, 'variant':str,
                                           'count':int, 'total':int, 'freqMi':float, 'freqLo':float, 'freqUp':float})

    # region_totals = {(r[0], r[1]): r[2] for r in df.select(['date', 'region', 'count'])
    #                         .groupby(['date', 'region']).sum().iter_rows()}
    # region_counts = {(r[0], r[1], r[2]): r[3] for r in df.select(['date', 'region', 'variant', 'count'])
    #                         .groupby(['date', 'region', 'variant']).sum().iter_rows()}

    # df = df.with_columns([
    #       pl.struct(['date','region', 'country', 'total']).apply(
    #                     lambda x:region_totals.get((x['date'], x['region']),0)
    #                              if x['region']==x['country'] else x['total'])
    #         .alias('total'),
    #       pl.struct(['date','region', 'country', 'variant', 'count']).apply(
    #                     lambda x:region_counts.get((x['date'], x['region'], x['variant']), 0)
    #                               if x['region']==x['country'] else x['count'])
    #         .alias('count')
    # ])

    df.write_csv(args.output_csv, float_precision=4)
