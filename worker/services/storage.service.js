const _ = require('lodash');

const logging = require('../lib/logging');
const storage = require('../lib/storage');

class StorageService {
    constructor() {
        //
    }

    async input() {
        const files = await storage.listFilesByPrefix('input/');

        return files.filter(f => f.name !== 'input/');
    }

    bucketName() {
        return storage.BUCKETNAME;
    }


    async downloadById(bucketFileId, destination) {
        const files = await this.input();

        const fileToDownload = _.find(files, f => f.id === bucketFileId);
        if(!fileToDownload) {
            throw new Error(`No File with id ${bucketFileId} found in bucket ${BUCKETNAME}`);
        }

        return await storage.download(fileToDownload.name, destination);
    };

    async upload(localFilename, destination) {
        return await storage.upload(localFilename, destination);
    }
}

const instance = new StorageService();

module.exports = instance;