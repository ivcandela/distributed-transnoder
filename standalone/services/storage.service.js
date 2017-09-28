const _ = require('lodash');
const path = require('path');

const logging = require('../lib/logging');
const storage = require('../lib/storage');

const INPUT_BUCKETNAME = process.env.INPUT_BUCKETNAME;
const OUTPUT_BUCKETNAME = process.env.OUTPUT_BUCKETNAME;

class StorageService {
    constructor() {
        //
    }

    async listInputFiles(extension, prefix) {
        const files = await storage.listFiles(INPUT_BUCKETNAME, {prefix});

        return files.filter(file => path.extname(file.name) === extension);
    }

    async listInputDirectories(prefix) {
        const files = await storage.listDirectories(INPUT_BUCKETNAME, {prefix});

        return files;
    }

    inputBucketName() {
        return INPUT_BUCKETNAME;
    }

    outputBucketName() {
        return OUTPUT_BUCKETNAME;
    }


    async downloadFromInput(bucketFileName, destination) {
        return await storage.download(INPUT_BUCKETNAME, bucketFileName, destination);
    };

    async uploadToOutput(localFilename, destination) {
        return await storage.upload(OUTPUT_BUCKETNAME, localFilename, destination);
    }
}

const instance = new StorageService();

module.exports = instance;