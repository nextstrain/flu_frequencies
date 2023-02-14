regions = ['North America', 'Europe', 'Japan Korea', 'Africa', 'West Asia',
           'Oceania', 'South America', 'South Asia',
           'Southeast Asia']

min_date = '2021-12-01'

rule europe:
    input:
        [
        "plots/h3n2/Region_Europe.png",
        "plots/h1n1pdm/Region_Europe.png",
        "plots/h3n2/Country_Europe_Spain.png",
        "plots/h3n2/Country_Europe_Netherlands.png",
        "plots/h3n2/Country_Europe_United-Kingdom.png",
        "plots/h3n2/Country_Europe_France.png",
        "plots/h1n1pdm/Country_Europe_Spain.png",
        "plots/h1n1pdm/Country_Europe_Netherlands.png",
        "plots/h1n1pdm/Country_Europe_United-Kingdom.png",
        "plots/h1n1pdm/Country_Europe_France.png",
        ]



rule get_nextclade_dataset:
    output:
         "{lineage}/reference.fasta"
    threads: 4
    shell:
        """
        nextclade dataset get -n flu_{wildcards.lineage}_ha --output-dir {wildcards.lineage}
        """

rule run_nextclade:
    input:
        sequences = "data/{lineage}/ha.fasta",
        reference = "{lineage}/reference.fasta"
    output:
         "data/{lineage}/nextclade.tsv"
    threads: 4
    shell:
        """
        nextclade run -j {threads} -D {wildcards.lineage} {input.sequences} --output-tsv {output}
        """

rule combined_with_metadata:
    input:
        nextclade = "data/{lineage}/nextclade.tsv",
        metadata = "data/{lineage}/metadata.tsv"
    output:
        "data/{lineage}/combined.tsv"
    params:
        col = lambda w: "clade" if w.lineage == "vic" else "short_clade"
    run:
        import pandas as pd
        clades = pd.read_csv(input[0], sep='\t', index_col='seqName')[params.col]
        aaSubstitutions = pd.read_csv(input[0], sep='\t', index_col='seqName')["aaSubstitutions"]

        metadata = pd.read_csv(input[1], sep='\t', index_col='strain')
        metadata["clade"] = clades
        metadata["aaSubstitutions"] = aaSubstitutions

        metadata.to_csv(output[0], sep='\t', index=False)


rule estimate_region_frequencies:
    input:
        "data/{lineage}/combined.tsv"
    output:
        output_json = "data/{lineage}_region-frequencies.json"
    params:
        min_date = min_date
    shell:
        """
        python scripts/fit_single_frequencies.py --metadata {input} --geo-categories region --frequency-category clade \
                --min-date {params.min_date} --days 14 --output-json {output.output_json}
        """

rule estimate_region_mutation_frequencies:
    input:
        "data/{lineage}/combined.tsv"
    output:
        output_json = "data/{lineage}_mutation_{mutation}-frequencies.json"
    params:
        min_date = min_date
    shell:
        """
        python scripts/fit_single_frequencies.py --metadata {input} --geo-categories region --frequency-category mutation-{wildcards.mutation} \
                --min-date {params.min_date} --days 14 --output-json {output.output_json}
        """


rule estimate_region_country_frequencies:
    input:
        "data/{lineage}/combined.tsv"
    output:
        output_json = "data/{lineage}_region-country-frequencies.json",
    params:
        min_date = min_date
    shell:
        """
        python scripts/fit_hierarchical_frequencies.py --metadata {input} \
                --geo-categories region country --frequency-category clade \
                --min-date {params.min_date} --days 14 --output-json {output.output_json}
        """

rule plot_regions:
    input:
        freqs = "data/{lineage}_region-frequencies.json",
    output:
        plot = "plots/{lineage}/Region_{region}.png",
    params:
        max_freq = 0.1
    shell:
        """
        python scripts/plot_region.py --frequencies {input.freqs} --region {wildcards.region:q} \
                --max-freq {params.max_freq} --output {output.plot}
        """

rule plot_mutations:
    input:
        freqs = "data/{lineage}_mutation_{mutation}-frequencies.json",
    output:
        plot = "plots/{lineage}/mutation_{region}-{mutation}.png",
    params:
        max_freq = 0.05
    shell:
        """
        python scripts/plot_region.py --frequencies {input.freqs} --region {wildcards.region:q} \
                --max-freq {params.max_freq} --output {output.plot}
        """


rule plot_country:
    input:
        freqs = "data/{lineage}_region-country-frequencies.json",
    output:
        plot = "plots/{lineage}/Country_{region}_{country}.png",
    params:
        max_freq = 0.1
    shell:
        """
        python scripts/plot_country.py --frequencies {input.freqs} --region {wildcards.region:q} --country {wildcards.country:q} \
                --max-freq {params.max_freq} --output {output.plot}
        """

rule multi_region_plot_clades:
    input:
        freqs = "data/{lineage}_region-frequencies.json",
    output:
        plot = "plots/{lineage}/region-clades.png",
    params:
        regions = [ 'Africa',
                    'Europe',
                    'North_America',
                    'South_America',
                    'South_Asia',
                    'Oceania'
                ],
        max_freq = 0.2
    shell:
        """
        python3 scripts/plot_multi-region.py --frequencies {input.freqs} --regions {params.regions}  --max-freq {params.max_freq} --output {output.plot}
        """

rule multi_region_plot_mutation:
    input:
        freqs = "data/{lineage}_mutation_{mutation}-frequencies.json",
    output:
        plot = "plots/{lineage}/region_mut-{mutation}.png",
    params:
        regions = [ 'Africa',
                    'Europe',
                    'North_America',
                    'South_America',
                    'South_Asia',
                    'Oceania'
                ],
        max_freq = 0.2
    shell:
        """
        python3 scripts/plot_multi-region.py --frequencies {input.freqs} --regions {params.regions}  --max-freq {params.max_freq} --output {output.plot}
        """

#        clades = ['1a.1', '2a.1', '2a.1a', '2a.1b', '2a.3a',  '2a.3a.1','2a.3b', '2b'],
