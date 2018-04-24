//Code for Players

//Load all required files
var defMessages = require('../../config/defaultMessages.json');
var buttons = require('../variables/buttons.js');
var templates = require('../variables/templates.js');
var sendMessage = require('./sendMessage.js');
var rssParser = require('../../node_modules/rss-parser');
var parser = new rssParser({
    customFields: {
        item: [
            ['content:encoded', 'imagePath'],
            ['description', 'synopsis'],
            ['dc:creator', 'author'],
        ]
    }
});

const
    config = require('config'),
    request = require('request');

const
    BASE_DOMAIN = (process.env.BASE_DOMAIN) ?
    (process.env.BASE_DOMAIN) :
    config.get('base_domain');

const
    CONTENT_FEED = (process.env.CONTENT_FEED) ?
    (process.env.CONTENT_FEED) :
    config.get('content_feed');

var content = function (senderID, content_callback, locale) {

    async function feedParser() {
        console.log('Calling RSS Feed');
        var feedData = await parser.parseURL(BASE_DOMAIN + CONTENT_FEED.replace('{locale}', locale));
        //console.log(feedData.items);
        var allContent = [];
        if (feedData) {
            for (c = 0; c < 10; c++) {
                var contentTitle = feedData.items[c].title;
                var contentLink = feedData.items[c].link;
                var contentDesc = feedData.items[c].synopsis;
                var contentImg = feedData.items[c].imagePath;
                var imgRegex = /<div[^>]*.>*.\s*<img src=\"([^"]+)\"*.[^<]*.\s*<\/div>/;
                var contentImgSrc = contentImg.split(imgRegex)[1].replace('/16-9/1035-512/', '/1-1/388-218/');
                //console.log(contentImgSrc);
                var obj = {
                    title: contentTitle,
                    image_url: contentImgSrc,
                    subtitle: contentDesc,
                    "default_action": {
                        "type": "web_url",
                        "url": contentLink + "?webview=true"
                    }
                }
                //console.log(obj);
                allContent.push(obj);
            }
            content_callback(allContent);
        } else {
            console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
        }
    }
    feedParser();
}

module.exports = content;