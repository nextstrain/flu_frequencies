import polars as  pl
from datetime import datetime
import numpy as np

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

def load_and_aggregate(data, geo_categories, freq_category, min_date="2021-01-01", bin_size=7):
    if type(data)==str:
        d = pl.read_csv(data, sep='\t', parse_dates=True, columns = geo_categories + [freq_category, 'date'])
    else:
        d=data

    # d["datetime"] = d.date.apply(parse_dates)
    start_date = datetime.strptime(min_date, "%Y-%m-%d").toordinal()
    d = d.filter((~pl.col('date').is_null())&(~pl.col(freq_category).is_null()))
    d = d.with_columns([pl.col('date').apply(lambda x: to_day_count(x, start_date)).alias("day_count")])
    d = d.filter(pl.col("day_count")>=0)
    d = d.with_columns([(pl.col('day_count')//bin_size).alias("time_bin")])

    totals = dict()
    for row in d.groupby(by=geo_categories + ["time_bin"]).count().iter_rows():
        totals[row[:-1]] = row[-1]

    fcats = d[freq_category].unique()
    counts = {}
    for fcat in fcats:
        tmp = {}
        for row in d.filter(pl.col(freq_category)==fcat).groupby(by=geo_categories + ["time_bin"]).count().iter_rows():
            tmp[row[:-1]] = row[-1]
        counts[fcat] = tmp

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
        pre_fac = n**2/(k + pc)/(n - k + pc)
        diag += n*pre_fac
        values.append(diag)
        row.append(ti)
        column.append(ti)
        b.append(k*pre_fac)

    from scipy.sparse import csr_matrix
    from scipy.sparse.linalg import spsolve
    from numpy.linalg import inv
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
    parser.add_argument("--output-csv", type=str, help="file for json output")

    args = parser.parse_args()
    stiffness = 5000/args.days

    if args.frequency_category.startswith('mutation-'):
        d = pl.read_csv(args.metadata, sep='\t', parse_dates=False, columns=args.geo_categories + ["aaSubstitutions", 'date'])
        mutation = args.frequency_category.split('-')[-1]
        def extract_mut(muts):
            if type(muts)==str:
                a = [y for y in muts.split(',') if y.startswith(mutation)]
                return a[0] if len(a) else 'WT'
            else:
                return 'WT'
        d = d.with_columns([d["aaSubstitutions",:].apply(extract_mut).alias("mutation")])

        print(d["mutation"].value_counts())
        freq_cat = "mutation"
    else:
        d = pl.read_csv(args.metadata, sep='\t', parse_dates=False, columns=args.geo_categories + [args.frequency_category, 'date'])
        freq_cat = args.frequency_category
    d = d.with_columns(pl.col("date").str.strptime(pl.Date, fmt="%Y-%m-%d", strict=False))
    data, totals, counts, time_bins = load_and_aggregate(d, args.geo_categories, freq_cat,
                                                         bin_size=args.days, min_date=args.min_date)


    dates = [time_bins[k] for k in time_bins]
    geo_cats = set([k[:-1] for k in totals])
    import matplotlib.pyplot as plt
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



