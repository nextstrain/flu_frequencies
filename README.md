# Estimating flu clade and mutation frequencies

This README is for the data analysis pipeline. For the web interface, see [web/README.md](web/README.md).

## Development

### Setup

#### Using Nextstrain CLI

<details>

<summary>Currently not working due to lack of polars in Nextstrain managed environments (conda/docker)</summary>

##### Install Nextstrain CLI

On Linux:

```bash
curl -fsSL --proto '=https' https://nextstrain.org/cli/installer/linux | bash
```

On macOS:

```zsh
curl -fsSL --proto '=https' https://nextstrain.org/cli/installer/mac | bash
```

##### Setup Nextstrain CLI

You can set it up to use Docker or a Nextstrain managed conda environment (completely independent of any other conda environments you may have).

Using docker:

```bash
nextstrain setup --set-default docker
```

Using managed conda environment:

```bash
nextstrain setup --set-default conda
```

##### Run analysis

Run analysis:

```bash
nextstrain build . --profile profiles/flu
```

</details>

#### Using custom conda environment

Install conda environment:

```bash
mamba env create -f environment.yml
```

Activate the environment:

```bash
conda activate flu_frequencies
```

Run for flu using:

```bash
snakemake --profile profiles/flu
```

Run for SARS-CoV-2 using:

```bash
snakemake --profile profiles/SC2
```

### Viewing results in web app

Copy snakemake workflow results to `data_web/inputs`, ensuring that correct filenames are used, e.g.:

```bash
cp results/h3n2/continent-country-frequencies.csv data_web/inputs/flu-h3n2.csv
```

Then process the csv files into json:

```bash
python scripts/web_convert.py --input-pathogens-json data_web/inputs/pathogens.json --output-dir web/public/data
```

### TODO

- Provide mamba environment file for simpler setup
- Agree on formatters to use (snakefmt and black?)
