const _ = require('lodash');

const logging = require('../lib/logging');
const storage = require('../lib/storage');

const INPUT_BUCKETNAME = process.env.INPUT_BUCKETNAME;
const OUTPUT_BUCKETNAME = process.env.OUTPUT_BUCKETNAME;

class StorageService {
    constructor() {
        //
    }

    async listInput() {
        const files = await storage.listFiles(INPUT_BUCKETNAME);

        return files;
    }

    inputBucketName() {
        return INPUT_BUCKETNAME;
    }

    outputBucketName() {
        return OUTPUT_BUCKETNAME;
    }


    async downloadFromInputById(bucketFileId, destination) {
        const files = await this.listInput();

        const fileToDownload = _.find(files, f => f.id === bucketFileId);
        if(!fileToDownload) {
            throw new Error(`No File with id ${bucketFileId} found in bucket ${BUCKETNAME}`);
        }

        return await storage.download(INPUT_BUCKETNAME, fileToDownload.name, destination);
    };

    async uploadToOutput(localFilename, destination) {
        return await storage.upload(OUTPUT_BUCKETNAME, localFilename, destination);
    }
}

const instance = new StorageService();

module.exports = instance;