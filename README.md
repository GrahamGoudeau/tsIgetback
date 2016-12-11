# I Get Back

## Building Locally

1. Get `mongo` installed
  * If you are on a Mac, the easiest way is with `brew install mongodb`, assuming that you have `homebrew` installed.
  * Otherwise I haven't tested the install, and I recommend following the official documentation https://docs.mongodb.com/v3.2/installation/
  * If you are on Mac OS X, you may need to fix a directory permissions oddity like this: http://stackoverflow.com/a/31616194
1. Run `brew install node` which will install the programs `node` and `npm` globally
1. Clone the repo
1. Run `npm install`
  * When the installation is finished, it will automatically try to compile the backend Typescript files.  If this build fails with the error message `Variable 'module' must be of type 'NodeModule', but here has type...`, then currently the only known fix is to edit `node_modules/\@types/tsmonad/index.d.ts` (may or may not need the backslash before the `@` character).  Line 682 of that file should be changed to: `declare var module: NodeModule;`.  Then the build should work.
1. At this point you should be able to compile the backend Typescript with `npm run build`.
  * (You could also install the Typescript compiler globally with `npm install -g typescript`)
1. In order to run the backend server, you need:
  * At least the three following:
    * `mongo` running on port 27017 (should be the default)- run `mongod`, and keep that terminal tab open in the background or in another window (`mongod` needs to be running for the server to connect to it)
    * a `.env` file defining your environment constants.  A minimum `.env` file can be created by defining the only required constant (in development) in the following way: run `echo 'CRYPT_PASS=PWD' > .env`, where you replace `PWD` with a password of your choosing.
    * the development server running with `npm run dev` (will watch for changes to files and reload when a change occurs)
  * And if you are developing, you may like to do:
    * `tsc -w` (assuming the compiler is globally installed, or do `npm run watch` if it is not) to have the compiler watch for changes to `*.ts` files.
1. With the server running, you should be able to run the tests with `npm run test`.
1. If you would like to use `tsc` or `tsc -w` instead of `npm run build` and `npm run watch` respectively, do `npm install -g typescript`
