# I Get Back

## Building Locally

1. Get `mongo` installed
  * If you are on a Mac, the easiest way is with `brew install mongodb`, assuming that you have `homebrew` installed.
  * Otherwise I haven't tested the install, and I recommend following the official documentation https://docs.mongodb.com/v3.2/installation/
  * If you are on Mac OS X, you may need to fix a directory permissions oddity like this: http://stackoverflow.com/a/31616194
1. Run `brew install node` which will install the programs `node` and `npm` globally
1. Clone the repo
1. In the toplevel directory of the repo, run `./setup.sh`. This should take less than a minute, and you should not receive any errors.  This only needs to be done the first time you clone the repo. This will install all the necessary dependencies and bundle the frontend code together to be served to clients.
1. At this point you should be able to compile all the code for the site.
  * The backend code can be compiled in the `server` directory by `npm run build` (You could also install the Typescript compiler globally with `npm install -g typescript`).
  * The frontend code can be compiled in the `client` directory by `npm run webpack` (You could also install Webpack globally with `npm install -g webpack`).
1. In order to run the backend server, you need:
  * At least the three following:
    * `mongo` running on port 27017 (should be the default)- run `mongod`, and keep that terminal tab open in the background or in another window (`mongod` needs to be running for the server to connect to it)
    * a `.env` file defining your environment constants.  This includes things like the key used to encrypt passwords, port number, and other global config values.  A minimum `.env` file can be created by simply renaming the `.dev.env` file in `server/` to `.env`.  The `.dev.env` file contains the bare minimum amount of config settings needed to run the server, and contains some dummy values (like "halligan4lyfe" as the password) that you may change if you want, but you don't *need* to change anything.  Logging statements will appear when you start the server informing you which config values have not been defined; mostly, you can ignore these if no error is raised.
    * the development server running with `npm run dev` in the `server` directory (will watch for changes to files and reload when a change occurs)
  * And if you are developing, you may like to do:
    * For the backend (`server` directory): `tsc -w` (assuming the compiler is globally installed, or do `npm run watch` if it is not) to have the compiler watch for changes to `*.ts` files.
    * For the frontend (`client`): `npm run webpack:watch`
1. With the server running, you should be able to see the example page by launching your favorite browser and going to the address `localhost:5000`.
1. Global installs you may want to do:
  * `npm install -g typescript` - to make the Typescript compiler available globally, rather than going through npm (i.e. `npm run build`)
  * `npm install -g webpack` - to make Webpack available globally; used for building the front end
