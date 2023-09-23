# Estimating flu clade and mutation frequencies

This README is for the data analysis pipeline. For the web interface, see [web/README.md](web/README.md).

## Development

### Setup

#### Using Nextstrain CLI

```bash
# Linux
curl -fsSL --proto '=https' https://nextstrain.org/cli/installer/linux | bash
# Mac
curl -fsSL --proto '=https' https://nextstrain.org/cli/installer/mac | bash
```

You can set it up to use Docker or a Nextstrain managed conda environment (completely independent of any other conda environments you may have).

```bash
# Managed conda
nextstrain setup --set-default conda
# Docker
nextstrain setup --set-default docker
```

Run analysis:

```bash
nextstrain build . --profile profiles/flu
```

#### Using custom conda or Python environment

You will have to have at least the following packages/binaries installed:

- `Python`
  - `snakemake`
  - `augur`
  - `polars`
- `nextclade`

Then run using:

```bash
snakemake --profile profiles/flu
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
