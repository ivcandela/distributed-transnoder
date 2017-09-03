// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start();
    require('@google-cloud/debug-agent').start();
}

const express = require('express');
const logging = require('./lib/logging');
const pubsub = require('./lib/pubsub');
const storage = require('./lib/storage');

//Express
const app = express();

app.use(logging.requestLogger);

app.get('/', (req, res) => {
    res.send('OK');
});

//Publishing
app.get('/publish/:message', (req, res) => {
    const message = req.params.message;
    const attributes = {lol: 'loller'};
    pubsub.publish(message, attributes).then(function(messageId) {
        logging.info('messageId', messageId);
        res.send(`${message} should be published`);
    }).catch(err => {
        logging.error('publish err', err);
        res.send(`ERR: ${message} could not be published`);
    });
});

app.get('/bucket', (req, res) => {
    storage
        .listFiles()
        .then(files => {
            res.send(files.map(f=>f.name).join(','));
        })
        .catch((err) => {
            logging.error(err);
            res.send('ERR: could not read from bucket')
        });
});

app.get('/bucket/:prefix', (req, res) => {
    const options = {
        prefix: req.params.prefix,
    };

    storage
        .listFilesByPrefix(req.params.prefix)
        .then(files => {
            res.send(files.map(f=>f.name).join(','));
        })
        .catch((err) => {
            logging.error(err);
            res.send('ERR: could not read from bucket')
        });
});

// Errors
app.use(logging.errorLogger);

app.use((req, res) => {
    res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
    res.status(500).send(err.response || 'Something broke!');
});

// Spin up

const PORT = process.env.PORT || 8080;

app.listen(PORT, function () {
    logging.info(`app listening on port ${PORT}!`);
});