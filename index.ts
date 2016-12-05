import * as express from 'express';
import * as user from './api/user';
import * as trips from './api/trips';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as utils from './api/utils';
import { HttpMethod, InsecureRoute, InsecureRouteBuilder, SecureRoute, SecureRouteBuilder } from './api/utils';
import * as tsmonad from 'tsmonad';

type Either<L, R> = tsmonad.Either<L, R>;
const Either = tsmonad.Either;

const app: express.Express = express();

// app configuration must appear before routes are set
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// load data files into memory
const airportCodesFile: string = `${__dirname}/data/airport-codes.dat`;
const collegesFile: string = `${__dirname}/data/colleges.dat`;

const airportCodes: string[] = utils.readLines(airportCodesFile);
const colleges: string[] = utils.readLines(collegesFile);

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
const indexBuilder: utils.InsecureRouteBuilder = new utils.InsecureRouteBuilder('/', (req, res) => {
    console.log('responding...');
    res.json('ok');
});

const userCreateBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder('/api/user/create', user.handleCreateUser)
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const userDeleteBuilder: SecureRouteBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/delete', user.handleDelete)
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.DELETE);

const loginBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new InsecureRouteBuilder('/api/user/login', user.handleLogin)
    .setIsAjax(true)
    .setHttpMethod(HttpMethod.POST);

const secureTestBuilder: SecureRouteBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/secure', (req, res, token) => {
    console.log('testing');
    res.send('in secure');
}).setIsAjax(true);

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

// construct and set routes
const indexRoute: InsecureRoute = <InsecureRoute>new InsecureRoute(indexBuilder);
const createRoute: InsecureRoute = new InsecureRoute(userCreateBuilder);
const deleteUserRoute: SecureRoute = new SecureRoute(userDeleteBuilder);
const loginRoute: InsecureRoute = new InsecureRoute(loginBuilder);
const secureRoute: SecureRoute = new SecureRoute(secureTestBuilder);
const fromCampusCreateRoute: SecureRoute = new SecureRoute(tripFromCampusCreateBuilder);
const fromAirportCreateRoute: SecureRoute = new SecureRoute(tripFromAirportCreateBuilder);
const fromCampusJoinRoute: SecureRoute = new SecureRoute(fromCampusJoinBuilder);
const fromAirportJoinRotue: SecureRoute = new SecureRoute(fromAirportJoinBuilder);

const insecureRoutes = [
    indexRoute,
    createRoute,
    loginRoute,
];

const secureRoutes = [
    fromCampusCreateRoute,
    fromAirportCreateRoute,
    deleteUserRoute,
    fromCampusJoinRoute,
    fromAirportJoinRotue,
];

routeManager.addInsecureRoutes(insecureRoutes);
routeManager.addSecureRoutes(secureRoutes);


// run
const port = process.env.PORT || 5000;
const server = app.listen(port);
console.log(`Listening on port ${port}`);
