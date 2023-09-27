#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from os.path import isfile
# pip install pandas pycountry country-converter

from typing import List, Union
import pandas as pd
from pycountry import countries
import country_converter


def _get_one_iso3_code(some_name: str):
    code = country_converter.convert(names=some_name, to='ISO3')
    if code == 'not found':
        raise ValueError(f"CountryConverter: 3-letter ISO code is not found for country: {some_name}")
    return code


def _get_many_iso3_codes(some_names: List[str]):
    codes = []
    missing = []
    for some_name in some_names:
        try:
            codes.append(_get_one_iso3_code(some_name))
        except:
            missing.append(some_name)

    if len(missing) > 0:
        missing = ", ".join(missing)
        raise ValueError(f"CountryConverter: unable to lookup: 3-letter ISO code is not found for countries: {missing}")

    return codes


class CountryLookup:
    """
    Lookup country information, such as standardized names and ISO codes, given a non-standard name
    """

    def __init__(self, additional_infos_file=""):
        self.infos = pd.DataFrame.from_records([country.__dict__['_fields'] for country in countries])
        if isfile(additional_infos_file):
            self.additional_infos = pd.read_csv(additional_infos_file, sep="\t")
        else:
            self.additional_infos = pd.DataFrame(columns=["country", "iso3"])

    def _convert_one_iso3_code_to_info(self, country_code: str):
        info = self.infos[self.infos['alpha_3'] == country_code]
        if len(info) == 0:
            raise ValueError(
                f"CountryConverter: unable to lookup: country info is not found for country code: {country_code}")
        return info

    def _convert_many_iso3_codes_to_infos(self, country_codes: List[str]):
        infos = self.infos[self.infos['alpha_3'].isin(country_codes)]
        if len(infos) != len(country_codes):
            missing = ", ".join(list(set(country_codes) - set(infos['alpha_3'])))
            raise ValueError(
                f"CountryConverter: unable to lookup: country infos are not found for country codes: {missing}")
        return infos

    def _lookup_one(self, some_name: str):
        return self._convert_one_iso3_code_to_info(_get_one_iso3_code(some_name))

    def _lookup_many(self, some_names: str):
        return self._convert_many_iso3_codes_to_infos(_get_many_iso3_codes(some_names))

    def __getitem__(self, some_names: Union[str, List[str]]):
        """Lookup one or multiple country infos"""
        if type(some_names) is list:
            return self._lookup_many(some_names)
        return self._lookup_one(some_names)

    def iso3_to_name(self, iso3: str):
        try:
            name = self[iso3]["common_name"].dropna().item()
            if name != "nan":
                return name
        except:
            pass

        try:
            name = self[iso3]["name"].item()
            if name != "nan":
                return name
        except:
            pass

        additional_info = self.additional_infos.loc[self.additional_infos['iso3'] == iso3, 'country']
        if len(additional_info) > 0:
            return additional_info.iloc[0]

        raise ValueError(f"Unable to find country name by code: '{iso3}'")
