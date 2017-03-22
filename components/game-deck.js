var http = require('http');

var config;

try {
  config = require("../config.js");
}
catch(err) {
  config = {};
}

var deckUrl = process.env.DECK_URL || config.deck_url;

module.exports = {
  defaults: [
    {
      "q": "Who is best equipped to run America?",
      "a": [
        "Donald Trump",
        "Hillary Clinton",
        "Hilary Duff",
        "Donald Duck"
      ],
      "by": "@phrakturemusic"
    },
    {
      "q": "What is the proper pronounciation of GIF?",
      "a": [
        "JIFF, similar to the J in Jerry",
        "GIF, similar to G in Guild"
      ],
      "by": "@phrakturemusic"
    },
    {
      "q": "Which animal would be more affective in close quarters combat when equipped with a 12-gauge shotgun?",
      "a": [
        "Hamster",
        "Squirrel",
        "Hedgehog"
      ],
      "by": "@phrakturemusic"
    }
  ],
  fetchCards: function(cb) {
    if (deckUrl) {
      http.get(deckUrl, function(res){
        var body = '';
        res.on('data', function(chunk){
          body += chunk;
        });
        res.on('end', function(){
          cb(JSON.parse(body), null);
        });
      }).on('error', function(e){
        cb(null, e);
      });
    } else {
      cb(require('../data/sample-deck.json'), null);
    }
  },
  drawCard: function(deck) {
    var randInt = Math.floor(Math.random()*deck.length);
    return deck.splice(randInt, 1)[0];
  }
};