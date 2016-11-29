module.exports = {
  scoreMessages: {
    majorityMessages: [
      "Look at me I'm sheeple",
      "Majority YEAH",
      "We observe collective thought",
      "Yeah I naw what you mean",
      "My opinion is better than yours",
      "I'm more equal than you",
      "I watch FOX News",
      "The hive mind... yes",
      "Sucks to be ya",
      "Ur mad cuz bad",
      "420 noscope blazeit"
    ],
    minorityMessages: [
      "Fuck you I won't do what you tell me",
      "Unpopular opinion puffin",
      "Shut the front door",
      "Originality is key except in this game",
      "Who gives a shit honestly",
      "Hipster till I die bruh",
      "I don't like things because other people do"
    ],
    evenMessages: [
      "Feeling a little too original aren't we",
      "3 original 4 me",
      "Even split my ass",
      "Whatever, at least we unique y'all",
      "I'm a special snowflake"
    ],
    majority: function(){
      return this.majorityMessages[Math.floor(Math.random()*this.majorityMessages.length)] + ", +1";
    },
    minority: function(){
      return this.minorityMessages[Math.floor(Math.random()*this.minorityMessages.length)] + ", no points";
    },
    even: function(){
      return this.evenMessages[Math.floor(Math.random()*this.evenMessages.length)];
    }
  }
};