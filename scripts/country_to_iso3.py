# %%
import polars as pl
import country_converter as coco
import json

# %%
# df = pl.read_csv("data/h3n2/metadata.tsv", separator="\t")
df = pl.read_csv("data/sc2/metadata.tsv", separator="\t")
meta_countries = df.get_column("country").unique().to_list()
print(meta_countries)
# %%
# Make mapping from country name to ISO3 code
meta_to_iso3 = {
    country: coco.convert(names=country, to="ISO3")
    for country in meta_countries
    if coco.convert(names=country, to="ISO3") != "not found"
}
meta_to_iso3 = dict(sorted(meta_to_iso3.items()))
print(meta_to_iso3)
# %%
# output as json into profiles/flu/country_to_iso3.json
# json.dump(
#     # meta_to_iso3, open("profiles/flu/country_to_iso3.json", "w"), indent=2
#     # meta_to_iso3, open("profiles/sc2/country_to_iso3.json", "w"), indent=2
# )

# %%
# output as tsv into profiles/flu/country_to_iso3.tsv
# with open("profiles/flu/country_to_iso3.tsv", "w") as f:
with open("profiles/sc2/country_to_iso3.tsv", "w") as f:
    f.write("country\tiso3\n")
    for k, v in meta_to_iso3.items():
        f.write(f"{k}\t{v}\n")

# %%
# print the coco data
data = coco.CountryConverter().data
# %%
data[["name_short", "continent", "UNregion"]]
# %%
data["UNregion"].unique()

# %%
data[["ISO3", "continent", "name_short", "UNregion"]].to_csv(
    "profiles/flu/iso3_to_continent.tsv", sep="\t", index=False
)

# %%
import polars as pl
from polars import col as c
#%%
df = pl.read_csv("profiles/flu/iso3_to_region.tsv", separator="\t").with_columns(
    continent=pl.when((c("un_region") == "South America") | (c("continent") == "Asia") ).then(c("un_region")).otherwise(c("continent"))
).with_columns(
    continent=pl.when(c("continent") == "Central Asia").then("Western Asia").otherwise(c("continent"))
).with_columns(
    continent=pl.when(c("iso3") == "CHN").then("China").otherwise(c("continent"))
).with_columns(
    continent=pl.when(c("continent") == "America").then("North America").otherwise(c("continent"))
)
df.write_csv("profiles/flu/iso3_to_region.tsv", separator="\t")

# %%
