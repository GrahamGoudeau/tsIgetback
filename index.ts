import * as express from 'express';
import * as user from './user';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as utils from './utils';

const app: express.Express = express();

// app configuration must appear before routes are set
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const airportCodesFile: string = __dirname + '/data/airport-codes.dat';
const collegesFile: string = __dirname + '/data/colleges.dat';

const airportCodes: string[] = utils.readLines(airportCodesFile);
const colleges: string[] = utils.readLines(collegesFile);

let dbUrl: string;
if (process.env.PRODUCTION === 'true') {
    dbUrl = 'mongodb://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@ds019886.mlab.com:19886/igetback-db';
} else {
    dbUrl = 'mongodb://localhost:27017/igetback-db';
}
mongoose.connect(dbUrl);

const routeManager = new utils.RouteManager(app);

const indexBuilder = new utils.RouteBuilder('/', (req, res) => {
    console.log('responding...');
    res.json('ok');
});

const userCreateBuilder = new utils.RouteBuilder('/createUser', user.createUser)
    .setIsAjax(true)
    .setIsSecure(false)
    .setHttpMethod(utils.HttpMethod.POST);

const indexRoute = new utils.Route(indexBuilder);
const createRoute = new utils.Route(userCreateBuilder);

const routes: utils.Route[] = [
    indexRoute,
    createRoute
];

routeManager.addRoutes(routes);


//app.set('port', process.env.PORT || 5000);
//app.get('/', (req, res) => res.send(4));
//app.get('/products', (req, res) => res.send('Got a request for products'));
//app.get('/reviews', (req, res) => res.send('Got a request for reviews'));

const server = app.listen(8000, "localhost", () => {
    const {address, port} = server.address();
    console.log('Listening on http://localhost:' + port);
});

