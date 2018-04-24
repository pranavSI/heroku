//Define all required buttons in this file

//Language English
exports.english = {
    type: "postback",
    payload: "LOCALE_EN",
    title: "English"
};

//Language Punjabi
exports.punjabi = {
    type: "postback",
    payload: "LOCALE_HI",
    title: "हिंदी"
};

//English Matches
exports.matches = {
    type: "postback",
    payload: "MATCHES",
    title: "Matches"
};

//English Live Match
exports.liveMatch = {
    type: "postback",
    payload: "LIVE_MATCH_EN",
    title: "Live Match"
};

//English Upcoming Match
exports.upcomingMatch = {
    type: "postback",
    payload: "UPCOMING_MATCH_EN",
    title: "Upcoming Match"
};

//English Recent Match
exports.recentMatch = {
    type: "postback",
    payload: "RECENT_MATCH_EN",
    title: "Recent Match"
};

//English Latest Updates
exports.latestUpdates = {
    type: "postback",
    payload: "LATEST_UPDATES_4",
    title: "Latest Updates"
};

//English Players
exports.players = {
    type: "postback",
    payload: "PLAYERS_EN",
    title: "Players"
};

//Regional Matches
exports.regMatches = {
    type: "postback",
    payload: "MATCHES_REG",
    title: "मॅचस"
};

//Regional Live Match
exports.regLiveMatch = {
    type: "postback",
    payload: "LIVE_MATCH_HI",
    title: "लाइव मॅच"
};

//Regional Upcoming Match
exports.regUpcomingMatch = {
    type: "postback",
    payload: "UPCOMING_MATCH_HI",
    title: "आने वाले मॅच"
};

//Regional Recent Match
exports.regRecentMatch = {
    type: "postback",
    payload: "RECENT_MATCH_HI",
    title: "ख़तम हुई मॅच"
};

//Regional Latest Updates
exports.regLatestUpdates = {
    type: "postback",
    payload: "LATEST_UPDATES_60",
    title: "ताज़ा खबर"
};

//Regional Players
exports.regPlayers = {
    type: "postback",
    payload: "PLAYERS_HI",
    title: "खिलाड़ी"
};

//Webview URLs
exports.webview = {
    "type": "web_url",
    "url": "PLAYER_LINK",
    "title": "View Profile",
    "webview_height_ratio": "tall",
    "webview_share_button": "show"
};