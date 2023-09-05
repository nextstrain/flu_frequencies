regions = config["regions"]
min_date = config["min_date"]
flu_repo = config.get("flu_repo", "/home/richard/Projects/influenza/seasonal-flu")

wildcard_constraints:
    segment="ha|na"

rule europe:
    input:
        [
            "plots/h3n2_ha/Region_Europe.png",
            "plots/h3n2_ha/Region_Europe_weighted.png",
            "plots/h3n2_ha/Region_global_weighted.png",
            "plots/h3n2_ha/region_mut-HA1:E50.png",
            "plots/h3n2_ha/region_mut-HA1:I140.png",
            "plots/h3n2_ha/region-clades.png",
            "plots/h3n2_na/region-clades.png",
            "plots/h1n1pdm_ha/region-clades.png",
            "plots/h1n1pdm_na/region-clades.png",
            "plots/vic_ha/region-clades.png",
            "plots/vic_ha/region_mut-HA1:E183.png",
            "plots/vic_ha/region_mut-HA1:N197.png",
            "plots/vic_na/region-clades.png",
        ],
        # "plots/h3n2/Region_Europe.png",
        # "plots/h1n1pdm/Region_Europe.png",
        # # "plots/h3n2/Country_Europe_Spain.png",
        # # "plots/h3n2/Country_Europe_Spain.png",
        # "plots/h3n2/Country_Europe_Netherlands.png",
        # "plots/h3n2/Country_Europe_United-Kingdom.png",
        # "plots/h3n2/Country_Europe_France.png",
        # "plots/h1n1pdm/Country_Europe_Spain.png",
        # "plots/h1n1pdm/Country_Europe_Netherlands.png",
        # "plots/h1n1pdm/Country_Europe_United-Kingdom.png",
        # "plots/h1n1pdm/Country_Europe_France.png",
        # "plots/h3n2/region_mut-HA1:E50.png",
        # "plots/h3n2/region_mut-HA1:I140.png",
        # "plots/h3n2/region-clades.png",
        # "plots/h1n1pdm/region-clades.png",
        # "plots/vic/region-clades.png",


rule download_sequences:
    output:
        sequences="data/{lineage}/raw_{segment}.fasta",
    params:
        s3_path="s3://nextstrain-data-private/files/workflows/seasonal-flu/{lineage}/{segment}/raw_sequences.fasta.xz",
    shell:
        """
        aws s3 cp {params.s3_path} - | xz -c -d > {output.sequences}
        """


rule parse:
    """
    Parsing fasta into sequences and metadata
    TODO: Download results directly once https://github.com/nextstrain/seasonal-flu/issues/107 is resolved
    """
    input:
        sequences="data/{lineage}/raw_{segment}.fasta",
    output:
        sequences="data/{lineage}/{segment}.fasta",
        metadata="data/{lineage}/metadata-raw_{segment}.tsv",
    params:
        fasta_fields=config["fasta_fields"],
        prettify_fields=config["prettify_fields"],
    shell:
        """
        augur parse \
            --sequences {input.sequences} \
            --output-sequences {output.sequences} \
            --output-metadata {output.metadata} \
            --fields {params.fasta_fields} \
            --prettify-fields {params.prettify_fields}
        """


rule add_iso3:
    input:
        metadata="data/{lineage}/metadata-raw_{segment}.tsv",
        country_to_iso3="profiles/flu/country_to_iso3.tsv",
        iso3_to_region="profiles/flu/iso3_to_region.tsv",
    output:
        metadata="data/{lineage}/metadata_{segment}.tsv",
    shell:
        """
        tsv-join -H \
            --filter-file {input.country_to_iso3} \
            --key-fields country \
            --append-fields iso3 \
            --write-all="?" \
            {input.metadata} \
        | tsv-join -H \
            --filter-file {input.iso3_to_region} \
            --key-fields iso3 \
            --append-fields continent \
            --write-all="?" \
            > {output.metadata}
        """


rule get_nextclade_dataset:
    output:
        "nextclade/{lineage}_{segment}/reference.fasta",
    threads: 4
    shell:
        """
        nextclade dataset get -n flu_{wildcards.lineage}_{wildcards.segment} --output-dir nextclade/{wildcards.lineage}_{wildcards.segment}
        """


rule run_nextclade:
    input:
        sequences="data/{lineage}/{segment}.fasta",
        reference="nextclade/{lineage}_{segment}/reference.fasta",
    output:
        "data/{lineage}/nextclade_{segment}.tsv",
    threads: workflow.cores
    shell:
        """
        nextclade run -j {threads} -D nextclade/{wildcards.lineage}_{wildcards.segment} {input.sequences} --quiet --output-tsv {output}
        """


rule combined_with_metadata:
    input:
        nextclade="data/{lineage}/nextclade_{segment}.tsv",
        metadata="data/{lineage}/metadata_{segment}.tsv",
    output:
        "data/{lineage}/combined_{segment}.tsv",
    params:
        col="subclade",
    run:
        import pandas as pd

        clades = pd.read_csv(input[0], sep="\t", index_col="seqName")[params.col]
        aaSubstitutions = pd.read_csv(input[0], sep="\t", index_col="seqName")[
            "aaSubstitutions"
        ]

        metadata = pd.read_csv(input[1], sep="\t", index_col="strain")
        metadata["clade"] = clades
        metadata["aaSubstitutions"] = aaSubstitutions

        metadata.to_csv(output[0], sep="\t", index=False)


rule estimate_region_frequencies:
    input:
        "data/{lineage}/combined_{segment}.tsv",
    output:
        output_csv="results/{lineage}_{segment}/region-frequencies.csv",
    params:
        min_date=min_date,
    shell:
        """
        python scripts/fit_single_frequencies.py \
            --metadata {input} \
            --geo-categories continent \
            --frequency-category clade \
            --min-date {params.min_date} \
            --days 14 \
            --inclusive-clades flu \
            --output-csv {output.output_csv}
        """


rule estimate_region_mutation_frequencies:
    input:
        "data/{lineage}/combined_{segment}.tsv",
    output:
        output_csv="results/{lineage}_{segment}/mutation_{mutation}-frequencies.csv",
    params:
        min_date=min_date,
    shell:
        """
        python scripts/fit_single_frequencies.py \
            --metadata {input} \
            --geo-categories continent \
            --frequency-category mutation-{wildcards.mutation} \
            --min-date {params.min_date} \
            --days 14 \
            --output-csv {output.output_csv}
        """


rule estimate_region_country_frequencies:
    input:
        "data/{lineage}/combined_{segment}.tsv",
    output:
        output_csv="results/{lineage}_{segment}/region-country-frequencies.csv",
    params:
        min_date=min_date,
    shell:
        """
        python scripts/fit_hierarchical_frequencies.py \
            --metadata {input} \
            --geo-categories continent iso3 \
            --frequency-category clade \
            --min-date {params.min_date} \
            --days 14 \
            --inclusive-clades flu \
            --output-csv {output.output_csv}
        """


rule population_weighted_region_frequencies:
    input:
        fit_results="results/{lineage}_{segment}/region-country-frequencies.csv",
        iso3_to_pop="defaults/iso3_to_pop.tsv",
        iso3_to_region="profiles/flu/iso3_to_region.tsv",
    output:
        output_csv="results/{lineage}_{segment}/weighted-region-frequencies.csv",
    shell:
        """
        python scripts/pop_weighted_aggregates.py \
            --fit-results {input.fit_results} \
            --country-to-population {input.iso3_to_pop} \
            --country-to-region {input.iso3_to_region} \
            --output-csv {output.output_csv}
        """


rule plot_regions:
    input:
        freqs="results/{lineage}_{segment}/region-frequencies.csv",
    output:
        plot="plots/{lineage}_{segment}/Region_{region,[^_]+}.png",
    params:
        max_freq=0.1,
    shell:
        """
        python scripts/plot_region.py \
            --frequencies {input.freqs} \
            --region {wildcards.region:q} \
            --max-freq {params.max_freq} \
            --output {output.plot}
        """


rule plot_weighted_regions:
    input:
        freqs="results/{lineage}_{segment}/weighted-region-frequencies.csv",
    output:
        plot="plots/{lineage}_{segment}/Region_{region}_weighted.png",
    params:
        max_freq=0.1,
    shell:
        """
        python scripts/plot_region.py \
            --frequencies {input.freqs} \
            --region {wildcards.region:q} \
            --max-freq {params.max_freq} \
            --output {output.plot}
        """


rule plot_mutations:
    input:
        freqs="results/{lineage}_{segment}/mutation_{mutation}-frequencies.csv",
    output:
        plot="plots/{lineage}_{segment}/mutation_{region}-{mutation}.png",
    params:
        max_freq=0.05,
    shell:
        """
        python scripts/plot_region.py \
            --frequencies {input.freqs} \
            --region {wildcards.region:q} \
            --max-freq {params.max_freq} \
            --output {output.plot}
        """


rule plot_country:
    input:
        freqs="results/{lineage}_{segment}/region-country-frequencies.csv",
    output:
        plot="plots/{lineage}_{segment}/Country_{region}_{country}.png",
    params:
        max_freq=0.1,
    shell:
        """
        python scripts/plot_country.py \
            --frequencies {input.freqs} \
            --region {wildcards.region:q} \
            --country {wildcards.country:q} \
            --max-freq {params.max_freq} \
            --output {output.plot}
        """


rule multi_region_plot_clades:
    input:
        freqs="results/{lineage}_{segment}/region-frequencies.csv",
    output:
        plot="plots/{lineage}_{segment}/region-clades.png",
    params:
        regions=[
            "Africa",
            "Europe",
            "North_America",
            "South_America",
            "Oceania",
            "Western_Asia",
            "Southern_Asia",
            "South-eastern_Asia",
            "Eastern_Asia",
            "China",
        ],
        max_freq=0.1,
        title = "{lineage}-{segment}",
        auspice_config = "{flu_repo}/profiles/nextflu-private/{lineage}/{segment}/auspice_config.json"
    shell:
        """
        python3 scripts/plot_multi-region.py --title {params.title} --frequencies {input.freqs}  \
                --regions {params.regions}  --max-freq {params.max_freq} --auspice-config {params.auspice_config} \
                --output {output.plot}
        """


rule multi_region_plot_mutation:
    input:
        freqs="results/{lineage}_{segment}/mutation_{mutation}-frequencies.csv",
    output:
        plot="plots/{lineage}_{segment}/region_mut-{mutation}.png",
    params:
        regions=[
            "Africa",
            "Europe",
            "North_America",
            "South_America",
            "Oceania",
            "Western_Asia",
            "Southern_Asia",
            "South-eastern_Asia",
            "Eastern_Asia",
            "China",
        ],
        max_freq=0.2,
        title = "{lineage}-{segment}"
    shell:
        """
        python3 scripts/plot_multi-region.py --title {params.title} \
            --frequencies {input.freqs} --regions {params.regions}  \
            --max-freq {params.max_freq} --output {output.plot}
        """


#        clades = ['1a.1', '2a.1', '2a.1a', '2a.1b', '2a.3a',  '2a.3a.1','2a.3b', '2b'],


rule clean:
    shell:
        "rm -rf data/ results/ plots/"
