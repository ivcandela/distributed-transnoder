
const logging = require('./logging');
const PubSub = require('@google-cloud/pubsub');

const PROJECT_ID = process.env.PROJECT_ID || 'distributed-transnoder';
const TOPICNAME = process.env.TOPICNAME || 'transcoding';
const TOPIC = `projects/${PROJECT_ID}/topics/${TOPICNAME}`;

const pubsub = (process.env.NODE_ENV === 'production') ? PubSub() : PubSub({
    projectId: PROJECT_ID,
    credentials: require('../../keyfile.json'),
});

const topic = pubsub.topic(TOPIC);
const publisher = topic.publisher();

const check = () => {
    topic.exists().then(results => {

        const exists = results[0];
        if (!exists) {

            logging.info(`Topic ${TOPIC} does not exist yet`);
            topic.create().then(results => {
                logging.info(`Topic ${TOPIC} created`)
            }).catch(err => {
                logging.error(`There was an error creating the topic ${TOPIC}`);
            });
        } else {
            logging.info(`Topic ${TOPIC} exists. No need for creating`);
        }
    }).catch(err => {
        logging.error(`There was an error checking for the topic ${TOPIC} existence`);
    });

};

// PUBLISHING
const publish = (message, attributes = {}) => {
    message = new Buffer(message);

    return publisher.publish(message, attributes).then(function(messageIds) {
        logging.info('messageId', messageIds[0]);
        return messageIds[0];
    }).catch(err => {
        logging.error('publish err', err);
        throw err;
    });
};

// SUBSCRIBING
const subscribe = (subscriptionName, onMessage, onError) => {
    logging.info(`subscribing ${subscriptionName}`);

    return topic
        .createSubscription(subscriptionName)
        .then(subscriptions => {
            const subscription = subscriptions[0];
            subscription.on('error', onError);
            subscription.on('message', onMessage);

            const unsubscribe = () => {
                // Remove listeners to stop pulling for messages.
                logging.info(`unsubscribing ${subscriptionName}`);
                subscription.removeListener('message', onMessage);
                subscription.removeListener('error', onError);
            };
            logging.info(`Subscribed ${subscriptionName}!`);
            return unsubscribe;
        }).catch(err => {
            logging.error(`create subscription ${subscriptionName} err`, err);

            throw err;
        });
};

module.exports = {
    check,
    publish,
    subscribe,
};