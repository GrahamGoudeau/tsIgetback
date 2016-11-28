import * as express from 'express';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as utils from './utils';

const app: express.Express = express();
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
utils.addSecureRoute(app, 'test', utils.HttpMethod.GET);

const builder = new utils.RouteBuilder('/products', (t, x) => {return});
app.set('port', process.env.PORT || 5000);
app.get('/', (req, res) => res.send(4));
app.get('/products', (req, res) => res.send('Got a request for products'));
app.get('/reviews', (req, res) => res.send('Got a request for reviews'));

const server = app.listen(8000, "localhost", () => {
    const {address, port} = server.address();
    console.log('Listening on http://localhost:' + port);
});

