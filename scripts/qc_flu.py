import polars as pl
from collections import defaultdict
from treetime.utils import ambiguous_date_to_date_range, numeric_date, datestring_from_numeric
from datetime import datetime
import numpy as np
from scipy.stats import scoreatpercentile

if __name__=="__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", type=str)
    parser.add_argument("--evolutionary-rate", type=float, help="Evolutionary rate in subs/year", default=5)

    args = parser.parse_args()

    df = pl.read_csv(args.metadata, separator='\t')
    #.select(["strain", "date", "date_submitted",
    #                                                        "aaSubstitutions",	"substitutions",
    #                                                        "privateNucMutations.reversionSubstitutions",
    #                                                        "privateNucMutations.labeledSubstitutions",
    #                                                        "privateNucMutations.unlabeledSubstitutions"])

    strain_i = df.columns.index("strain")
    date_i = df.columns.index("date")
    subdate_i = df.columns.index("date_submitted")
    subs_i = df.columns.index("substitutions")
    privateSubs_i = df.columns.index("privateNucMutations.unlabeledSubstitutions")
    revSubs_i = df.columns.index("privateNucMutations.reversionSubstitutions")
    strain_groups = defaultdict(list)

    for v in df.iter_rows():
        n_priv_muts = 0
        if v[subs_i] is None:
            muts = set()
        else:
            muts = set(v[subs_i].split(","))
        if v[privateSubs_i] is not None:
            private_muts = set(v[privateSubs_i].split(","))
            muts = muts.difference(private_muts)
            n_priv_muts += len(private_muts)

        if v[revSubs_i] is not None:
            muts = muts.difference(v[revSubs_i].split(","))

        try:
            subdate = numeric_date(datetime.strptime(v[subdate_i], "%Y-%m-%d"))
        except:
            subdate = None
        strain_groups[tuple(sorted(muts))].append((v[strain_i], v[date_i], subdate, n_priv_muts))

    strains_by_size = sorted(strain_groups.items(), reverse=True, key=lambda x: len(x[1]))

    bad_dates = []
    early_outliers = {}
    late_outliers = {}
    for gt, group in strains_by_size:
        if len(group) < 10:
            break

        dates = {}
        avg_priv_muts = np.mean([x[-1] for x in group])
        for strain, d, subdate, n_priv_muts in group:
            drange = [numeric_date(x) for x in ambiguous_date_to_date_range(d)]
            if drange[1] - drange[0]>0.5:
                bad_dates.append((strain, d))
                continue
            dates[strain] = (np.mean(drange), subdate, (n_priv_muts-avg_priv_muts)/args.evolutionary_rate)
        percentiles = scoreatpercentile([x[0] for x in  dates.values()], [20, 50, 80])
        allowed_range = [percentiles[0] - max(0.4, percentiles[1]-percentiles[0]), percentiles[2] + max(0.4, percentiles[2]-percentiles[1])]

        if percentiles[1]>2015:
            for strain, (d, subdate, offset) in dates.items():
                if d < allowed_range[0] + min(0,offset):
                    if subdate is None or (subdate > allowed_range[0] + min(0,offset)):
                        early_outliers[strain] = (d, percentiles[1], allowed_range[0], subdate, offset)

                if d+offset > allowed_range[1]:
                    late_outliers[strain] = (d, percentiles[1], allowed_range[1], subdate, offset)


    print("\t".join(["strain", "date", "cutoff", "typical_date", "submission_date", "mutation_offset"]))
    for strain, (d, typical_date, cutoff, subdate, offset) in early_outliers.items():
        print("\t".join([strain, datestring_from_numeric(d),
                        datestring_from_numeric(cutoff),
                        datestring_from_numeric(typical_date),
                        datestring_from_numeric(subdate) if subdate else '?']) + f'\t{offset:1.1f}')
