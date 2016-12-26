import * as express from 'express';
import * as user from './api/user';
import * as trips from './api/trips';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as utils from './api/utils';
import { HttpMethod, RouteManager, InsecureRoute, InsecureRouteBuilder, SecureRoute, SecureRouteBuilder } from './routeUtils';
import * as db from './api/db';
import * as path from 'path';
import { LoggerModule } from './api/logger';
import { IGetBackConfig } from './config';

const log = new LoggerModule('index');
const app: express.Express = express();
const config = IGetBackConfig.getInstance();
const verifyEndpoint = config.getStringConfig('VERIFY_ENDPOINT');
const isProduction = config.getBooleanConfigDefault('PRODUCTION', false);

// app configuration must appear before routes are set
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const clientDir: string = `${__dirname}/../client/dist/`;
app.use('/static/', express.static(path.resolve(clientDir)));

// load data files into memory
const airportCodesFile: string = `${__dirname}/data/airport-codes.dat`;
const collegesFile: string = `${__dirname}/data/colleges.dat`;

const airportCodes: string[] = utils.readLines(airportCodesFile).sort();
log.INFO(`Loaded ${airportCodes.length} airorts`);
const colleges: string[] = utils.readLines(collegesFile).sort();
log.INFO(`Loaded ${colleges.length} colleges`);

// connect to the db
let dbUrl: string;
if (isProduction) {
    log.INFO('Using production database');
    const prefix: string = config.getStringConfig('PROD_DB_PREFIX');
    const user: string = config.getStringConfig('DB_USER');
    const pass: string = config.getStringConfig('DB_PASS');
    const suffix: string = config.getStringConfig('PROD_DB_SUFFIX');
    dbUrl = `${prefix}${user}:${pass}${suffix}`;
} else {
    log.INFO('Using dev database');
    dbUrl = 'mongodb://localhost:27017/igetback-db';
}
log.DEBUG(`Connecting to ${dbUrl}`);
mongoose.connect(dbUrl);

// set up routes
const routeManager = new RouteManager(app);

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

const fromCampusSubscribeBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/subscribe/fromCampus', async (req, res, token) => {
    await user.handleSubscribe(req, res, token, db.AddToCampusOrAirport.FROM_CAMPUS);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const fromAirportSubscribeBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/subscribe/fromAirport', async (req, res, token) => {
    await user.handleSubscribe(req, res, token, db.AddToCampusOrAirport.FROM_AIRPORT);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const accountBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/account', user.handleGetAccount)
    .setIsAjax(true);

const verifyUserBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder(`/${verifyEndpoint}/:recordId`, user.handleVerify);

const catchAllBuilder: InsecureRouteBuilder = new InsecureRouteBuilder('/*', (req, res) => {
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
const fromCampusSubscribeRoute: SecureRoute = new SecureRoute(fromCampusSubscribeBuilder);
const fromAirportSubscribeRoute: SecureRoute = new SecureRoute(fromAirportSubscribeBuilder);
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
    fromAirportDeleteRoute,
    fromCampusSubscribeRoute,
    fromAirportSubscribeRoute,
];

routeManager.addSecureRoutes(secureRoutes);

// make sure we add the routes with the catch-all last
routeManager.addInsecureRoutes(insecureRoutes);


// run
const port = config.getNumberConfig('PORT');
app.listen(port);
log.INFO(`Listening on port ${port}`);
