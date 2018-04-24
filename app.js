'use strict';

//Environment Settings
process.env.NODE_ENV = "dev";
process.env.NODE_APP_INSTANCE = 1;

//Load all required files
var defMessages = require('./config/defaultMessages.json');
var players = require('./src/scripts/players.js');
var matches = require('./src/scripts/matches.js');
var content = require('./src/scripts/content.js');
var buttons = require('./src/variables/buttons.js');
var templates = require('./src/variables/templates.js');
var sendMessage = require('./src/scripts/sendMessage.js');

// Imports dependencies and set up http server
const
    config = require('config'),
    express = require('express'),
    bodyParser = require('body-parser'),
    crypto = require('crypto'),
    //app = express().use(bodyParser.json()), // creates express http server
    request = require('request'),
    https = require('https');

// Sets server port and logs message on success
var app = express();
app.set('port', process.env.PORT || 80, () => console.log('I\'m here. I\'m waiting.'));
app.set('view engine', 'ejs');
app.use(bodyParser.json({
    verify: verifyRequestSignature
}));
app.use(express.static('public'));
// app.listen(process.env.PORT || 5000, () => console.log('I\'m here. I\'m waiting.'));

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

//Setup Server Base Path
const
    SERVER_URL = (process.env.SERVER_URL) ?
    (process.env.SERVER_URL) :
    config.get('server_url');

//Check if all the basic requirements are in place
if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
    console.error("Missing config values");
    process.exit(1);
}

//Verify that the callback came from Facebook: https://developers.facebook.com/docs/graph-api/webhooks#setup

function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];

    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
        console.error("Couldn't validate the signature.");
    } else {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];

        var expectedHash = crypto.createHmac('sha1', APP_SECRET)
            .update(buf)
            .digest('hex');

        if (signatureHash != expectedHash) {
            throw new Error("Couldn't validate the request signature.");
        }
    }
}

//Server url definition
function requiresServerURL(next, [recipientId, ...args]) {
    next.apply(this, [recipientId, ...args]);
}

//Start server. Webhooks must be available via SSL with a certificate signed by a valid certificate authority.
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

//Base Path
app.get("/", function (req, res) {
    res.send("Deployed!");
});

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
    //console.log(body);
    //Check if this is a page subscription
    if (body.object === 'page') {

        //Iterate over each entry since there could be multiple if batched
        body.entry.forEach(function (pageEntry) {
            var pageID = pageEntry.id;
            var eventTime = pageEntry.time;

            //Iterate over each messaging event
            if (pageEntry.messaging) {
                pageEntry.messaging.forEach(function (allMessages) {
                    if (allMessages.message) {
                        eventTextMessage(allMessages);
                    } else if (allMessages.postback) {
                        eventPostbackMessage(allMessages);
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
                console.log("Success! Get started button setup.");
                //Call the Persistent Menu
                persistentMenu();
            } else {
                // TODO: Handle errors
                console.log("Error for Get Started setup: " + error);
                console.log("Get Started Error: " + body);
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
                    "payload": "LIVE_MATCH_EN",
                    "title": "Live Scores"
                },
                {
                    "type": "postback",
                    "payload": "LATEST_UPDATES_4",
                    "title": "Latest Updates"
                },
                {
                    "type": "postback",
                    "payload": "GET_STARTED",
                    "title": "Switch Language"
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
                console.log("Error for Persistent menu setup: " + error);
                console.log("Persistent Error: " + body);
            }
        });
}

//Message Delivery Event
function receivedDeliveryConfirmation(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var delivery = event.delivery;
    var messageIDs = delivery.mids;
    var watermark = delivery.watermark;
    var sequenceNumber = delivery.seq;

    if (messageIDs) {
        messageIDs.forEach(function (messageID) {
            console.log("Received delivery confirmation for message ID: %s",
                messageID);
        });
    }

    console.log("All message before %d were delivered.", watermark);
}

//Read Receipts Event
function receivedMessageRead(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    // All messages before watermark (a timestamp) or sequence have been seen.
    var watermark = event.read.watermark;
    var sequenceNumber = event.read.seq;

    //console.log("Received message read event for watermark %d and sequence " +
    //  "number %d", watermark, sequenceNumber);
}

//Text Message Event & their respective payloads
function eventTextMessage(event) {
    //console.log(event.message.nlp);
}

//Postback Message Event & their respective Payloads
function eventPostbackMessage(event) {
    //console.log(event);
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback button for Structured Messages.
    var payload = event.postback.payload;

    switch (payload) {
        case 'GET_STARTED':
            //console.log(defMessages);
            sendMessage.sendTypingOn(senderID);
            sendMessage.sendTextMessage(senderID, defMessages.getStarted.responseText);
            sendMessage.sendTypingOn(senderID);
            templates.generic.recipient.id = senderID;
            templates.generic.message.attachment.payload.elements = [{
                "title": defMessages.getStarted.title,
                "buttons": [buttons.english, buttons.punjabi]
            }]

            var messageDataArray = [];
            messageDataArray.push(templates.generic);
            sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);

            break;

        case 'LOCALE_EN':
            //console.log(defMessages);
            sendMessage.sendTypingOn(senderID);
            sendMessage.sendTextMessage(senderID, defMessages.locale.responseText);
            templates.generic.recipient.id = senderID;
            templates.generic.message.attachment.payload.elements = [{
                "title": defMessages.locale.title,
                "image_url": defMessages.locale.image_url,
                "buttons": [buttons.matches, buttons.latestUpdates, buttons.players]
            }]

            var messageDataArray = [];
            messageDataArray.push(templates.generic);
            sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);

            break;

        case 'LOCALE_HI':
            //console.log(defMessages);
            sendMessage.sendTypingOn(senderID);
            sendMessage.sendTextMessage(senderID, defMessages.locale.responseTextReg);
            templates.generic.recipient.id = senderID;
            templates.generic.message.attachment.payload.elements = [{
                "title": defMessages.locale.titleReg,
                "image_url": defMessages.locale.image_url,
                "buttons": [buttons.regMatches, buttons.regLatestUpdates, buttons.regPlayers]
            }]

            var messageDataArray = [];
            messageDataArray.push(templates.generic);
            sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);

            break;

        case 'MATCHES':
            //console.log(defMessages);
            sendMessage.sendTypingOn(senderID);
            sendMessage.sendTextMessage(senderID, defMessages.matches.responseText);
            templates.generic.recipient.id = senderID;
            templates.generic.message.attachment.payload.elements = [{
                "title": defMessages.matches.title,
                "image_url": defMessages.matches.image_url,
                "buttons": [buttons.liveMatch, buttons.upcomingMatch, buttons.recentMatch]
            }]

            var messageDataArray = [];
            messageDataArray.push(templates.generic);
            sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            break;

        case 'MATCHES_REG':
            //console.log(defMessages);
            sendMessage.sendTypingOn(senderID);
            sendMessage.sendTextMessage(senderID, defMessages.matches.responseTextReg);
            templates.generic.recipient.id = senderID;
            templates.generic.message.attachment.payload.elements = [{
                "title": defMessages.matches.titleReg,
                "image_url": defMessages.matches.image_url,
                "buttons": [buttons.regLiveMatch, buttons.regUpcomingMatch, buttons.regRecentMatch]
            }]

            var messageDataArray = [];
            messageDataArray.push(templates.generic);
            sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            break;

        case 'LIVE_MATCH_EN':
        case 'UPCOMING_MATCH_EN':
        case 'RECENT_MATCH_EN':
        case 'LIVE_MATCH_HI':
        case 'UPCOMING_MATCH_HI':
        case 'RECENT_MATCH_HI':
            //console.log(players(senderID, players_callback));
            var matches_callback = function (err, elementList) {
                var messageDataArray = [];
                templates.typingOnInd.recipient.id = senderID;
                messageDataArray.push(templates.typingOnInd);
                templates.textmsg.recipient.id = senderID;
                templates.textmsg.message.text = defMessages.liveMatch.responseText;
                messageDataArray.push(templates.textmsg);

                if (err != null) {
                    var errorMsg = JSON.parse(JSON.stringify(templates.textmsg));
                    errorMsg.recipient.id = senderID;
                    errorMsg.message.text = err;
                    messageDataArray.push(errorMsg);

                    templates.generic.recipient.id = senderID;
                    templates.generic.message.attachment.payload.elements = [{
                        "title": defMessages.matches.title,
                        "image_url": defMessages.matches.image_url,
                        "buttons": [buttons.regUpcomingMatch, buttons.regRecentMatch]
                    }]

                    var messageDataArray = [];
                    messageDataArray.push(templates.generic);
                    sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
                } else {

                    if (elementList.length == 0) {
                        var noMatch = JSON.parse(JSON.stringify(templates.textmsg));
                        noMatch.recipient.id = senderID;
                        noMatch.message.text = defMessages.liveMatch.error;
                        messageDataArray.push(noMatch);
                    } else {
                        //setting up carousel template
                        templates.generic.recipient.id = senderID;
                        templates.generic.message.attachment.payload.elements = elementList;
                        messageDataArray.push(templates.generic);
                    }
                }
                sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            }
            console.log(payload);
            var locale = payload.split('_')[2];
            matches(senderID, payload, matches_callback, locale);
            break;

        case 'PLAYERS_EN':
        case 'PLAYERS_HI':
            //console.log(players(senderID, players_callback));
            var players_callback = function (err, elementList) {
                var messageDataArray = [];
                templates.typingOnInd.recipient.id = senderID;
                messageDataArray.push(templates.typingOnInd);
                templates.textmsg.recipient.id = senderID;
                templates.textmsg.message.text = defMessages.playerList.text;
                messageDataArray.push(templates.textmsg);
                //console.log(elementList);
                if (err != null) {
                    var errorMsg = JSON.parse(JSON.stringify(templates.textmsg));
                    errorMsg.recipient.id = senderID;
                    errorMsg.message.text = err;
                    messageDataArray.push(errorMsg);
                } else {

                    if (elementList.length == 0) {
                        var noPlayers = JSON.parse(JSON.stringify(templates.textmsg));
                        noPlayers.recipient.id = senderID;
                        noPlayers.message.text = defMessages.playerList.error;
                        messageDataArray.push(noPlayers);
                    } else {
                        //setting up carousel template
                        templates.genericSquare.recipient.id = senderID;
                        templates.genericSquare.message.attachment.payload.elements = elementList;
                        messageDataArray.push(templates.genericSquare);
                    }
                }
                sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            }
            //console.log(payload);
            var locale = payload.split('_')[1];
            players(senderID, players_callback, locale);
            break;

        case 'LATEST_UPDATES_4':
        case 'LATEST_UPDATES_60':
            //console.log(players(senderID, players_callback));
            var content_callback = function (elementList) {
                var messageDataArray = [];
                templates.typingOnInd.recipient.id = senderID;
                messageDataArray.push(templates.typingOnInd);
                templates.textmsg.recipient.id = senderID;
                templates.textmsg.message.text = defMessages.content.text;
                messageDataArray.push(templates.textmsg);
                console.log(elementList.length);

                //setting up carousel template
                templates.genericSquare.recipient.id = senderID;
                templates.genericSquare.message.attachment.payload.elements = elementList;
                messageDataArray.push(templates.genericSquare);
                sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            }
            //console.log(payload);
            var locale = payload.split('_')[2];
            content(senderID, content_callback, locale);
            break;
    }
}