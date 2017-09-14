

// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start();
    require('@google-cloud/debug-agent').start();
}

const _ = require('lodash');
const express = require('express');
const mustacheExpress = require('mustache-express');
const path = require('path');

const logging = require('./lib/logging');
const StorageService = require('./services/storage.service');
const TranscodingService = require('./services/transcoding.service');

//Express
const app = express();

// Register '.mustache' extension with The Mustache Express
app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(logging.requestLogger);

app.get('/', async (req, res) => {
    const files = (await StorageService.listInput());
    const bucketName = StorageService.inputBucketName();

    res.render('home', {files, bucketName});
});

app.get('/transcode', async (req, res) => {
    const {bucketFileId, outputDirName, outputFileName} = req.query;

    const transcodingProcess = new Promise(async (resolve, reject) => {
        try {
            const destination = path.join(__dirname, 'tmp', bucketFileId);
            logging.info(bucketFileId, 'starting downloading');
            const downloadComplete = await
            StorageService.downloadFromInputById(bucketFileId, destination);
            logging.info(bucketFileId, 'done downloading');
            logging.info(bucketFileId, 'starting transcoding');
            const transcodedVideo = await
            TranscodingService.transcode(destination);
            logging.info(bucketFileId, 'done transcoding');
            logging.info(bucketFileId, 'starting uploading HD');
            const hdUploadComplete = await
            StorageService.uploadToOutput(transcodedVideo.hd, outputDirName + 'hd_' + outputFileName)
            logging.info(bucketFileId, 'done uploading HD');
            logging.info(bucketFileId, 'starting uploading MD');
            const mdUploadComplete = await
            StorageService.uploadToOutput(transcodedVideo.md, outputDirName + 'md_' + outputFileName)
            logging.info(bucketFileId, 'done uploading MD');
            logging.info(bucketFileId, 'starting uploading SD');
            const sdUploadComplete = await
            StorageService.uploadToOutput(transcodedVideo.sd, outputDirName + 'sd_' + outputFileName)
            logging.info(bucketFileId, 'done uploading SD');

            logging.info(bucketFileId, 'TRANSCODING COMPLETE 🎉')
        } catch (error) {
            logging.info(bucketFileId, 'Process Error (onMessage):', error);
            //handleError
        }
    });

    res.render('transcode', {bucketFileId});
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