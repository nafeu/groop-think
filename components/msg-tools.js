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
    noAnswerMessages: [
      "I have no answer.",
      "Sometimes the best opinion, is no opinion",
      "Welp, looks like I don't know how this game works",
      "No answer for me",
      "It's okay I didn't want points anyways"
    ],
    // TODO: Re-evaluate whether or not taunt messages should be included
    majority: function(){
      // return this.majorityMessages[Math.floor(Math.random()*this.majorityMessages.length)] + ", +1";
      return "+1";
    },
    minority: function(){
      // return this.minorityMessages[Math.floor(Math.random()*this.minorityMessages.length)] + ", no points";
      return "";
    },
    even: function(){
      // return this.evenMessages[Math.floor(Math.random()*this.evenMessages.length)];
      return "";
    },
    noAnswer: function(){
      // return this.noAnswerMessages[Math.floor(Math.random()*this.noAnswerMessages.length)];
      return "";
    }
  }
};