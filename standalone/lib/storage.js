const Storage = require('@google-cloud/storage');
const _ = require('lodash');
const logging = require('./logging');

const PROJECT_ID = process.env.PROJECT_ID || '';

const storage = (process.env.NODE_ENV === 'production') ? Storage() : Storage({
    projectId: PROJECT_ID,
    credentials: require('../../keyfile.json'),
});

const listFiles = (bucket, options = {}) => {
    console.log(bucket, options)
    const files = [];
    return new Promise((resolve, reject) => {
        storage
            .bucket(bucket)
            .getFilesStream(Object.assign({projection: 'noAcl'}, options))
            .on('error', error => {
                console.error(error);
                reject(error);
            })
            .on('data', function (file) {
                console.log(file.name);
                files.push({name: file.name, id: file.id});
            })
            .on('end', function () {
                console.log('end');
                resolve(files);
            });
    });

    /*then((results) => {
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
        }); */
};

/**
 * Returns promise which resolves in a list of directories only. Ex: A/, A/a, B/, C/, C/c
 * If given a FL directory as prefix will resolve in a list of the sub directories of the specified directory. Ex prefix=A/ -> A/a/, A/b/, A/c/d
 * @param bucket
 * @param options
 * @returns {Promise}
 */
const listDirectories = (bucket, options = {}) => {
    const defaultOptions = {
        projection: 'noAcl',
    };

    const files = [];
    return new Promise((resolve, reject) => {
        storage
            .bucket(bucket)
            .getFilesStream(_.assign(defaultOptions, options))
            .on('error', error => {
                reject(error);
            })
            .on('data', function (file) {
                if (_.endsWith(file.name, '/')) {
                    files.push({name: file.name, id: file.id});
                }
            })
            .on('end', function () {
                resolve(files);
            });
    });
};

/**
 * Returns promise which resolves in a list of first-level directories only. Ex: A/, B/, C/
 * If given a FL directory as prefix will resolve in a list of SL directories and so on. Ex prefix=A/ -> A/a/, A/b/, A/c
 * @param bucket
 * @param options
 * @returns {Promise}
 */
const listFLDirectories = (bucket, options = {}) => {
    const defaultOptions = {
        projection: 'noAcl',
    };

    const files = [];
    return new Promise((resolve, reject) => {
        storage
            .bucket(bucket)
            .getFilesStream(_.assign(defaultOptions, options))
            .on('error', error => {
                reject(error);
            })
            .on('data', function (file) {
                if (_.endsWith(file.name, '/')) {
                    if (/^[^\/]*\/$/.test(file.name)) {
                        files.push({name: file.name, id: file.id});
                    }
                }
            })
            .on('end', function () {
                resolve(files);
            });
    });
};

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
    listDirectories,
    listFLDirectories,
    upload,
    download,
    destroy,
};