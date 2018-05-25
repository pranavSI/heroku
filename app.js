'use strict';

//Environment Settings
process.env.NODE_ENV = "dev";
process.env.NODE_APP_INSTANCE = 1;

//Load all required files
var defMessages = require('./config/defaultMessages.json');
var players = require('./src/scripts/players.js');
var matches = require('./src/scripts/matches.js');
var shoplist = require('./src/scripts/shop.js');
var content = require('./src/scripts/content.js');
var buttons = require('./src/variables/buttons.js');
var templates = require('./src/variables/templates.js');
var sendMessage = require('./src/scripts/sendMessage.js');

// Imports dependencies and set up http server
const
    config = require('config'),
    express = require('express'),
    pg = require('pg'),
    bodyParser = require('body-parser'),
    crypto = require('crypto'),
    request = require('request'),
    https = require('https');

//Base Domain
const
    BASE_DOMAIN = (process.env.BASE_DOMAIN) ?
    (process.env.BASE_DOMAIN) :
    config.get('base_domain');

//DB Connection Details
const
    CONNECTION_STRING = (process.env.CONNECTION_STRING) ?
    (process.env.CONNECTION_STRING) :
    config.get('db_connection');

// Sets server port and logs message on success
var app = express();
app.set('port', process.env.PORT || 5000, () => console.log('I\'m here. I\'m waiting.'));
app.set('view engine', 'ejs');
app.use(bodyParser.json({
    verify: verifyRequestSignature
}));
app.use(express.static('public'));

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
// function requiresServerURL(next, [recipientId, ...args]) {
//     next.apply(this, [recipientId, ...args]);
// }

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
                console.log("Success! Get Started button setup is complete.");
                //Call the Persistent Menu
                setPersistentMenu();
            } else {
                // TODO: Handle errors
                console.log("Error setting Get Started button: " + error);
                console.log("This is the Error: " + body);
            }
        });
}

function setPersistentMenu() {
    //console.log(locale);
    var persistentMenu = {
        "persistent_menu": [{
            "locale": "default",
            "composer_input_disabled": false,
            "call_to_actions": buttons.persistent
        }]
    }
    //console.log(buttons.persistent[locale]);
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
                console.log("Success! Persistent Menu setup is complete.");
            } else {
                // TODO: Handle errors
                console.log("Error setting up Persistent Menu: " + error);
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
    //console.log(event.message.nlp.entities);
}

//Postback Message Event & their respective Payloads
function eventPostbackMessage(event) {
    //console.log(event);
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback button for Structured Messages.
    var payload = event.postback.payload;
    var getLocale = payload.split('_')[2];

    switch (payload) {
        case 'GET_STARTED':
            sendMessage.sendTypingOn(senderID);
            sendMessage.sendTextMessage(senderID, defMessages.getStarted.responseText);
            sendMessage.sendTypingOn(senderID);
            templates.genericSquare.recipient.id = senderID;
            templates.genericSquare.message.attachment.payload.elements = [{
                "title": defMessages.getStarted.title,
                "image_url": BASE_DOMAIN + defMessages.getStarted.image_url,
                "subtitle": defMessages.getStarted.subtitle,
                "buttons": buttons.locale
            }]

            var messageDataArray = [];
            messageDataArray.push(templates.genericSquare);
            sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            break;

        case 'GET_LOCALE_' + getLocale:
            var butArr = [buttons.matches[0], buttons.updates[0], buttons.players[0]];
            if (getLocale != "en") {
                butArr = [buttons.matches[1], buttons.updates[1], buttons.players[1]];
            }
            sendMessage.sendTypingOn(senderID);
            sendMessage.sendTextMessage(senderID, defMessages.locale['text_' + getLocale]);
            templates.generic.recipient.id = senderID;
            templates.generic.message.attachment.payload.elements = [{
                "title": defMessages.locale['title_' + getLocale],
                "image_url": BASE_DOMAIN + defMessages.locale.image_url,
                "buttons": butArr
            }]

            var messageDataArray = [];
            messageDataArray.push(templates.generic);
            sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            break;

        case 'GET_SHOP_' + getLocale:
            //console.log(shoplist(senderID, shop_callback, getLocale));
            var shop_callback = function (err, elementList, activeLocale) {
                var messageDataArray = [];
                templates.typingOnInd.recipient.id = senderID;
                messageDataArray.push(templates.typingOnInd);
                templates.textmsg.recipient.id = senderID;
                templates.textmsg.message.text = defMessages.shop['text_' + activeLocale];
                messageDataArray.push(templates.textmsg);
                //console.log(elementList);
                if (err) {
                    var errorMsg = JSON.parse(JSON.stringify(templates.textmsg));
                    errorMsg.recipient.id = senderID;
                    errorMsg.message.text = defMessages.shopdefMessages.shop['error_' + activeLocale];
                    messageDataArray.push(errorMsg);
                } else {

                    if (elementList.length == 0) {
                        var noShop = JSON.parse(JSON.stringify(templates.textmsg));
                        noShop.recipient.id = senderID;
                        noShop.message.text = defMessages.shopdefMessages.shop['error_' + activeLocale];
                        messageDataArray.push(noShop);
                    } else {
                        //setting up list template
                        templates.listCompactBtn.recipient.id = senderID;
                        templates.listCompactBtn.message.attachment.payload.elements = elementList;
                        templates.listCompactBtn.message.attachment.payload.buttons = [{
                            "type": "web_url",
                            "title": "View More",
                            "url": BASE_DOMAIN + "/shop?utm_source=facebook&utm_medium=chatbot&utm_campaign=fb_messenger"
                        }];
                        messageDataArray.push(templates.listCompactBtn);
                    }
                }
                sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            }
            //console.log(payload);
            shoplist(senderID, shop_callback, getLocale);
            break;

        case 'GET_MATCHES_' + getLocale:
            //console.log(defMessages);
            var butArr = [buttons.live[0], buttons.upcoming[0], buttons.recent[0]];
            if (getLocale != "en") {
                butArr = [buttons.live[1], buttons.upcoming[1], buttons.recent[1]];
            }
            //console.log(defMessages);
            sendMessage.sendTypingOn(senderID);
            sendMessage.sendTextMessage(senderID, defMessages.matches['text_' + getLocale]);
            templates.generic.recipient.id = senderID;
            templates.generic.message.attachment.payload.elements = [{
                "title": defMessages.matches['title_' + getLocale],
                "image_url": BASE_DOMAIN + defMessages.matches.image_url,
                "buttons": butArr
            }]

            var messageDataArray = [];
            messageDataArray.push(templates.generic);
            sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            break;

        case 'LIVE_MATCH_' + getLocale:
        case 'UPCOMING_MATCH_' + getLocale:
        case 'RECENT_MATCH_' + getLocale:

            var matches_callback = function (err, elementList, typeOfMatch) {
                var butArr = [];
                var butErrArr = [];

                butArr.push(buttons.live[0]);
                butArr.push(buttons.upcoming[0]);
                butArr.push(buttons.recent[0]);

                //Buttons in case of No Live Matches
                butErrArr.push(buttons.upcoming[0]);
                butErrArr.push(buttons.recent[0]);

                if (getLocale != 'en') {
                    var butArr = [];
                    var butErrArr = [];

                    butArr.push(buttons.live[1]);
                    butArr.push(buttons.upcoming[1]);
                    butArr.push(buttons.recent[1]);

                    //Buttons in case of No Live Matches
                    butErrArr.push(buttons.upcoming[1]);
                    butErrArr.push(buttons.recent[1]);
                }

                var messageDataArray = [];
                templates.typingOnInd.recipient.id = senderID;
                messageDataArray.push(templates.typingOnInd);
                var errorResponse = defMessages.upcomingMatch['error_' + getLocale];
                if (typeOfMatch == 'L') {
                    errorResponse = defMessages.liveMatch['error_' + getLocale];
                } else if (typeOfMatch == 'R') {
                    errorResponse = defMessages.recentMatch['error_' + getLocale];
                }
                var titleResponse = defMessages.matches['title_' + getLocale];
                if (err) {
                    console.log('Some error occured');
                    var messageDataArray = [];
                    var errorMsg = JSON.parse(JSON.stringify(templates.textmsg));
                    errorMsg.recipient.id = senderID;
                    errorMsg.message.text = errorResponse;
                    messageDataArray.push(errorMsg);

                    templates.generic.recipient.id = senderID;
                    templates.generic.message.attachment.payload.elements = [{
                        "title": titleResponse,
                        "buttons": butErrArr
                    }]

                    messageDataArray.push(templates.generic);
                    sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
                } else if (elementList.length == 0) {
                    console.log('Element List is 0');
                    var noMatch = JSON.parse(JSON.stringify(templates.textmsg));
                    noMatch.recipient.id = senderID;
                    noMatch.message.text = errorResponse;

                    templates.generic.recipient.id = senderID;
                    templates.generic.message.attachment.payload.elements = [{
                        "title": titleResponse,
                        "buttons": butErrArr
                    }]

                    var messageDataArray = [];
                    templates.typingOnInd.recipient.id = senderID;
                    messageDataArray.push(templates.typingOnInd);
                    messageDataArray.push(noMatch);
                    messageDataArray.push(templates.generic);
                } else {
                    console.log('There are matches to show');
                    var messageDataArray = [];
                    //setting up carousel template
                    templates.generic.recipient.id = senderID;
                    templates.generic.message.attachment.payload.elements = elementList;
                    messageDataArray.push(templates.generic);
                }
                sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            }
            //console.log(payload);
            matches(senderID, payload, matches_callback, getLocale);
            break;

        case 'GET_PLAYERS_' + getLocale:
            //console.log(players(senderID, players_callback));
            var players_callback = function (err, elementList) {
                var messageDataArray = [];
                templates.typingOnInd.recipient.id = senderID;
                messageDataArray.push(templates.typingOnInd);
                templates.textmsg.recipient.id = senderID;
                templates.textmsg.message.text = defMessages.playerList['text_' + getLocale];
                messageDataArray.push(templates.textmsg);
                //console.log(elementList);
                if (err) {
                    var errorMsg = JSON.parse(JSON.stringify(templates.textmsg));
                    errorMsg.recipient.id = senderID;
                    errorMsg.message.text = defMessages.playerList['error_' + getLocale];
                    messageDataArray.push(errorMsg);
                } else {

                    if (elementList.length == 0) {
                        var noPlayers = JSON.parse(JSON.stringify(templates.textmsg));
                        noPlayers.recipient.id = senderID;
                        noPlayers.message.text = defMessages.playerList['error_' + getLocale];
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
            players(senderID, players_callback, getLocale);
            break;

        case 'LATEST_UPDATES_' + getLocale:
            var content_callback = function (elementList) {
                //console.log(getLocale);
                var messageDataArray = [];
                templates.typingOnInd.recipient.id = senderID;
                messageDataArray.push(templates.typingOnInd);
                templates.textmsg.recipient.id = senderID;
                templates.textmsg.message.text = defMessages.content['text_' + getLocale];
                messageDataArray.push(templates.textmsg);
                //console.log(elementList.length);

                //setting up carousel template
                templates.genericSquare.recipient.id = senderID;
                templates.genericSquare.message.attachment.payload.elements = elementList;
                messageDataArray.push(templates.genericSquare);
                sendMessage.recursiveCallSendAPI(senderID, messageDataArray, 0);
            }
            //console.log(payload);
            content(senderID, content_callback, getLocale);
            break;
    }
}