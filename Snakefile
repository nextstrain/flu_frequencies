regions = config["regions"]
min_date = config["min_date"]


wildcard_constraints:
    segment="ha|na",


rule europe:
    input:
        [
            "plots/h3n2_ha/region-clades.png",
            "plots/h3n2_na/region-clades.png",
            "plots/h3n2_ha/region_mut-HA1:E50.png",
            "plots/h3n2_ha/region_mut-HA1:I140.png",
            "plots/h1n1pdm_ha/region_mut-HA1:P137.png",
            "plots/h1n1pdm_ha/region_mut-HA1:K142.png",
            "plots/h1n1pdm_ha/region_mut-HA1:P137,K142.png",
            "plots/h1n1pdm_ha/region-clades.png",
            "plots/h1n1pdm_na/region-clades.png",
            "plots/vic_ha/region-clades.png",
            "plots/vic_na/region-clades.png",
            "plots/h3n2_ha/Region_Europe.png",
            "plots/h3n2_ha/Region_Europe_weighted.png",
            "plots/h3n2_ha/Region_global_weighted.png",
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
        sequences="data/{lineage}/{segment}.fasta",
    params:
        s3_path="s3://nextstrain-data-private/files/workflows/seasonal-flu/{lineage}/{segment}/sequences.fasta.xz",
    shell:
        """
        aws s3 cp {params.s3_path} - | xz -c -d > {output.sequences}
        """

rule download_nextclade:
    output:
        nextclade="data/{lineage}/nextclade_{segment}.tsv",
    params:
        s3_path="s3://nextstrain-data-private/files/workflows/seasonal-flu/{lineage}/{segment}/nextclade.tsv.xz",
    shell:
        """
        aws s3 cp {params.s3_path} - | xz -c -d > {output.nextclade}
        """

rule download_metadata:
    output:
        metadata="data/{lineage}/metadata_raw_{segment}.tsv",
    params:
        s3_path="s3://nextstrain-data-private/files/workflows/seasonal-flu/{lineage}/metadata.tsv.xz",
    shell:
        """
        aws s3 cp {params.s3_path} - | xz -c -d > {output.metadata}
        """

rule download_outliers:
    output:
        outliers="data/{lineage}/outliers.txt",
    shell:
        """
        curl -L -o {output.outliers} "https://raw.githubusercontent.com/nextstrain/seasonal-flu/master/config/{wildcards.lineage}/outliers.txt"
        """

rule filter_outliers:
    input:
        metadata="data/{lineage}/metadata_raw_{segment}.tsv",
        outliers="data/{lineage}/outliers.txt",
    output:
        metadata="data/{lineage}/metadata_filtered_{segment}.tsv"
    shell:
        """
        augur filter \
            --metadata {input.metadata} \
            --exclude {input.outliers} \
            --output-metadata {output.metadata}
        """

rule add_iso3:
    input:
        metadata="data/{lineage}/metadata_filtered_{segment}.tsv",
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


rule combined_with_metadata:
    input:
        nextclade="data/{lineage}/nextclade_{segment}.tsv",
        metadata="data/{lineage}/metadata_{segment}.tsv",
    output:
        metadata="data/{lineage}/combined_{segment}.tsv",
    params:
        nextclade_columns=lambda w: ",".join(
            config["nextclade_columns"].get(
                w.segment,
                ["seqName", "clade", "short_clade", "aaSubstitutions"],
            )
        ),
    shell:
        """
        tsv-select -H -f {params.nextclade_columns} {input.nextclade} \
            | csvtk join -t --fields "seqName;strain" /dev/stdin {input.metadata} > {output.metadata}
        """


rule estimate_region_frequencies:
    input:
        "data/{lineage}/combined_{segment}.tsv",
    output:
        output_csv="results/{lineage}_{segment}/region-frequencies.csv",
    params:
        min_date=min_date,
        geo_categories=config.get("geo_categories", "continent"),
        frequency_category=lambda w: config["frequency_category"][w.segment],
    shell:
        """
        python scripts/fit_single_frequencies.py \
            --metadata {input} \
            --geo-categories {params.geo_categories} \
            --frequency-category {params.frequency_category} \
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
        geo_categories=config.get("geo_categories", "continent"),
    shell:
        """
        python scripts/fit_single_frequencies.py \
            --metadata {input} \
            --geo-categories {params.geo_categories} \
            --frequency-category mutation-{wildcards.mutation} \
            --min-date {params.min_date} \
            --days 14 \
            --output-csv {output.output_csv}
        """


rule estimate_region_country_frequencies:
    input:
        "data/{lineage}/combined_{segment}.tsv",
    output:
        output_csv="results/{lineage}_{segment}/continent-country-frequencies.csv",
    params:
        min_date=min_date,
        frequency_category=lambda w: config["frequency_category"][w.segment],
    shell:
        """
        python scripts/fit_hierarchical_frequencies.py \
            --metadata {input} \
            --geo-categories continent iso3 \
            --frequency-category {params.frequency_category} \
            --min-date {params.min_date} \
            --days 14 \
            --inclusive-clades flu \
            --output-csv {output.output_csv}
        """


rule population_weighted_region_frequencies:
    input:
        fit_results="results/{lineage}_{segment}/continent-country-frequencies.csv",
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

rule download_auspice_config_json:
    output:
        config="results/{lineage}_{segment}/auspice_config.json",
    shell:
        """
        curl \
            -o {output.config} \
            -L \
            'https://raw.githubusercontent.com/nextstrain/seasonal-flu/master/profiles/nextflu-private/{wildcards.lineage}/{wildcards.segment}/auspice_config.json'
        """

rule multi_region_plot_clades:
    input:
        freqs="results/{lineage}_{segment}/region-frequencies.csv",
        auspice_config="results/{lineage}_{segment}/auspice_config.json",
    output:
        plot="plots/{lineage}_{segment}/region-clades.png",
    params:
        clades_argument=lambda wildcards: f"--clades {' '.join(config['clades_to_plot'][wildcards.lineage][wildcards.segment])}"
        if config.get("clades_to_plot", {})
        .get(wildcards.lineage, {})
        .get(wildcards.segment)
        else "",
        coloring_field_argument=lambda wildcards: f"--coloring-field {config['coloring_field']}"
        if config.get("coloring_field")
        else "",
        regions=regions,
        max_freq=0.2,
    shell:
        """
        python3 scripts/plot_multi-region.py \
                --frequencies {input.freqs}  \
                --regions {params.regions:q} \
                --max-freq {params.max_freq} \
                --auspice-config {input.auspice_config} \
                {params.clades_argument} \
                {params.coloring_field_argument} \
                --output {output.plot}
        """


rule multi_region_plot_mutation:
    input:
        freqs="results/{lineage}_{segment}/mutation_{mutation}-frequencies.csv",
    output:
        plot="plots/{lineage}_{segment}/region_mut-{mutation}.png",
    params:
        regions=regions,
        max_freq=0.05,
    shell:
        """
        python3 scripts/plot_multi-region.py --frequencies {input.freqs} --regions {params.regions:q}  --max-freq {params.max_freq} --output {output.plot}
        """


#        clades = ['1a.1', '2a.1', '2a.1a', '2a.1b', '2a.3a',  '2a.3a.1','2a.3b', '2b'],


rule copy_web:
    """
    Copy results to web directory
    Use like so:  snakemake --profile profiles/flu data_web/inputs/flu-h3n2-ha.csv
    """
    input:
        "results/{lineage}_{segment}/continent-country-frequencies.csv",
    output:
        "data_web/inputs/flu-{lineage}-{segment}.csv",
    shell:
        """
        cp {input} {output}
        """


rule prep_web:
    input:
        expand(
            "data_web/inputs/flu-{lineage}-{segment}.csv",
            lineage=["h3n2", "h1n1pdm", "vic"],
            segment=["ha", "na"],
        ),


rule clean:
    shell:
        "rm -rf data/ results/ plots/"
