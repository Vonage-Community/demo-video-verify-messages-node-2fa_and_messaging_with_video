import dotenv from 'dotenv';
dotenv.config();

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import flash from 'express-flash-message';
import session from 'express-session';
import sqliteStore from 'better-sqlite3-session-store';
import Twig from 'twig';

import { db, runMigrations} from './src/Database.js';
import RouteLoader from './src/RouteLoader.js';

runMigrations();

const expressPort = process.env.PORT || process.env.NERU_APP_PORT || 3000;
const SqliteStore = sqliteStore(session);

const app = express();
app.set('views', './views');
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('./public'));
app.use(session({
    store: new SqliteStore({
        client: db
    }),
    secret: 'video-verify-demo',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(flash({
    sessionKeyName: 'video-verify-demo'
}));

app.set('view engine', 'twig');
Twig.cache(false);
app.set('twig', Twig);

app.use((req, res, next) => {
    res.locals.authenticated = req.session.user?.id && req.session?.mfa ? true : false;
    res.locals.isAdmin = req.session.user?.admin ? true : false;
    next();
})

const routes = await RouteLoader('./src/routes/**/*.js');
app.use('/', routes);

app.listen(expressPort, () => {
    console.log(`Listening on ${expressPort}`);
});