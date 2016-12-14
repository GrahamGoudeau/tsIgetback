import * as express from 'express';
import * as user from './api/user';
import * as trips from './api/trips';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as utils from './api/utils';
import * as db from './api/db';
import * as path from 'path';
import { HttpMethod, InsecureRoute, InsecureRouteBuilder, SecureRoute, SecureRouteBuilder } from './api/utils';

const app: express.Express = express();

// app configuration must appear before routes are set
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const clientDir: string = `${__dirname}/../client/dist/`;
app.use('/static/', express.static(path.resolve(clientDir)));

// load data files into memory
const airportCodesFile: string = `${__dirname}/data/airport-codes.dat`;
const collegesFile: string = `${__dirname}/data/colleges.dat`;

const airportCodes: string[] = utils.readLines(airportCodesFile);
console.log(`Loaded ${airportCodes.length} airorts`);
const colleges: string[] = utils.readLines(collegesFile);
console.log(`Loaded ${colleges.length} colleges`);

// connect to the db
let dbUrl: string;
if (process.env.PRODUCTION === 'true') {
    console.log('Using production database');
    let env = process.env;
    dbUrl = `${env.PROD_DB_PREFIX}${env.DB_USER}:${env.DB_PASS}${env.PROD_DB_SUFFIX}`;
} else {
    console.log('Using dev database');
    dbUrl = 'mongodb://localhost:27017/igetback-db';
}
console.log(`Connecting to ${dbUrl}`);
mongoose.connect(dbUrl);

// set up routes
const routeManager = new utils.RouteManager(app);

// route builders
const userCreateBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder('/api/user/create', user.handleCreateUser)
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const userDeleteBuilder: SecureRouteBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/delete', user.handleDelete)
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.DELETE);

const loginBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder('/api/user/login', user.handleLogin)
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const tripFromCampusCreateBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromCampus/create', trips.handleFromCampusCreate)
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const tripFromAirportCreateBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromAirport/create', trips.handleFromAirportCreate)
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const fromCampusJoinBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromCampus/join', trips.handleJoinTripFromCampus)
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const fromAirportJoinBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromAirport/join', trips.handleJoinTripFromAirport)
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const fromCampusDeleteBuider = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromCampus/delete/:tripId', (req, res, token) => {
    trips.handleDeleteTrip(req, res, token, db.AddToCampusOrAirport.FROM_CAMPUS);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.DELETE);

const fromAirportDeleteBuider = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromAirport/delete/:tripId', (req, res, token) => {
    trips.handleDeleteTrip(req, res, token, db.AddToCampusOrAirport.FROM_AIRPORT);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.DELETE);

const accountBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/account', user.handleGetAccount)
    .setIsAjax(true);

const verifyUserBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder(`/${utils.VERIFY_ENDPOINT}/:recordId`, user.handleVerify);

const catchAllBuilder: utils.InsecureRouteBuilder = new utils.InsecureRouteBuilder('/*', (req, res) => {
    res.sendFile(path.resolve(`${clientDir}/../index.html`));
});


// construct and set routes
const catchAllRoute: InsecureRoute = <InsecureRoute>new InsecureRoute(catchAllBuilder);
const createRoute: InsecureRoute = new InsecureRoute(userCreateBuilder);
const deleteUserRoute: SecureRoute = new SecureRoute(userDeleteBuilder);
const accountRoute: SecureRoute = new SecureRoute(accountBuilder);
const loginRoute: InsecureRoute = new InsecureRoute(loginBuilder);
const fromCampusCreateRoute: SecureRoute = new SecureRoute(tripFromCampusCreateBuilder);
const fromAirportCreateRoute: SecureRoute = new SecureRoute(tripFromAirportCreateBuilder);
const fromCampusJoinRoute: SecureRoute = new SecureRoute(fromCampusJoinBuilder);
const fromAirportJoinRoute: SecureRoute = new SecureRoute(fromAirportJoinBuilder);
const fromCampusDeleteRoute: SecureRoute = new SecureRoute(fromCampusDeleteBuider);
const fromAirportDeleteRoute: SecureRoute = new SecureRoute(fromAirportDeleteBuider);
const verifyUserRoute: InsecureRoute = new InsecureRoute(verifyUserBuilder);

const insecureRoutes = [
    createRoute,
    loginRoute,
    verifyUserRoute,

    // make sure this is the last array element
    catchAllRoute,
];

const secureRoutes = [
    fromCampusCreateRoute,
    fromAirportCreateRoute,
    deleteUserRoute,
    accountRoute,
    fromCampusJoinRoute,
    fromAirportJoinRoute,
    fromCampusDeleteRoute,
    fromAirportDeleteRoute
];

routeManager.addSecureRoutes(secureRoutes);

// make sure we add the routes with the catch-all last
routeManager.addInsecureRoutes(insecureRoutes);


// run
const port = process.env.PORT || 5000;
app.listen(port);
console.log(`Listening on port ${port}`);
