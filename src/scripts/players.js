//Code for Players

//Load all required files
var defMessages = require('../../config/defaultMessages.json');
var buttons = require('../variables/buttons.js');
var templates = require('../variables/templates.js');
var sendMessage = require('./sendMessage.js');

const
    config = require('config'),
    request = require('request');

const
    BASE_DOMAIN = (process.env.BASE_DOMAIN) ?
    (process.env.BASE_DOMAIN) :
    config.get('base_domain');

const
    TEAM_SQUAD = (process.env.TEAM_SQUAD) ?
    (process.env.TEAM_SQUAD) :
    config.get('squad');

var players = function (senderID, players_callback, locale) {
    if (locale != "en") {
        var feedURL = BASE_DOMAIN + TEAM_SQUAD.replace('{locale}', locale);
    } else {
        feedURL = BASE_DOMAIN + TEAM_SQUAD.replace('{locale}/', '');
    }
    //console.log(feedURL);
    request({
        uri: feedURL,
        method: 'GET',
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var arrayOfPlayers = JSON.parse(body).squads.teams.team[0].players.player;
            //console.log(arrayOfPlayers.length);
            //console.log(arrayOfPlayers);

            if (arrayOfPlayers == null || typeof (arrayOfPlayers) == undefined) {
                console.error("Unable to fetch information from API", response.statusCode, response.statusMessage, body.error);
                players_callback(defMessages.playerList.error, null);
            } else {
                var allPlayers = [];
                var displaylength = arrayOfPlayers.length <= 10 ? arrayOfPlayers.length : 10;
                for (var p = 0; p < displaylength; p++) {
                    var playerID = arrayOfPlayers[p].id;
                    var playerName = arrayOfPlayers[p].name;
                    var playerSkill = arrayOfPlayers[p].skill_name;

                    var obj = {
                        title: playerName,
                        image_url: BASE_DOMAIN + "/static-assets/images/players/small/11/" + playerID + ".png?v=1.21",
                        subtitle: playerSkill,
                        buttons: [{
                            "type": "web_url",
                            "url": BASE_DOMAIN + "/players/" + playerID + "-" + playerName.toLowerCase().split(' ').join('-') + "-profile?utm_source=facebook&utm_medium=chatbot&utm_campaign=fb_messenger",
                            "title": "View Profile",
                            "webview_height_ratio": "tall",
                            "webview_share_button": "show"
                        }]
                    }
                    allPlayers.push(obj);
                }
                players_callback(error, allPlayers);
            }
        } else {
            console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
        }
    });
    return ("Success");
}

module.exports = players;