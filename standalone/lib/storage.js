const Storage = require('@google-cloud/storage');
const logging = require('./logging');

const PROJECT_ID = process.env.PROJECT_ID || '';

const storage = (process.env.NODE_ENV === 'production') ? Storage() : Storage({
    projectId: PROJECT_ID,
    credentials: require('../../keyfile.json'),
});

const listFiles = (bucket, options = {}) =>
    storage
        .bucket(bucket)
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

const upload = (bucket, filename, destination) => {
    const options = {
        destination,
    };

    return storage
        .bucket(bucket)
        .upload(filename, options)
        .then(() => {
            console.log(`${filename} uploaded to ${bucket}/${destination}.`);
            return true;
        })
        .catch((err) => {
            console.error('ERROR:', err);
            throw err;
        });
}

const download = (bucket, srcFilename, destFilename) => {
    const options = {
        destination: destFilename
    };

    return storage
        .bucket(bucket)
        .file(srcFilename)
        .download(options)
        .then(() => {
            console.log(`gs://${bucket}/${srcFilename} downloaded to ${destFilename}.`);
            return true;
        })
        .catch((err) => {
            console.error('ERROR:', err);
            throw err;
        });
}

const destroy = (bucket, filename) => {
    return storage
        .bucket(bucket)
        .file(filename)
        .delete()
        .then(() => {
            console.log(`gs://${bucket}/${filename} deleted.`);
            return true;
        })
        .catch((err) => {
            console.error('ERROR:', err);
            throw err;
        });
}

module.exports = {
    listFiles,
    listFilesByPrefix,
    upload,
    download,
    destroy,
};