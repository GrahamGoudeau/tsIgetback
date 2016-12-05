# I Get Back

## Building Locally

1. Get `mongo` installed
  * If you are on a Mac, the easiest way is with `brew install mongodb`, assuming that you have `homebrew` installed.
  * Otherwise I haven't tested the install, and I recommend following the official documentation https://docs.mongodb.com/v3.2/installation/
  * If you are on Mac OS X, you may need to fix a directory permissions oddity like this: http://stackoverflow.com/a/31616194
1. Install `node` and `npm` globally
1. Clone the repo
1. Run `npm install`
1. At this point you should be able to compile the backend Typescript with `npm run build`.
  * (You could also install the Typescript compiler globally with `npm install -g typescript`)
1. In order to run the backend server, you need:
  * At least the three following:
    * `mongo` running on port 27017 (should be the default)
    * a `.env` file defining your environment constants.  A minimum `.env` file can be created by defining the only required constant (in development) in the following way: run `echo 'CRYPT_PASS=PWD' > .env`, where you replace `PWD` with a password of your choosing.
    * the development server running with `npm run dev` (will watch for changes to files and reload when a change occurs)
  * And if you are developing, you may like to do:
    * `tsc -w` (assuming the compiler is globally installed, or do `npm run watch` if it is not) to have the compiler watch for changes to `*.ts` files.
1. With the server running, you should be able to run the tests with `npm run test`.    
