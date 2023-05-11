# Estimating flu clade and mutation frequencies

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

### TODO

- Provide mamba environment file for simpler setup
- Agree on formatters to use (snakefmt and black?)
