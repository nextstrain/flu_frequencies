# %%
import glob
import polars as pl
from polars import col as c
import requests
import country_converter as coco

# %%
# Load other dataset and append rows
df = pl.DataFrame()
for metadata in glob.glob("data/*/combined.tsv"):
    df = df.vstack(pl.read_csv(metadata, separator="\t"))
print(df)
# %%
# Create dataframe with unique region, country pairs
df.select(["region", "country"]).unique().sort(
    by=["region", "country"]
).write_csv("countries.csv")
# %%
# Get list of world countries
# Map GISAID countries to world countries
# Find countries that are not in GISAID

# %%


# Get all countries from REST Countries API
response = requests.get("https://restcountries.com/v3.1/all")
data = response.json()

# Parse data into a dictionary {country_name: population}
all_countries = {
    country["name"]["common"]: country["population"] for country in data
}
regions = {country["name"]["common"]: country["region"] for country in data}

# Generate a list of unique country names from the API
api_countries = list(all_countries.keys())

# Run these names through coco to obtain a mapping from coco standard names to API names
standard_names = coco.convert(names=api_countries, to="name_short")
coco_to_api_mapping = dict(zip(standard_names, api_countries))

# Standardize your country list using country_converter
# your_countries = ['China (PRC)', 'India', 'Usa']  # Add your countries here
your_countries = df.get_column("country").unique().to_list()
standard_names = coco.convert(names=your_countries, to="name_short")
coco_to_gisaid_mapping = dict(zip(standard_names, your_countries))

# Map from coco names to API names
your_countries_api = [
    coco_to_api_mapping.get(name, "Not found") for name in standard_names
]
your_countries_dict = dict(zip(your_countries_api, your_countries))
# %%
# Get populations for your countries
your_countries_populations = {
    your_countries_dict[country]: all_countries[country]
    for country in your_countries_api
    if country in all_countries
}
your_countries_populations = dict(
    sorted(
        your_countries_populations.items(),
        key=lambda item: int(item[1]),
        reverse=True,
    )
)
# Find missing countries
missing_countries = set(all_countries.keys()) - set(your_countries_api)
print("\nCountries missing from your list:")
sum = 0
missing = {country: all_countries[country] for country in missing_countries}
missing = dict(
    sorted(missing.items(), key=lambda item: int(item[1]), reverse=True)
)
for country, population in missing.items():
    print(f"{country}, {regions[country]}: {population}")
    sum += all_countries[country]
print(f"Total population: {sum}")
# %%
# Write csv file with your_countries
with open("country_region_population.csv", "w") as f:
    f.write("country,region,population\n")
    for country, population in your_countries_populations.items():
        # print(f"{country},{df.filter(c('country') == country).get_column('region').to_list()[0]},{population}")
        f.write(
            f"{country},{df.filter(c('country') == country).get_column('region').to_list()[0]},{population}\n"
        )

    for country, population in missing.items():
        # print(f"{country},{regions[country]},{population}")
        f.write(f"{country},{regions[country]},{population}\n")

# %%
