const logging = require('../lib/logging');
const pubsub = require('../lib/pubsub');

const defaultUnsubscribe = () => {
    logging.warn('nothing to unsuscribe')
};

class MessageService {

    constructor() {
        this._observableSource = null;
        this._unsubscribe = defaultUnsubscribe;
    }

    unsubscribe() {
        this._unsubscribe();
        this._unsubscribe = defaultUnsubscribe;
    }

    async transcode(bucketFileId) {
        const message = 'transcode';

        const attributes = {
            process: 'regular',
            bucketFileId,
        };

        const messageId = await pubsub.publish(message, attributes);

        return messageId;
    }

    async subscribe() {
        const onError = err => {
            logging.error('err', err);
        };

        const onMessage = message => {
            logging.info(`Received message ${message.id}:`);
            logging.info(`\tData: ${message.data}`);
            logging.info(`\tAttributes: ${JSON.stringify(message.attributes)}`);

            message.ack();
            logging.info(`Message acknowledged ${message.id}`);
        };

        pubsub
            .subscribe('test-subscription', onMessage, onError)
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
