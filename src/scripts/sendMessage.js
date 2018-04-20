//Define all required functions to allow the Bot to send the message

//Import Dependencies
const
    config = require('config'),
    request = require('request');

//Default Messages
var defMessages = require('../../config/defaultMessages.json');

// Generate a page access token for your page from the App Dashboard
const
    PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('page_access_token');


//Recursive Call Send API
module.exports.recursiveCallSendAPI = function (senderID, messageDataArray, i) {

    //send messages in sequence and end only if last message is sent
    if (i < messageDataArray.length) {
        request({
            uri: 'https://graph.facebook.com/v2.12/me/messages',
            qs: {
                access_token: PAGE_ACCESS_TOKEN
            },
            method: 'POST',
            json: messageDataArray[i],

        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

                if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s",
                        messageId, recipientId);
                } else {
                    console.log("Successfully called Send API for recipient %s",
                        recipientId);
                }

                //increment message array index and do recursive call
                module.exports.recursiveCallSendAPI(senderID, messageDataArray, i + 1);
            } else {
                console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            }
        });
    }

    //  else{
    //    if(addMainMenuOption)
    //      returnToMainMenu.backToMainMenu(senderID);
    //  };
}