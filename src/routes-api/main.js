require('dotenv').config();
const compression = require('compression');
const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const dir = require('require-dir');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const moment = require('moment');
const tz = require('moment-timezone');
const path = require('path');
const http = require('http');
const helmet = require('helmet');
const app = express();

moment.tz.setDefault(process.env['DEFAULT_TIME_ZOME']);
const MAIN_NODE_PORT = process.env['MAIN_NODE_PORT'];
const MAIN_API_TIMEOUT = parseInt(process.env['MAIN_API_TIMEOUT']);
let server = null;

app.use(cors());
app.use(helmet({
    frameguard: true,
    xssFilter: true,
    noSniff: true
}));
app.use(bodyParser.json({
    limit: '10mb',
    verify: function (req, res, buf, encoding) {
        req.rawBody = buf;
    },
}));
app.use(bodyParser.urlencoded({ extended: false, }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use(compression());

function access_log(req, res, next) {
    const dd = Date.now();
    const url = req.path;
    const remoteIP = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || '0.0.0.0');
    console.debug(`req from ${req.method.toUpperCase()} ${url} ${JSON.stringify(req.body)}, remoteIP:${remoteIP}`);
    res.once('finish', () => {
        console.debug(`response from ${req.method.toUpperCase()} ${url} ${JSON.stringify(req.body)} ${res.statusCode}, cost:${Date.now() - dd}`);
    })
    next();
}

Object.keys(dir(`./api`)).forEach((controller) => {
    require(`./api/${controller}`)(app, [access_log]);
});

app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({ code: err.status, message: res.locals.message });
});

(async function start() {
    try {
        //連線db

        //啟動express
        server = http.createServer(app);
        server.on('error', onServerErrorHandle);
        server.setTimeout(MAIN_API_TIMEOUT);
        server.listen(MAIN_NODE_PORT);

        console.log('api server pid:', process.pid, 'listen:', MAIN_NODE_PORT);
    } catch (err) {
        console.error(err);
    }
})();

function onServerErrorHandle(error) {
    try {
        if (error.syscall !== 'listen') throw error;
        let bind = typeof MAIN_NODE_PORT === 'string' ? 'Pipe ' + MAIN_NODE_PORT : 'Port ' + MAIN_NODE_PORT;
        switch (error.code) {
            case 'EACCES':
                console.log(bind + ' requires elevated privileges (use sudo)');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.log(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    } catch (err) {
        console.error(err);
    }
}

process.once('SIGINT', () => {
    server && server.close(() => {
        console.log('process terminated');
        process.exit(0);
    })
});