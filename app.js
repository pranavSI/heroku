'use strict';

//Declare Project Environment & ENV Directory
process.env["NODE_CONFIG_DIR"] = "./config/";
process.env["NODE_ENV"] = "development";

//Default Messages
var defMessages = require('./config/defaultMessages.json');
var buttons = require('./src/variables/buttons.js');
var templates = require('./src/variables/templates.js');
var sendMessage = require('./src/scripts/sendMessage.js');

// Imports dependencies and set up http server
const
    config = require('config'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json()), // creates express http server
    request = require('request');

// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('I\'m here. I\'m waiting.'));

// Arbitrary value used to validate a webhook
const
    VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
    (process.env.MESSENGER_VALIDATION_TOKEN) :
    config.get('validation_token');

// App Secret can be retrieved from the App Dashboard
const
    APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
    process.env.MESSENGER_APP_SECRET :
    config.get('app_secret');

// Generate a page access token for your page from the App Dashboard
const
    PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('page_access_token');

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VALIDATION_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {
    var body = req.body;
    console.log(body);
    //Check if this is a page subscription
    if (body.object === 'page') {

        //Iterate over each entry since there could be multiple if batched
        body.entry.forEach(function (pageEntry) {
            var pageID = pageEntry.id;
            var eventTime = pageEntry.time;

            //Iterate over each messaging event
            if (pageEntry.messaging) {
                pageEntry.messaging.forEach(function (allMessages) {
                    if (allMessages.postback) {
                        eventMessagePostback(allMessages);
                    }
                    //console.log(allMessages);
                });
            }
        });

        //Assuming everything went well
        res.sendStatus(200);
    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
});

//Setup Get Started Button
buttonGetStarted();

function buttonGetStarted() {
    var messageData = {
        "get_started": {
            "payload": "GET_STARTED"
        }
    };

    // Start the request
    request({
            url: 'https://graph.facebook.com/v2.12/me/messenger_profile?access_token=' + PAGE_ACCESS_TOKEN,
            //qs: { access_token: PAGE_ACCESS_TOKEN },
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            form: messageData
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //Call the Persistent Menu
                persistentMenu();
            } else {
                // TODO: Handle errors
                console.log("ERROR: " + error);
                console.log("ERROR BODY: " + body);
            }
        });
}

function persistentMenu() {

    var persistentMenu = {
        "persistent_menu": [{
            "locale": "default",
            "composer_input_disabled": false,
            "call_to_actions": [{
                    "type": "postback",
                    "title": "Matches",
                    "payload": "MATCHES"
                },
                {
                    "type": "postback",
                    "title": "Team",
                    "payload": "TEAM"
                },
                {
                    "type": "postback",
                    "title": "Latest Updates",
                    "payload": "LATEST_UPDATES"
                }
            ]
        }]
    }

    // Start the request
    request({
            url: 'https://graph.facebook.com/v2.12/me/messenger_profile?access_token=' + PAGE_ACCESS_TOKEN,
            //qs: { access_token: PAGE_ACCESS_TOKEN },
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            form: persistentMenu
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Success! Get started button and persistent menu setup.");
            } else {
                // TODO: Handle errors
                console.log("ERROR for Persistent menu setup: " + error);
                console.log("ResponseBody: " + body);
            }
        });
}

function eventMessagePostback(event) {
    console.log(event);
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback button for Structured Messages.
    var payload = event.postback.payload;

    switch (payload) {
        case 'GET_STARTED':
            console.log(defMessages);
            templates.generic.recipient.id = senderID;
            templates.generic.message.attachment.payload.elements = [{
                "title": defMessages.getStarted.title,
                "image_url": defMessages.getStarted.image_url,
                "subtitle": defMessages.getStarted.subtitle,
                "buttons": [buttons.english, buttons.punjabi]
            }]

            var messageDataArray = [];
            messageDataArray.push(templates.generic);
            sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);

            break;
    }
}