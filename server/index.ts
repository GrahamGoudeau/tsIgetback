import * as express from 'express';
import * as user from './api/user';
import * as trips from './api/trips';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import { DestinationContext } from './destinationContext';
import { HttpMethod, RouteManager, InsecureRoute, InsecureRouteBuilder, SecureRoute, SecureRouteBuilder } from './utils/routeUtils';
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
const destinationContext: DestinationContext = DestinationContext.getInstance();
log.INFO(`Loaded ${destinationContext.getAirportCodes().size} airorts`);
log.INFO(`Loaded ${destinationContext.getColleges().size} colleges`);

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

const fromCampusDeleteBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromCampus/:tripId', (req, res, token) => {
    trips.handleDeleteTrip(req, res, token, db.AddToCampusOrAirport.FROM_CAMPUS);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.DELETE);

const fromAirportDeleteBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromAirport/:tripId', (req, res, token) => {
    trips.handleDeleteTrip(req, res, token, db.AddToCampusOrAirport.FROM_AIRPORT);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.DELETE);

const fromCampusGetBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromCampus/getMultiple', (req, res, token) => {
    trips.handleGetMultipleTrips(req, res, token, db.AddToCampusOrAirport.FROM_CAMPUS);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const fromAirportGetBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromAirport/getMultiple', (req, res, token) => {
    trips.handleGetMultipleTrips(req, res, token, db.AddToCampusOrAirport.FROM_AIRPORT);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const fromCampusSearchBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromCampus/search', (req, res, token) => {
    trips.handleSearch(req, res, token, db.AddToCampusOrAirport.FROM_CAMPUS);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const fromAirportSearchBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/fromAirport/search', (req, res, token) => {
    trips.handleSearch(req, res, token, db.AddToCampusOrAirport.FROM_AIRPORT);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const fromCampusSubscribeBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/subscriptions/fromCampus', async (req, res, token) => {
    await user.handleSubscribe(req, res, token, db.AddToCampusOrAirport.FROM_CAMPUS);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const fromAirportSubscribeBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/subscriptions/fromAirport', async (req, res, token) => {
    await user.handleSubscribe(req, res, token, db.AddToCampusOrAirport.FROM_AIRPORT);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const fromCampusSubscribeGetBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/subscriptions/fromCampus', async (req, res, token) => {
    await user.handleGetSubscriptions(req, res, token, db.AddToCampusOrAirport.FROM_CAMPUS);
})
    .setIsAjax(true);

const fromAirportSubscribeGetBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/subscriptions/fromAirport', async (req, res, token) => {
    await user.handleGetSubscriptions(req, res, token, db.AddToCampusOrAirport.FROM_AIRPORT);
})
    .setIsAjax(true);

const fromCampusSubscribeDeleteBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/subscriptions/fromCampus/:subscriptionId', async (req, res, token) => {
    await user.handleUnsubscribe(req, res, token, db.AddToCampusOrAirport.FROM_CAMPUS);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.DELETE);

const fromAirportSubscribeDeleteBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/subscriptions/fromAirport/:subscriptionId', async (req, res, token) => {
    await user.handleUnsubscribe(req, res, token, db.AddToCampusOrAirport.FROM_AIRPORT);
})
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.DELETE);

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
const fromCampusDeleteRoute: SecureRoute = new SecureRoute(fromCampusDeleteBuilder);
const fromAirportDeleteRoute: SecureRoute = new SecureRoute(fromAirportDeleteBuilder);
const fromCampusGetRoute: SecureRoute = new SecureRoute(fromCampusGetBuilder);
const fromAirportGetRoute: SecureRoute = new SecureRoute(fromAirportGetBuilder);
const fromCampusSearchRoute: SecureRoute = new SecureRoute(fromCampusSearchBuilder);
const fromAirportSearchRoute: SecureRoute = new SecureRoute(fromAirportSearchBuilder);
const fromCampusSubscribeRoute: SecureRoute = new SecureRoute(fromCampusSubscribeBuilder);
const fromAirportSubscribeRoute: SecureRoute = new SecureRoute(fromAirportSubscribeBuilder);
const fromCampusSubscribeGetRoute: SecureRoute = new SecureRoute(fromCampusSubscribeGetBuilder);
const fromAirportSubscribeGetRoute: SecureRoute = new SecureRoute(fromAirportSubscribeGetBuilder);
const fromCampusSubscribeDeleteRoute: SecureRoute = new SecureRoute(fromCampusSubscribeDeleteBuilder);
const fromAirportSubscribeDeleteRoute: SecureRoute = new SecureRoute(fromAirportSubscribeDeleteBuilder);
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
    fromCampusGetRoute,
    fromAirportGetRoute,
    fromCampusSearchRoute,
    fromAirportSearchRoute,
    fromCampusSubscribeRoute,
    fromAirportSubscribeRoute,
    fromCampusSubscribeGetRoute,
    fromAirportSubscribeGetRoute,
    fromCampusSubscribeDeleteRoute,
    fromAirportSubscribeDeleteRoute,
];

routeManager.addSecureRoutes(secureRoutes);

// make sure we add the routes with the catch-all last
routeManager.addInsecureRoutes(insecureRoutes);


// run
const port = config.getNumberConfig('PORT');
app.listen(port);
log.INFO(`Listening on port ${port}`);
