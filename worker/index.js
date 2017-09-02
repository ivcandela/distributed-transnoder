const FFmpeg = require('ffmpeg')
const _ = require('lodash')
const fileExists = require('file-exists')
const fs = require('fs')

const LOGO_IMAGE_FILEPATH = './logo/logo.png';
const LOGO_POSITION_FILEPATH = './logo/logo.json';

let watermark = function (videoIn, videoInFilename, logo, logoPos) {
    return new Promise(function (resolve, reject) {
        videoIn.fnAddWatermark(logo, './output/' + videoInFilename, logoPos, function (error, file) {
            if (!error) {
                resolve(file);
            } else {
                reject(error);
            }
        });
    });
};

const transcode = (videoFilename) => {
    try {
        const transcodingProcess = new FFmpeg(videoFilename);
        transcodingProcess.then(function (video) {
            if (!fileExists.sync(LOGO_IMAGE_FILEPATH)) {
                console.error('No logo.json specified for video ' + videoFilename);
                return;
            }
            if (!fileExists.sync(LOGO_POSITION_FILEPATH)) {
                console.error('No logo.json specified for video' + videoFilename);
                return;
            }
            const logoPosObj = JSON.parse(fs.readFileSync(LOGO_POSITION_FILEPATH, 'utf8'));
            watermark(video, videoFilename, LOGO_IMAGE_FILEPATH, logoPosObj).then( videoOutFilename => {
                 return videoOutFilename;
            });
        }, function (err) {
            console.error('Error: ' + err);
        });
    } catch (err) {
        console.error('Error: ' + err);
    }
};