// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start();
    require('@google-cloud/debug-agent').start();
}

require('dotenv').config();

const _ = require('lodash');
const express = require('express');
const mustacheExpress = require('mustache-express');
const path = require('path');
const moment = require('moment');

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

app.get('/', (req, res) => {
    const bucketName = StorageService.inputBucketName();

    res.render('home', {bucketName});
});

app.get('/choose', async (req, res) => {
    const prefix = req.query.p;
    const files = await StorageService.listInputDirectories(prefix);
    const logos = (await StorageService.listInputDirectories('logos/')).filter(file => file.name !== 'logos/');
    const inputBucketName = StorageService.inputBucketName();
    const outputBucketName = StorageService.outputBucketName();

    res.render('choose', {files, logos, inputBucketName, outputBucketName, prefix});
});

app.get('/transcode', async (req, res) => {
    logging.info('GET transcode')
    const fileExtension = '.mp4';
    const {bucketFileName, outputDirName, logoId, logoPositionJson} = req.query;

    const filesToTranscode = await StorageService.listInputFiles(fileExtension, bucketFileName);

    const transcodingOptions = {
        logo: TranscodingService.DEFAULT_LOGO_IMAGE_FILEPATH,
        position: TranscodingService.DEFAULT_LOGO_POSITION,
    };

    if (logoId === 'default') {
        logging.info('using default logo');
    } else {
        try {
            const logoDestination = path.join(__dirname, 'tmp', `logo_${logoId}_${moment().unix()}`);
            logging.info(`Downloading logo ${logoId} in temp file ${logoDestination}`);
            const downloadLogo = await StorageService.downloadFromInputById(logoId, logoDestination);
            logging.info(`Downloaded logo ${logoId} in temp file ${logoDestination}`);
            transcodingOptions.logo = logoDestination;
        } catch (error) {
            logging.error('Impossibile recuperare il logo selezionato dal bucket');
            res.render('error', 'Impossibile recuperare il logo selezionato dal bucket');
            return;
        }
    }

    if (logoPositionJson) {
        try {
            const logoPosition = JSON.parse(logoPositionJson);
            transcodingOptions.position = logoPosition;
        } catch (error) {
            logging.error('Impossibile decodificare la posizione del logo');
            res.render('error', 'Impossibile decodificare la posizione del logo');
            return;
        }
    }
    logging.info(`transcoding options:`, JSON.stringify(transcodingOptions));

    new Promise(async (resolve, reject) => { //just to defer
        for (let i = 0; i < filesToTranscode.length; i++) {
            const file = filesToTranscode[i];
            const outputFileName = file.name.split('/')[file.name.split('/').length-1];
            try {
                const destination = path.join(__dirname, 'tmp', file.id);
                logging.info(file.id, 'starting downloading');
                const downloadComplete = await
                    StorageService.downloadFromInput(file.name, destination);
                logging.info(file.id, 'done downloading');
                logging.info(file.id, 'starting transcoding');
                const transcodedVideo = await
                    TranscodingService.transcode(destination, transcodingOptions);
                logging.info(file.id, 'done transcoding');
                logging.info(file.id, 'starting uploading HD');
                const hdUploadComplete = await
                    StorageService.uploadToOutput(transcodedVideo.hd, outputDirName + 'hd_' + outputFileName);
                logging.info(file.id, 'done uploading HD');
                logging.info(file.id, 'starting uploading MD');
                const mdUploadComplete = await
                    StorageService.uploadToOutput(transcodedVideo.md, outputDirName + 'md_' + outputFileName);
                logging.info(file.id, 'done uploading MD');
                logging.info(file.id, 'starting uploading SD');
                const sdUploadComplete = await
                    StorageService.uploadToOutput(transcodedVideo.sd, outputDirName + 'sd_' + outputFileName);
                logging.info(file.id, 'done uploading SD');

                logging.info(file.id, 'TRANSCODING COMPLETE 🎉');
            } catch (error) {
                logging.info(file.id, 'Process Error (onMessage):', error);
                //handleError
                //TODO notifica errore
            }
        }
        //TODO notifica termine processo
    });

    res.render('transcode', {bucketFileName, outputDirName, logoId, logoPositionJson, filesToTranscode});
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