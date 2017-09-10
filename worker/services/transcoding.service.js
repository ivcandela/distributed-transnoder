const FFmpeg = require('ffmpeg');
const _ = require('lodash');
const fileExists = require('file-exists');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const logging = require('../lib/logging');

const LOGO_IMAGE_FILEPATH = path.join(__dirname, '..', 'logo', 'logo.png');
const LOGO_POSITION_FILEPATH = path.join(__dirname, '..', 'logo', 'logo.json');

const _watermark = function (videoIn, videoInFilename, logo, logoPos) {
    return new Promise(function (resolve, reject) {
        videoIn.fnAddWatermark(logo, path.join(__dirname, '..', 'tmp', 'out' + moment().unix() + '_' + path.basename(videoInFilename)), logoPos, function (error, file) {
            if (!error) {
                resolve(file);
            } else {
                console.log('Watermarking Error');
                reject(error);
            }
        });
    });
};

const transcode = async (videoFilename) => {
    try {
        const transcodingProcess = new FFmpeg(videoFilename);
        const video = await transcodingProcess;
        logging.info('logo.png fileName', LOGO_IMAGE_FILEPATH);
        logging.info('logo.json fileName', LOGO_POSITION_FILEPATH);
        if (!fileExists.sync(LOGO_IMAGE_FILEPATH)) {
            logging.error('No logo.png specified for video ' + videoFilename);
            return;
        }
        if (!fileExists.sync(LOGO_POSITION_FILEPATH)) {
            logging.error('No logo.json specified for video' + videoFilename);
            return;
        }
        const logoPosObj = JSON.parse(fs.readFileSync(LOGO_POSITION_FILEPATH, 'utf8'));
        logging.info('starting watermarking');
        const videoOutFilename = await _watermark(video, videoFilename, LOGO_IMAGE_FILEPATH, logoPosObj);
        logging.info('videoOut', videoOutFilename);
        return videoOutFilename;
    } catch (err) {
        logging.error('Transcoding Error: ' + err);
        throw err;
    }
};

module.exports = {
    transcode,
};