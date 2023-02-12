regions = ['North America', 'Europe', 'Japan Korea', 'Africa', 'West Asia',
           'Oceania', 'South America', 'South Asia',
           'Southeast Asia']


rule run_nextclade:
    input:
        "data/{lineage}/ha.fasta"
    output:
         "data/{lineage}/nextclade.tsv"
    threads: 4
    shell:
        """
        nextclade run -j {threads} -D {wildcards.lineage} {input} --output-tsv {output}
        """

rule combined_with_metadata:
    input:
        nextclade = "data/{lineage}/nextclade.tsv",
        metadata = "data/{lineage}/metadata.tsv"
    output:
        "data/{lineage}/combined.tsv"
    run:
        import pandas as pd
        clades = pd.read_csv(input[0], sep='\t', index_col='seqName')["clade"]
        metadata = pd.read_csv(input[1], sep='\t', index_col='strain')
        metadata["clade"] = clades

        metadata.to_csv(output[0], sep='\t', index=False)


rule estimate_region_frequencies:
    input:
        "data/{lineage}/combined.tsv"
    output:
        plot = expand("plots/{{lineage}}/{region}_frequencies.png", region=[x.replace(' ', '_') for x in regions]),
        output_json = "data/{lineage}_region-frequencies.json"
    params:
        output_mask = "plots/{lineage}/\{cat\}_frequencies.png",
    shell:
        """
        python scripts/fit_single_frequencies.py --metadata {input} --geo-categories region --frequency-category clade \
                --min-date 2021-07-01 --days 14 --output-mask {params.output_mask} --output-json {output.output_json}
        """

rule estimate_region_country_frequencies:
    input:
        "data/{lineage}/combined.tsv"
    output:
        output_json = "data/{lineage}_region-country-frequencies.json"
    shell:
        """
        python scripts/fit_hierarchical_frequencies.py --metadata {input} \
                --geo-categories region country --frequency-category clade \
                --min-date 2021-07-01 --days 14 --output-json {output.output_json}
        """
