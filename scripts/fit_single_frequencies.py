"""
Script to estimate binomial probabilities
- for each time bin
- independently for each geographic category
- independently for each class of interest variant/mutation (vs rest)
- information is shared across time bins using Gaussian penalty
"""

from collections import defaultdict
from datetime import datetime

import numpy as np
import polars as pl


def zero_one_clamp(x):
    if np.isnan(x): return x
    return max(0,min(1,x))

def parse_dates(x):
    try:
        return datetime.strptime(x, "%Y-%m-%d")
    except:
        return None

def to_day_count(x, start_date):
    try:
        return x.toordinal()-start_date
    except:
        #print(x)
        return -1

def day_count_to_date(x, start_date):
    return datetime.fromordinal(start_date + x)

def load_and_aggregate(data, geo_categories, freq_category, min_date="2021-01-01", bin_size=7, inclusive_clades=""):
    if type(data)==str:
        d = pl.read_csv(data, separator='\t', try_parse_dates=True, columns = geo_categories + [freq_category, 'date'])
    else:
        d=data

    start_date = datetime.strptime(min_date, "%Y-%m-%d").toordinal()
    d = d.filter((~pl.col('date').is_null())&(~pl.col(freq_category).is_null()))
    d = d.with_columns([pl.col('date').map_elements(lambda x: to_day_count(x, start_date)).alias("day_count")])
    d = d.filter(pl.col("day_count")>=0)
    d = d.with_columns([(pl.col('day_count')//bin_size).alias("time_bin")])

    totals = dict()
    for row in d.group_by(by=geo_categories + ["time_bin"]).count().iter_rows():
        totals[row[:-1]] = row[-1]

    fcats = d[freq_category].unique()
    counts = {}
    for fcat in fcats:
        tmp = {}
        for row in d.filter(pl.col(freq_category)==fcat).group_by(by=geo_categories + ["time_bin"]).count().iter_rows():
            tmp[row[:-1]] = row[-1]
        counts[fcat] = tmp

    # For each cat in fcats, add a new category that also includes all children clades
    children = defaultdict(list)
    for fcat in fcats:
        for fcat2 in fcats:
            if fcat2.startswith(fcat):
                children[fcat].append(fcat2)

    if inclusive_clades == "flu":
        for lineage, children in children.items():
            if len(children)<=1: continue
            tmp = {}
            for child in children:
                # tmp is a dict where values are integers
                # I want to add dicts so that values are summed
                tmp = {k: tmp.get(k, 0) + counts[child].get(k, 0) for k in set(tmp) | set(counts[child])}
            counts[lineage + "*"] = tmp

    timebins = {int(x): day_count_to_date(x*bin_size, start_date) for x in sorted(d["time_bin"].unique())}

    return d, totals, counts, timebins

def fit_single_category(totals, counts, time_bins, stiffness=0.3, pc=3, nstd = 2):

    values, column, row = [], [], []
    b = []
    for ti, t in enumerate(time_bins):
        if t==time_bins[0]:
            diag = stiffness
            values.append(-stiffness)
            row.append(ti)
            column.append(ti+1)
        elif t==time_bins[-1]:
            diag = stiffness
            values.append(-stiffness)
            row.append(ti)
            column.append(ti-1)
        else:
            diag = 2*stiffness
            values.append(-stiffness)
            row.append(ti)
            column.append(ti+1)
            values.append(-stiffness)
            row.append(ti)
            column.append(ti-1)

        k = counts.get(t, 0)
        n = totals.get(t, 0)
        try:
            pre_fac = n**2/(k + pc)/(n - k + pc)
        except:
            print(n,k,pc)
            pre_fac = n**2/(k + pc)/(n - k + pc)

        diag += n*pre_fac
        values.append(diag)
        row.append(ti)
        column.append(ti)
        b.append(k*pre_fac)

    from numpy.linalg import inv
    from scipy.sparse import csr_matrix
    from scipy.sparse.linalg import spsolve
    A = csr_matrix((values, (row, column)), shape=(len(b), len(b)))
    sol = spsolve(A,b)
    confidence = np.sqrt(np.diag(inv(A.todense())))

    return {t:{'val': sol[ti],
               'upper': min(1.0, sol[ti] + nstd*confidence[ti]),
               'lower': max(0.0, sol[ti] - nstd*confidence[ti])} for ti,t in enumerate(time_bins)}, A



if __name__=='__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", type=str, help="filename with metadata")
    parser.add_argument("--frequency-category", type=str, help="field to use for frequency categories")
    parser.add_argument("--geo-categories", nargs='+', type=str, help="field to use for geographic categories")
    parser.add_argument("--days", default=7, type=int, help="number of days in one time bin")
    parser.add_argument("--min-date", type=str, help="date to start frequency calculation")
    parser.add_argument("--output-csv", type=str, help="file for csv output")
    parser.add_argument("--inclusive-clades", type=str, help="whether or not to generate inclusive clade/lineage categories")

    args = parser.parse_args()
    stiffness = 5000/args.days

    if args.frequency_category.startswith('mutation-'):
        d = pl.read_csv(args.metadata, separator='\t', try_parse_dates=False, columns=args.geo_categories + ["aaSubstitutions", 'date'])
        mutation = args.frequency_category.split('-')[-1]
        def extract_mut(muts):
            if type(muts)==str:
                a = [y for y in muts.split(',') if y.startswith(mutation)]
                return a[0] if len(a) else 'WT'
            else:
                return 'WT'
        d = d.with_columns([d["aaSubstitutions",:].map_elements(extract_mut).alias("mutation")])

        print(d["mutation"].value_counts())
        freq_cat = "mutation"
    else:
        d = pl.read_csv(args.metadata, separator='\t', try_parse_dates=False, columns=args.geo_categories + [args.frequency_category, 'date'])
        freq_cat = args.frequency_category
    d = d.with_columns(pl.col("date").str.strptime(pl.Date, format="%Y-%m-%d", strict=False))
    data, totals, counts, time_bins = load_and_aggregate(d, args.geo_categories, freq_cat,
                                                         bin_size=args.days, min_date=args.min_date, inclusive_clades=args.inclusive_clades)


    dates = [time_bins[k] for k in time_bins]
    geo_cats = set([k[:-1] for k in totals])
    output_data = []
    for geo_cat in geo_cats:
        geo_label = ','.join(geo_cat)
        frequencies = {}
        sub_counts = {}
        sub_totals = {k[-1]:v for k,v in totals.items() if tuple(k[:-1])==geo_cat}
        for fcat in counts.keys():
            sub_counts[fcat] = {k[-1]:v for k,v in counts[fcat].items() if tuple(k[:-1])==geo_cat}
            if sum(sub_counts[fcat].values())>10:
                frequencies[fcat],A = fit_single_category(sub_totals, sub_counts[fcat],
                                        sorted(time_bins.keys()), stiffness=stiffness)
                for k, date in time_bins.items():
                    output_data.append({"date": date.strftime('%Y-%m-%d'), "region": geo_label, "country": None,
                                        "count": sub_counts[fcat].get(k, 0), "total": sub_totals.get(k, 0),
                                        "variant":fcat,
                                        "freqMi":frequencies[fcat][k]['val'], "freqLo":frequencies[fcat][k]['lower'], "freqUp":frequencies[fcat][k]['upper']})

    df = pl.DataFrame(output_data, schema={'date':str, 'region':str, 'country':str, 'variant':str,
                                    'count':int, 'total':int,
                                    'freqMi':float, 'freqLo':float, 'freqUp':float})
    df.write_csv(args.output_csv, float_precision=4)
