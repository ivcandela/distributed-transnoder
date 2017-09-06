// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start();
    require('@google-cloud/debug-agent').start();
}

const path = require('path');
const express = require('express');

const logging = require('./lib/logging');
const pubsub = require('./lib/pubsub');
const StorageService = require('./services/storage.service');
const TranscodingService = require('./services/transcoding.service');

//Subscribing
const defaultUnsubscribe = () => {
    logging.warn('nothing to unsuscribe')
};

let unsubscribe = defaultUnsubscribe;

const onError = err => {
    logging.error('err', err);
};

const onMessage = async message => {
    logging.info(`Received message ${message.id}:`);
    logging.info(`\tData: ${message.data}`);
    logging.info(`\tAttributes: ${JSON.stringify(message.attributes)}`);

    const {data, attributes: {process, bucketFileId}} = message;

    message.ack();
    logging.info(`Message acknowledged ${message.id}`);

    const destination = path.join(__dirname, 'tmp', bucketFileId);
    const downloadComplete = await StorageService.downloadById(bucketFileId, destination);
    logging.info('done downloading');
    const transcodedVideo = await TranscodingService.transcode(destination);
    logging.info('done transcoding');
    const uploadComplete = await StorageService.upload(transcodedVideo, 'output/'+bucketFileId)
    logging.info('done uploading');

    logging.info('TRANSCODING COMPLETE 🎉')
};

pubsub
    .subscribe('test-subscription', onMessage, onError)
    .then(unsubscribeFnc => {
        unsubscribe = unsubscribeFnc;
    })
    .catch(err => {
        logging.error('create subscription err', err);
    });

//Express
const app = express();

app.use(logging.requestLogger);

app.get('/', (req, res) => {
    res.send('OK');
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
const PORT = process.env.PORT || 8081;

app.listen(PORT, function () {
    logging.info(`app listening on port ${PORT}!`);
});