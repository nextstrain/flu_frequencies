import pandas as pd


class CountryLookupFromFile:
    def __init__(self, infos_file=""):
        self.infos = pd.read_csv(infos_file, sep="\t")

    def iso3_to_name(self, iso3: str):
        info = self.infos.loc[self.infos['iso3'] == iso3, 'name_short']
        if len(info) > 0:
            return info.iloc[0]
        raise ValueError(f"Unable to find country name by code: '{iso3}'")
