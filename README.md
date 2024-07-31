# Flu frequencies

> Estimating flu clade and mutation frequencies

| branch  | URL                                        |
|---------|--------------------------------------------|
| release | https://flu-frequencies.vercel.app/        |
| master  | https://master-flu-frequencies.vercel.app/ |

## Development

This README is for the data analysis pipeline. For the web interface, see [web/README.md](web/README.md).

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

Run the following command to generate flu frequencies and copy the resulting CSV tables into `data_web/inputs`.

``` bash
snakemake prep_web --profile profiles/flu
```

Generate the JSON versions of the CSV tables that the web application uses.

```bash
python scripts/web_convert.py --input-pathogens-json data_web/inputs/pathogens.json --output-dir web/public/data
```

Commit the updated JSON files in `web/public/data` to a development or base branch and push to GitHub to deploy a Preview version of the web application.
Vercel deploys a web application for each commit in a pull request.
You can access each deployment through the repository's [Deployments](https://github.com/nextstrain/flu_frequencies/deployments) page.
The `master` branch is automatically deployed to https://master-flu-frequencies.vercel.app/ to surface "pre-releases" and to accumulate features before making a public release.
This pre-release site can also serve a stable link for the most curious early users.
The `release` branch is automatically deployed to https://flu-frequencies.vercel.app/ which is the current "public release".
To make a public release it is sufficient to push (typically fast-forward) the `master` branch to the `release` branch.

``` bash
git push origin master:release
```

### TODO

- Provide mamba environment file for simpler setup
- Agree on formatters to use (snakefmt and black?)
