// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start();
    require('@google-cloud/debug-agent').start();
}

const express = require('express');
const mustacheExpress = require('mustache-express');

const logging = require('./lib/logging');
const pubsub = require('./lib/pubsub');
const StorageService = require('./services/storage.service');
const MessageService = require('./services/message.service');

//Express
const app = express();

// Register '.mustache' extension with The Mustache Express
app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(logging.requestLogger);

app.get('/', async (req, res) => {
    const files = await StorageService.input();
    const bucketName = StorageService.bucketName();

    res.render('home', {files, bucketName});
});

app.get('/transcode', async (req, res) => {
    const bucketFileId = req.query.bucketFileId;
    const messageId = await MessageService.transcode(bucketFileId);

    res.render('transcode', {bucketFileId, messageId});
});

// Errors
app.use(logging.errorLogger);

app.use((req, res) => {
    res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
    res.status(500).render('error', {message: JSON.stringify(err.response || 'Something Broke')});
});

// Spin up

const PORT = process.env.PORT || 8080;

app.listen(PORT, function () {
    logging.info(`app listening on port ${PORT}!`);
});