var msgt = require('./msg-tools');

module.exports = function(serverData, uiManager, gameDeck, debug) {
  return {
    next: function(room) {
      var self = this;
      currRoom = serverData.rooms[room];
      var activePlayers = Object.keys(currRoom.players);
      switch (currRoom.phase) {
        case "start":
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
              increment: null,
              points: null
            };
            currRoom.players[clientIds[i]] = playerObj;
          }
          currRoom.currQuestion = gameDeck.drawCard(currRoom.deck);
          currRoom.gameLength--;
          currRoom.phase = "question";
          break;
        case "question":
          var resultCounter = [];
          for (var j = 0; j < currRoom.currQuestion.a.length; j++) {
            resultCounter.push(0);
          }
          for (var k = 0; k < activePlayers.length; k++) {
            resultCounter[currRoom.players[activePlayers[k]].choice] += 1;
          }
          var majorityIdx = indexOfMax(resultCounter);
          currRoom.tiedScoreCounter = 0;
          currRoom.topAnswer = currRoom.currQuestion.a[majorityIdx];
          resultCounter.forEach(function(item){
            if (item == resultCounter[majorityIdx]) {
              currRoom.tiedScoreCounter++;
            }
          });
          for (var l = 0; l < activePlayers.length; l++) {
            if (currRoom.tiedScoreCounter > 1) {
              currRoom.players[activePlayers[l]].increment = msgt.scoreMessages.even();
              currRoom.players[activePlayers[l]].points = false;
            } else {
              if (currRoom.players[activePlayers[l]].choice == majorityIdx) {
                currRoom.players[activePlayers[l]].score += 1;
                currRoom.players[activePlayers[l]].increment = msgt.scoreMessages.majority();
                currRoom.players[activePlayers[l]].points = true;
              } else {
                currRoom.players[activePlayers[l]].increment = msgt.scoreMessages.minority();
                currRoom.players[activePlayers[l]].points = false;
              }
            }
          }
          currRoom.phase = "result";
          var interval = setInterval(function() {
            self.next(room);
            clearInterval(interval);
          }, 7000);
          break;
        case "result":
          if (currRoom.gameLength > 0) {
            currRoom.currQuestion = gameDeck.drawCard(currRoom.deck);
            currRoom.gameLength--;
            for (var m = 0; m < activePlayers.length; m++) {
              currRoom.players[activePlayers[m]].choice = null;
            }
            currRoom.numAnswers = 0;
            currRoom.phase = "question";
          } else {
            currRoom.phase = "end";
          }
          break;
        case "end":
          currRoom.gameLength = 3;
          currRoom.currQuestion = {};
          currRoom.numActive = 0;
          currRoom.numAnswers = 0;
          currRoom.topAnswer = null;
          currRoom.winner = null;
          currRoom.players = {};
          currRoom.phase = "start";
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