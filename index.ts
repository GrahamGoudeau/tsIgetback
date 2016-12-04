import * as express from 'express';
import * as user from './user';
import * as trips from './trips';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as utils from './utils';
import { InsecureRoute, InsecureRouteBuilder, SecureRoute, SecureRouteBuilder } from './utils';
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
    dbUrl = 'mongodb://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@ds019886.mlab.com:19886/igetback-db';
} else {
    console.log('Using dev database');
    dbUrl = 'mongodb://localhost:27017/igetback-db';
}
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
    .setHttpMethod(utils.HttpMethod.POST);

const userDeleteBuilder: SecureRouteBuilder = <SecureRouteBuilder>new SecureRouteBuilder('/api/user/delete', user.handleDelete)
    .setIsAjax(true)
    .setHttpMethod(utils.HttpMethod.DELETE);

const loginBuilder: InsecureRouteBuilder = <InsecureRouteBuilder>new utils.InsecureRouteBuilder('/api/user/login', user.handleLogin)
    .setIsAjax(true)
    .setHttpMethod(utils.HttpMethod.POST);

const secureTestBuilder: SecureRouteBuilder = <SecureRouteBuilder>new utils.SecureRouteBuilder('/api/secure', (req, res, token) => {
    console.log('testing');
    res.send('in secure');
}).setIsAjax(true);

const tripFromCampusCreateBuilder = <SecureRouteBuilder>new utils.SecureRouteBuilder('/api/fromCampus/create', trips.handleFromCampusCreate)
    .setIsAjax(true)
    .setHttpMethod(utils.HttpMethod.POST);

const tripFromAirportCreateBuilder = <SecureRouteBuilder>new utils.SecureRouteBuilder('/api/fromAirport/create', trips.handleFromAirportCreate)
    .setIsAjax(true)
    .setHttpMethod(utils.HttpMethod.POST);

// construct and set routes
const indexRoute: utils.InsecureRoute = <InsecureRoute>new utils.InsecureRoute(indexBuilder);
const createRoute: utils.InsecureRoute = new utils.InsecureRoute(userCreateBuilder);
const deleteUserRoute: utils.SecureRoute = new utils.SecureRoute(userDeleteBuilder);
const loginRoute: utils.InsecureRoute = new utils.InsecureRoute(loginBuilder);
const secureRoute: utils.SecureRoute = new utils.SecureRoute(secureTestBuilder);
const fromCampusCreateRoute: utils.SecureRoute = new utils.SecureRoute(tripFromCampusCreateBuilder);
const fromAirportCreateRoute: utils.SecureRoute = new utils.SecureRoute(tripFromAirportCreateBuilder);

const insecureRoutes = [
    indexRoute,
    createRoute,
    loginRoute,
];

const secureRoutes = [
    fromCampusCreateRoute,
    fromAirportCreateRoute,
    deleteUserRoute,
];

routeManager.addInsecureRoutes(insecureRoutes);
routeManager.addSecureRoutes(secureRoutes);


// run
const port = process.env.PORT || 5000;
const server = app.listen(port);
console.log(`Listening on port ${port}`);
