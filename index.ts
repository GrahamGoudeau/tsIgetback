import * as express from 'express';
import * as user from './user';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as utils from './utils';

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
    dbUrl = 'mongodb://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@ds019886.mlab.com:19886/igetback-db';
} else {
    dbUrl = 'mongodb://localhost:27017/igetback-db';
}
mongoose.connect(dbUrl);

// set up routes
const routeManager = new utils.RouteManager(app);

// route builders
const indexBuilder = new utils.RouteBuilder('/', (req, res) => {
    console.log('responding...');
    res.json('ok');
});

const userCreateBuilder = new utils.RouteBuilder('/api/createUser', user.handleCreateUser)
    .setIsAjax(true)
    .setIsSecure(false)
    .setHttpMethod(utils.HttpMethod.POST);

const loginBuilder = new utils.RouteBuilder('/api/login', user.handleLogin)
    .setIsAjax(true)
    .setHttpMethod(utils.HttpMethod.POST);

const secureTestBuilder = new utils.RouteBuilder('/api/secure', (req, res) => {
    console.log('testing');
    res.send('in secure');
}).setIsAjax(true)
  .setIsSecure(true);

// construct and set routes
const indexRoute = new utils.Route(indexBuilder);
const createRoute = new utils.Route(userCreateBuilder);
const loginRoute = new utils.Route(loginBuilder);
const secureRoute = new utils.Route(secureTestBuilder);

const routes: utils.Route[] = [
    indexRoute,
    createRoute,
    loginRoute,
    secureRoute,
];

routeManager.addRoutes(routes);

// run
const server = app.listen(8000, "localhost", () => {
    const {address, port} = server.address();
    console.log('Listening on http://localhost:' + port);
});

