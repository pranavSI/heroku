//Define all required buttons in this file

//Load all required files
const
    defMessages = require('../../config/defaultMessages.json');

const
    config = require('config'),
    request = require('request');

const
    LOCALE = (process.env.LOCALE) ?
    (process.env.LOCALE) :
    config.get('locale');

//All Buttons
var allLocale = [];
var allPersistentMenu = [];
var allShop = [];
var allMatches = [];
var allLive = [];
var allUpcoming = [];
var allRecent = [];
var allPlayers = [];
var allUpdates = [];

for (l = 0; l < LOCALE.length; l++) {
    var locShort = LOCALE[l].locale_short;
    var locFull = LOCALE[l].locale_full;
    var locEntity = LOCALE[l].locale_entity;
    var locMenu = LOCALE[l].menu;
    var locMatches = LOCALE[l].matches;
    var locLive = LOCALE[l].live_match;
    var locUpcoming = LOCALE[l].upcoming_match;
    var locRecent = LOCALE[l].recent_match;
    var locPlayers = LOCALE[l].players;
    var locShop = LOCALE[l].shop;
    var locTitle = LOCALE[l].tickets;
    var locUpdates = LOCALE[l].latest_updates;
    var locSwicth = LOCALE[l].switch_locale;

    var objLocale = {
        "type": "postback",
        "payload": "GET_LOCALE_" + locShort,
        "title": locFull
    }
    allLocale.push(objLocale);

    var objPeristentMenu = {
        "type": "nested",
        "title": "🌐 " + locFull,
        "call_to_actions": [{
                "type": "web_url",
                "url": defMessages.tickets.url,
                "title": "🎟️ " + locTitle,
                "webview_height_ratio": "full"
            }, {
                "type": "postback",
                "payload": "GET_SHOP_" + locShort,
                "title": "🛒 " + locShop
            },
            {
                "type": "postback",
                "payload": "GET_LOCALE_" + locShort,
                "title": "🏠 " + locMenu
            },
            {
                "type": "postback",
                "payload": "LIVE_MATCH_" + locShort,
                "title": "🏏 " + locLive
            },
            {
                "type": "postback",
                "payload": "LATEST_UPDATES_" + locEntity,
                "title": "📰 " + locUpdates
            }
        ]
    }

    //console.log(objPeristentMenu);
    allPersistentMenu.push(objPeristentMenu);

    var objShop = {
        "type": "postback",
        "payload": "GET_SHOP_" + locShort,
        "title": locShop
    }
    allShop.push(objShop);

    var objMatches = {
        "type": "postback",
        "payload": "GET_MATCHES_" + locShort,
        "title": locMatches
    }
    allMatches.push(objMatches);

    var objLive = {
        "type": "postback",
        "payload": "LIVE_MATCH_" + locShort,
        "title": locLive
    }
    allLive.push(objLive);

    var objUpcoming = {
        "type": "postback",
        "payload": "UPCOMING_MATCH_" + locShort,
        "title": locUpcoming
    }
    allUpcoming.push(objUpcoming);

    var objRecent = {
        "type": "postback",
        "payload": "RECENT_MATCH_" + locShort,
        "title": locRecent
    }
    allRecent.push(objRecent);

    var objPlayers = {
        "type": "postback",
        "payload": "GET_PLAYERS_" + locShort,
        "title": locPlayers
    }
    allPlayers.push(objPlayers);

    var objUpdates = {
        "type": "postback",
        "payload": "LATEST_UPDATES_" + locEntity,
        "title": locUpdates
    }
    allUpdates.push(objUpdates);
}

//console.log(allLocale);
//Language Buttons
exports.locale = allLocale;

//console.log(allPersistent);
//Persistent Menu Buttons
exports.persistent = allPersistentMenu;

//console.log(allShop);
//Shop Buttons
exports.shop = allShop;

//console.log(allMatches);
//Matches Buttons
exports.matches = allMatches;

//console.log(allLive);
//Live Match Buttons
exports.live = allLive;

//console.log(allUpcoming);
//Upcoming Match Buttons
exports.upcoming = allUpcoming;

//console.log(allRecent);
//Recent Match Buttons
exports.recent = allRecent;

//console.log(allPlayers);
//Players Buttons
exports.players = allPlayers;

//console.log(allUpdates);
//Latest Updates Buttons
exports.updates = allUpdates;

//Webview URLs
exports.webview = {
    "type": "web_url",
    "url": "PLAYER_LINK",
    "title": "View Profile",
    "webview_height_ratio": "tall",
    "webview_share_button": "show"
};