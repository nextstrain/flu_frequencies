# Web application

The website is automaticlly deployed to the following URLs:

| branch  | URL                                        |
|---------|--------------------------------------------|
| release | https://flu-frequencies.vercel.app/        |
| master  | https://master-flu-frequencies.vercel.app/ |

## Development

This web application is implemented uusing React and Typescript. It uses Node.js and many NPM packages for development purposes.

### Requirements

- Node.js 18
- yarn

> ⚠️ IMPORTANT
> 
> We recommend to install Node.js using [NVM](https://github.com/nvm-sh/nvm), direct installation from an [official tarball](https://nodejs.org/en/download), or to use [official Node.js docker container images](https://hub.docker.com/_/node/). Node.js from Linux package repositores, conda, brew and other sources, as well as Node.js distributions installed system-wide, with root priveledges are not supported (you can try, and it might even work, but there's no guarantee). Yarn is typically included into all modern Node.js installations by default. If not, install it manually.
> 
> You can find the recommended, known working, version of Node.js in `.nvmrc` file. If you choose to use NVM, it should pick up the version from `.nvmrc` automatically.
> 
> Refer to Node.js, NVM and yarn documentation for more details.

### Setup

```bash
git clone https://github.com/nextstrain/flu_frequencies
cp .env.example .env
yarn install
yarn dev
```

Access the web interface at http://localhost:3000

<blockquote>
<details>
  <summary> ℹ️ Detailed instructions for installing recent node/nvm/yarn (click to expand)</summary>

This document provides some instructions for setting up a development environment for working on the front end of this module. These steps assume that you are on a Debian/Ubuntu system (I was running Ubuntu 20.04) without any additional Node-related packages installed. It should not require super-user privileges.

1. Clone this repository and enter the package root with `cd flu_frequencies/web`.
2. The version of Node.js provided with Ubuntu 20 is too old (v10.19.0). To install a newer version that co-exists with the system version, I used [Node Version Manager](https://github.com/nvm-sh/nvm). Use one of the [installation script](https://github.com/nvm-sh/nvm#install--update-script) provided by the developers. This creates a hidden directory `.nvm` under `$HOME`.
   ```console
   art@Kestrel:~/git/flu_frequencies/web$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
     % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                    Dload  Upload   Total   Spent    Left  Speed
   100 15916  100 15916    0     0   353k      0 --:--:-- --:--:-- --:--:--  353k
   => Downloading nvm from git to '/home/art/.nvm'
   => Cloning into '/home/art/.nvm'...
   remote: Enumerating objects: 359, done.
   remote: Counting objects: 100% (359/359), done.
   remote: Compressing objects: 100% (305/305), done.
   remote: Total 359 (delta 40), reused 168 (delta 28), pack-reused 0
   Receiving objects: 100% (359/359), 219.46 KiB | 13.72 MiB/s, done.
   Resolving deltas: 100% (40/40), done.
   * (HEAD detached at FETCH_HEAD)
     master
   => Compressing and cleaning up git repository
   
   => nvm source string already in /home/art/.bashrc
   => bash_completion source string already in /home/art/.bashrc
   => Close and reopen your terminal to start using nvm or run the following to use it now:
   
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
   [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
   ```
3. Open a new terminal window so that `$PATH` binary search path includes the `.nvm` directory.
4. We want to install the Node.js version specified in the hidden `.nvmrc` file.  (Currently the version number is `18.14.0`.)  To automatically install the required version, run `nvm install` and `nvm use`:
   ```console
   Downloading and installing node v18.14.0...
   Downloading https://Node.js.org/dist/v18.14.0/node-v18.14.0-linux-x64.tar.xz...
   ###################################################################################### 100.0%
   Computing checksum with sha256sum
   Checksums matched!
   Now using node v18.14.0 (npm v9.3.1)
   Creating default alias: default -> 18.14.0 (-> v18.14.0)
   ```
   You can confirm that you are running this new version with the following command:
   ```console
   art@Kestrel:~/git/flu_frequencies/web$ which node
   /home/art/.nvm/versions/node/v18.14.0/bin/node
   ```
5. The above step also installs the [Node Package Manager](https://www.npmjs.com/) `npm` in the same local directory. Install the package dependencies by running `npm install` (if the package manager complains about conflicting dependencies, use a `-force` flag).
6. Install the [Yarn](https://yarnpkg.com/) package manager: `npm install --global yarn`
7. Copy the environment variables with `cp .env.example .env`.
8. Run `yarn install` and `yarn dev` to start the server.
9. Navigate to `localhost:3000` in your web browser.

</details>
</blockquote> 


### Branches, release and deployment

Each branch and pull request to the repository is deployed using Vercel. You can access dashboard at https://vercel.com/nextstrain/flu-frequencies. If you don't have access, request permissions from your team officer.

Vercel bot will automatically comment on your pull request with a URL to the preview deployment of the app. You can access all current and past deployments in the Vercel dashboard.

Branch `master` is the development branch, which accumulates pre-release features. Open pull requests against `master` and merge them after review by the team.

The branch `release` contains latest production version. After discussion with the team, you can release the new version by:

- incrementing `version` field in `web/package.json`
- fast-forward merge of `master` branch into `release` branch, then pushing `release` branch (the push will trigger automatic deployment on Vercel)
