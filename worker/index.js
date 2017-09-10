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
const MessageService = require('./services/message.service');

const onError = err => {
    logging.error('err', err);
};

const onMessage = async message => {
    logging.info(`Received message ${message.id}:`);
    logging.info(`\tData: ${message.data}`);
    logging.info(`\tAttributes: ${JSON.stringify(message.attributes)}`);

    const {data, attributes: {process, bucketFileId, outputDir, outputFileName}} = message;

    message.ack();

    logging.info(`Message acknowledged ${message.id}`);
    try {
        const destination = path.join(__dirname, 'tmp', bucketFileId);
        logging.info('starting downloading');
        const downloadComplete = await StorageService.downloadById(bucketFileId, destination);
        logging.info('done downloading');
        logging.info('starting transcoding');
        const transcodedVideo = await TranscodingService.transcode(destination);
        logging.info('done transcoding');
        logging.info('starting uploading');
        const uploadComplete = await StorageService.upload(transcodedVideo, outputDir + outputFileName)
        logging.info('done uploading');

        logging.info('TRANSCODING COMPLETE 🎉')
    } catch (error) {
        logging.info('Process Error (onMessage):', error);
        //handleError
    }
};

MessageService.subscribe(onMessage, onError);

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