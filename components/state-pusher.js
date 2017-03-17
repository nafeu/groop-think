var msgt = require('./msg-tools');

module.exports = function(serverData, uiManager, gameDeck, debug) {
  return {
    nextIn: function(room, delay, oldState) {
      var self = this;
      var currRoom = serverData.rooms[room];
      setTimeout(function(){
        if (currRoom.phase == oldState)
          self.next(room);
      }, delay);
    },
    next: function(room) {
      var self = this;
      var activePlayers;
      var currRoom;
      var questionTime = 5000; // Must match client side question countdown
      var resultTime = 7000; // Must match client side result countdown
      currRoom = serverData.rooms[room];
      if (currRoom)
        activePlayers = Object.keys(currRoom.players);
      else
        currRoom = { phase: "closed" };
      switch (currRoom.phase) {
        case "start":
          debug.log("<< Starting game in ".blue + room + " " + getTimeStamp().bold.blue + " >>".blue);
          var clientIds = [];
          Object.keys(serverData.clientData).forEach(function(cid){
            if (serverData.clientData[cid].room == room) {
              clientIds.push(cid);
            }
          });
          currRoom.numActive = clientIds.length;
          for (var i = 0; i < clientIds.length; i++) {
            var playerObj = {
              name: serverData.clientData[clientIds[i]].name,
              score: 0,
              choice: null,
              taunt: null,
              points: false
            };
            currRoom.players[clientIds[i]] = playerObj;
          }
          currRoom.currQuestion = gameDeck.drawCard(currRoom.deck);
          currRoom.gameLength--;
          currRoom.phase = "question";
          debug.log("<< State for ".blue + room + " is now ".blue + currRoom.phase + " " + getTimeStamp().bold.blue + " >>".blue);
          // Display the question for questionTime
          self.nextIn(room, questionTime, "question");
          break;
        case "question":
          var resultCounter;
          var majorityIdx;
          currRoom.tiedScoreCounter = 0;

          // Fill up resultCounter with array of 0s
          resultCounter = Array.apply(null, Array(currRoom.currQuestion.a.length))
            .map(Number.prototype.valueOf,0);

          console.log("Setup result counter: ", resultCounter);

          // Go through everyones response if any and add increment the
          // respective counter based on their choice idx
          activePlayers.forEach(function(p){
            if (currRoom.players[p].choice !== null)
              resultCounter[currRoom.players[p].choice] += 1;
          });

          console.log("Increment counters based on answers: ", resultCounter);

          // Find the index of the answer that sits in the majority
          majorityIdx = indexOfMax(resultCounter);
          currRoom.topAnswer = currRoom.currQuestion.a[majorityIdx];

          console.log("Get the majority IDX: ", majorityIdx, " for: ", resultCounter);

          // Check if there are any tied answers
          resultCounter.forEach(function(c){
            if (c == resultCounter[majorityIdx]) {
              currRoom.tiedScoreCounter++;
            }
          });

          console.log("Set the tied score counter: ", currRoom.tiedScoreCounter, " for: ", resultCounter);

          // Decide whether players gain points or not
          activePlayers.forEach(function(p){
            var selectedPlayer = currRoom.players[p];
            selectedPlayer.points = false;

            // Case 1: No one answers
            if (resultCounter.reduce(getSum) === 0) {
              console.log("Condition met: NO ONE ANSWERED");
              selectedPlayer.taunt = msgt.scoreMessages.noAnswer();
            }

            // Case 2: There is an even split
            else if (currRoom.tiedScoreCounter > 1) {
              console.log("Condition met: EVEN SPLIT");
              selectedPlayer.taunt = msgt.scoreMessages.even();
            }

            else
            {
              console.log("Condition met: SOMEONE ANSWERED");
              // Check if player answered at all
              if (selectedPlayer.choice !== null) {
                console.log(selectedPlayer.name + " answered a question...");
                console.log(selectedPlayer.choice + " was their answer...");

                // Case 3: Player is in the majority
                if (selectedPlayer.choice == majorityIdx)
                {
                  console.log(selectedPlayer.name + " gets points...");
                  selectedPlayer.score += 1;
                  selectedPlayer.taunt = msgt.scoreMessages.majority();
                  selectedPlayer.points = true;
                }

                // Case 4: Player is in the minority
                else
                  selectedPlayer.taunt = msgt.scoreMessages.minority();
              }

              // Case 5: Player did not answer
              else
                selectedPlayer.taunt = msgt.scoreMessages.noAnswer();
            }
          });
          // Reset room state vars
          currRoom.phase = "result";
          debug.log("<< State for ".blue + room + " is now ".blue + currRoom.phase + " " + getTimeStamp().bold.blue + " >>".blue);
          // Display the result for resultTime
          self.nextIn(room, resultTime, "result");
          break;
        case "result":
          if (currRoom.gameLength > 0) {
            currRoom.currQuestion = gameDeck.drawCard(currRoom.deck);
            currRoom.gameLength--;
            activePlayers.forEach(function(p){
              currRoom.players[p].choice = null;
            });
            currRoom.numAnswers = 0;
            currRoom.phase = "question";
            debug.log("<< State for ".blue + room + " is now ".blue + currRoom.phase + " " + getTimeStamp().bold.blue + " >>".blue);
            // Display the next question for questionTime
            self.nextIn(room, questionTime, "question");
          } else {
            currRoom.phase = "end";
            debug.log("<< State for ".blue + room + " is now ".blue + currRoom.phase + " " + getTimeStamp().bold.blue + " >>".blue);
          }
          break;
        case "end":
          currRoom.gameLength = 5;
          currRoom.currQuestion = {};
          currRoom.numActive = Object.keys(currRoom.players).length;
          currRoom.tiedScoreCounter = null;
          currRoom.numAnswers = 0;
          currRoom.topAnswer = null;
          currRoom.winner = null;
          currRoom.players = {};
          currRoom.phase = "start";
          break;
        case "closed":
          debug.log("---supressed attempted state-push on closed room".red);
          break;
      }
      uiManager.renderState(room);
    },
    createGameState: function(cards, len) {
      return {
        "hostId": null,
        "phase": "start",
        "gameLength": len,
        "currQuestion": {},
        "numActive": 0,
        "numAnswers": 0,
        "topAnswer": null,
        "tiedScoreCounter": 0,
        "winner": null,
        "players": {},
        "typing": [],
        "roomSize": 10,
        "deck": cards
      };
    }
  };
};

function indexOfMax(arr) {
  if (arr.length === 0) {
    return -1;
  }
  var max = arr[0];
  var maxIndex = 0;
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }
  return maxIndex;
}

function getTimeStamp() {
  var now = new Date();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  var ampm = "AM";
  if (hours > 12) {
    hours -= 12;
    ampm = "PM";
  }
  if (minutes < 10) {
    minutes = "0"+minutes;
  }
  if (seconds < 10) {
    seconds = "0"+seconds;
  }
  return hours + ":" + minutes + ":" + seconds + " " + ampm;
}

function getSum(total, num) {
    return total + num;
}
