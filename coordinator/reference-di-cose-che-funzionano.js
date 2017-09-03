// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start();
    require('@google-cloud/debug-agent').start();
}

const fs = require('fs');
const path = require('path');
const express = require('express');
const PubSub = require('@google-cloud/pubsub');
const Storage = require('@google-cloud/storage');
const logging = require('./lib/logging');

//GCP
const PROJECT_ID = process.env.PROJECT_ID || 'distributed-transnoder';
const BUCKETNAME = process.env.BUCKETNAME || `${PROJECT_ID}.appspot.com`;
const TOPICNAME = process.env.TOPICNAME || 'transcoding';
const TOPIC = `projects/${PROJECT_ID}/topics/${TOPICNAME}`;

const pubsub = (process.env.NODE_ENV === 'production') ? PubSub() : PubSub({
    projectId: PROJECT_ID,
    credentials: require('../keyfile.json'),
});
const storage = (process.env.NODE_ENV === 'production') ? Storage() : Storage({
    projectId: PROJECT_ID,
    credentials: require('../keyfile.json'),
});

const topic = pubsub.topic(TOPIC);
topic.exists().then(results => {
    const exists = results[0];

    if(!exists) {
        logging.info('Topic does not exist yet');

        topic.create().then(results => {
            logging.info(`Topic ${TOPIC} created`)
        }).catch(err => {
            logging.error(`There was an error creating the topic ${TOPIC}`);
        });
    }
}).catch(err => {
    logging.error(`There was an error checking for the topic ${TOPIC} existence`);
});

const publisher = topic.publisher();

//Express
const app = express();

app.use(logging.requestLogger);

app.get('/', (req, res) => {
    res.send('OK');
});

//Publishing
app.get('/publish/:message', (req, res) => {
    const message = new Buffer(req.params.message);
    const attributes = {lol: 'loller'};
    publisher.publish(message, attributes).then(function(messageIds) {
        logging.info('messageId', messageIds[0]);
        res.send(`${req.params.message} should be published`);
    }).catch(err => {
        logging.error('publish err', err);
        res.send(`ERR: ${req.params.message} could not be published`);
    });
});

//Subscribing
const defaultUnsubscribe = () => { logging.info('nothing to unsubscribe'); };
let unsubscribe = defaultUnsubscribe;
function onError(err) { logging.error('err', err); }
function onMessage(message) {
    logging.info(`Received message ${message.id}:`);
    logging.info(`\tData: ${message.data}`);
    logging.info(`\tAttributes: ${JSON.stringify(message.attributes)}`);

    message.ack();
    logging.info(`Message acknowledged ${message.id}`);
}

app.get('/subscribe', (req, res) => {
    topic.createSubscription('test-subscription').then(subscriptions => {
        const subscription = subscriptions[0];
        subscription.on('error', onError);
        subscription.on('message', onMessage);

        // Remove listeners to stop pulling for messages.
        unsubscribe = () => {
            logging.info('unsubscribing');
            subscription.removeListener('message', onMessage);
            subscription.removeListener('error', onError);
            unsubscribe = defaultUnsubscribe;
        };

        res.send('Subscribed!');
    }).catch(err => {
        logging.error('create subscription err', err);

        res.send('ERR: Subscription Error!');
    });
});

app.get('/unsubscribe', (req, res) => {
    unsubscribe();

    res.send('Unsubscribed!')
});

app.get('/bucket', (req, res) => {
    storage
        .bucket(BUCKETNAME)
        .getFiles()
        .then((results) => {
            const files = results[0];

            logging.info('Files:');
            files.forEach((file) => {

                logging.info(file.name);
            });

            res.send(files.map(f=>f.name).join(','));
        })
        .catch((err) => {
            logging.error(err);
        });
});

app.get('/bucket/:prefix', (req, res) => {
    const options = {
        prefix: req.params.prefix,
    };

    storage
        .bucket(BUCKETNAME)
        .getFiles(options)
        .then((results) => {
            const files = results[0];

            logging.info('Files:');
            files.forEach((file) => {
                logging.info(file.name);
            });

            res.send(files.map(f=>f.name).join(','));
        })
        .catch((err) => {
            logging.error(err);
        });
});

// Errors
app.use(logging.errorLogger);

app.use((req, res) => {
    res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
    res.status(500).send(err.response || 'Something broke!');
});

// Spin up

const PORT = process.env.PORT || 8080;

app.listen(PORT, function () {
    logging.info(`app listening on port ${PORT}!`);
});