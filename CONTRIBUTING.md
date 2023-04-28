# Requirements
* [Python] version 3.x
* [node] version 14+
* 

# Installation
These steps were used to install dependencies and this module on a system running Ubuntu 20.04 without any additional Node-related packages installed.
1. Clone this repository and enter the package root with `cd flu_frequencies/web`.
2. The version of NodeJS provided with Ubuntu 20 is too old (v10.19.0).  To install a newer version that co-exists with the system version, I used [Node Version Manager](https://github.com/nvm-sh/nvm).  Use one of the [installation script](https://github.com/nvm-sh/nvm#install--update-script) provided by the developers.  This creates a hidden directory `.nvm` under `$HOME`.
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
4. Run `nvm install 18.14.0`.
   ```console
   Downloading and installing node v18.14.0...
   Downloading https://nodejs.org/dist/v18.14.0/node-v18.14.0-linux-x64.tar.xz...
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
5. The above step also installs the [Node Package Manager](https://www.npmjs.com/) `npm` in the same local directory.  We use this package manager to install the [Yarn](https://yarnpkg.com/) package manager: `npm install --global yarn`
6. Run `yarn dev`
