const Storage = require('@google-cloud/storage');
const logging = require('./logging');

const PROJECT_ID = process.env.PROJECT_ID || 'distributed-transnoder';
const BUCKETNAME = process.env.BUCKETNAME || `${PROJECT_ID}.appspot.com`;

const storage = (process.env.NODE_ENV === 'production') ? Storage() : Storage({
    projectId: PROJECT_ID,
    credentials: require('../../keyfile.json'),
});

const listFiles = (options = {}) =>
    storage
        .bucket(BUCKETNAME)
        .getFiles()
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

module.exports = {
    listFiles,
    listFilesByPrefix,
};