const Storage = require('@google-cloud/storage');
const logging = require('./logging');

const PROJECT_ID = process.env.PROJECT_ID || '';
const BUCKETNAME = process.env.BUCKETNAME || `${PROJECT_ID}.appspot.com`;

const storage = (process.env.NODE_ENV === 'production') ? Storage() : Storage({
    projectId: PROJECT_ID,
    credentials: require('../../keyfile.json'),
});

const listFiles = (options = {}) =>
    storage
        .bucket(BUCKETNAME)
        .getFiles(options)
        .then((results) => {
            const files = results[0];

            logging.info('Files:');
            files.forEach((file) => {
                logging.info(file.name);
            });

            return files
        })
        .catch((err) => {
            logging.error(err);
            throw err;
        });

const listFilesByPrefix = prefix => listFiles({prefix});

const upload = (filename, destination) => {
    const options = {
        destination,
    };

    return storage
        .bucket(BUCKETNAME)
        .upload(filename, options)
        .then(() => {
            console.log(`${filename} uploaded to ${BUCKETNAME}/${destination}.`);
            return true;
        })
        .catch((err) => {
            console.error('ERROR:', err);
            throw err;
        });
}

const download = (srcFilename, destFilename) => {
    const options = {
        destination: destFilename
    };

    return storage
        .bucket(BUCKETNAME)
        .file(srcFilename)
        .download(options)
        .then(() => {
            console.log(`gs://${BUCKETNAME}/${srcFilename} downloaded to ${destFilename}.`);
            return true;
        })
        .catch((err) => {
            console.error('ERROR:', err);
            throw err;
        });
}

const destroy = filename => {
    return storage
        .bucket(BUCKETNAME)
        .file(filename)
        .delete()
        .then(() => {
            console.log(`gs://${BUCKETNAME}/${filename} deleted.`);
            return true;
        })
        .catch((err) => {
            console.error('ERROR:', err);
            throw err;
        });
}
module.exports = {
    BUCKETNAME,
    listFiles,
    listFilesByPrefix,
    upload,
    download,
    destroy,
};