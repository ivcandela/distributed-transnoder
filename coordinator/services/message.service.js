const logging = require('../lib/logging');
const pubsub = require('../lib/pubsub');

const SUBSCRIPTION_NAME = process.env.NODE_ENV === 'production' ? 'worker_transcoding-subscription': 'test-worker_transcoding-subscription';

const defaultUnsubscribe = () => {
    logging.warn('nothing to unsuscribe')
};

class MessageService {
    constructor() {
        this._observableSource = null;
        this._unsubscribe = defaultUnsubscribe;
        pubsub.check();
    }

    unsubscribe() {
        this._unsubscribe();
        this._unsubscribe = defaultUnsubscribe;
    }

    async transcode(bucketFileId, outputDir, outputFileName) {
        const message = 'transcode';

        const attributes = {
            process: 'regular',
            bucketFileId,
            outputDir,
            outputFileName,
        };

        const messageId = await pubsub.publish(message, attributes);

        return messageId;
    }

    async subscribe(onMessage, onError) {
        pubsub
            .subscribe(SUBSCRIPTION_NAME, onMessage, onError)
            .then(unsubscribeFnc => {
                this._unsubscribe = unsubscribeFnc;
            })
            .catch(err => {
                logging.error('create subscription err', err);
                throw err;
            });
    }
}

const instance = new MessageService();

module.exports = instance;
