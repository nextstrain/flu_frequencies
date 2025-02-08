from fit_hierarchical_frequencies import fit_hierarchical_frequencies
import datetime
import requests
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

API_URL = "https://lapis.cov-spectrum.org/open/v2/sample/aggregated"

# generate LAPIS query for the focal country using the minimum and maximum date
def generate_lapis_query(region, query, min_date, max_date):
    # ?fields=country&fields=date&fields=host&country=Germany&nextstrainClade=25A&dateFrom=2024-06-01&dateTo=2025-01-30&orderBy=date
    fields = ["country", "date"]
    query_items = {
        "region": region,
        "dateFrom": min_date,
        "dateTo": max_date,
        "orderBy": "date"
    }
    for key, value in query.items():
        query_items[key] = value

    query_str = "&".join([f"{key}={value}" for key, value in query_items.items()])
    output_str = "&".join([f"fields={value}" for value in fields])

    return f"{API_URL}?{output_str}&{query_str}"


def fetch_from_lapis(region, query, min_date, max_date):
    query_str = generate_lapis_query(region, query, min_date, max_date)
    print(f"Fetching data from LAPIS using query: {query_str}")
    data = requests.get(query_str).json()
    return data

def fetch_total_from_lapis(region, min_date, max_date):
    return fetch_from_lapis(region, {}, min_date, max_date)

def aggregate_data(data, time_points=None):
    df = pd.DataFrame(data)
    # add a column that maps the date to a week
    def to_week(date):
        x = datetime.datetime.strptime(date, "%Y-%m-%d").toordinal()
        return x - x%7
    df['week'] = df['date'].apply(to_week)

    totals = df[["count", "country", "week"]].groupby(["week", "country"]).sum().to_dict()['count']
    if time_points is None:
        time_points = df['week'].unique()

    countries = df['country'].unique()
    counts = {}
    for country in countries:
        counts[country] = {t: totals.get((t, country), 0) for t in time_points}

    return counts, time_points

if __name__=="__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Fit hierarchical frequencies for a country and with region prior')
    parser.add_argument('--country', type=str, help='Country name')
    parser.add_argument('--region', type=str, help='Region name')
    parser.add_argument('--query', type=str, help='Query to filter data')
    parser.add_argument('--min-date', type=str, help='Minimum date')
    parser.add_argument('--max-date', type=str, help='Maximum date')

    args = parser.parse_args()

    if args.max_date is None:
        args.max_date = datetime.datetime.now().strftime('%Y-%m-%d')

    parsed_query = {x.split("=")[0]: x.split("=")[1] for x in args.query.split("&")} if args.query is not None else {}

    total = fetch_total_from_lapis(args.region, args.min_date, args.max_date)['data']
    counts = fetch_from_lapis(args.region, parsed_query, args.min_date, args.max_date)['data']

    total_counts, time_points = aggregate_data(total)
    counts, time_points = aggregate_data(counts, time_points)

    # for country in total_counts.keys():
    #     if country not in counts:
    #         counts[country] = np.zeros(len(time_points))
    stiffness = 5000/7
    frequencies = fit_hierarchical_frequencies(total_counts, counts, time_points, stiffness=stiffness, stiffness_minor=stiffness/3)
    def freq(f, c):
        #print(f[c], [f[c].get(int(t))['val'] for t in f['time_points']])
        return [f[c].get(int(t))['val'] for t in f['time_points']]

    def freq_uncertainty(f, c):
        return [[f[c].get(int(t))[b] for t in f['time_points']] for b in ['upper', 'lower']]


    plt.figure()
    plt.plot(frequencies['time_points'], freq(frequencies, 'major_frequencies'), label=args.region, c='black')

    for c in list(frequencies.keys())[2:]:
        plt.plot(frequencies['time_points'], freq(frequencies,c),
                label='' if c!=args.country else c,
                alpha=0.5 if c!=args.country else 1.0,
                c='gray' if c!=args.country else 'red')

    plt.fill_between(frequencies['time_points'], *freq_uncertainty(frequencies, args.country), color='red', alpha=0.1)

    current_ticks=plt.xticks()
    plt.xticks(current_ticks[0], [datetime.datetime.fromordinal(int(x)).strftime("%Y-%m-%d") for x in current_ticks[0]], rotation=45, horizontalalignment='right')
    plt.legend()
    plt.ylim(0,1)
    plt.tight_layout()
