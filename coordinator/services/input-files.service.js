const logging = require('../lib/logging');
const storage = require('../lib/storage');

class InputFilesService {
    constructor() {
        //
    }

    async list() {
        const files = await storage.listFilesByPrefix('input/');

        return files.filter(f => f.name !== 'input/');
    }

    bucketName() {
        return storage.BUCKETNAME;
    }
}

const instance = new InputFilesService();

module.exports = instance;