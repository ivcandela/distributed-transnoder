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
}

const instance = new StorageService();

module.exports = instance;