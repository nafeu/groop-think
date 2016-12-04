$(function(){
console.log("Loading: dom-factory");

function d(type, id, attrs) {
  var out = $("<"+type+">");
  if (id) out.attr("id", id);
  if (attrs) out.attr(attrs);
  return out;
}

domFactory = {
  build: {
    chatMessage: function(data) {
      var name = $("<span></span>")
        .addClass("chat-name")
        .css("color", getUsernameColor(data.user.name))
        .text(data.user.name);
      var message = $("<span></span>")
        .addClass("chat-message-text")
        .text(data.message);
      return $("<p></p>")
        .addClass("chat-message")
        .append(name)
        .append(": ")
        .append(message);
    },
    updateMessage: function(data) {
      var update = $("<span></span>")
        .addClass("chat-update-text")
        .text(data.text);
      return $("<p></p>")
        .addClass("chat-update")
        .append(update);
    },
    startingDisplay: function(data) {
      return domFactory.assets.gameBoard()
        .load("templates/game-rules.html", function(){
          if (user.isHost)
            $(this).append(domFactory.assets.hostLobby());
          else
            $(this).append(domFactory.assets.participantLobby());
        });
    },
    questionDisplay: function(data) {
      return domFactory.assets.gameBoard()
        .append(domFactory.assets.question(data))
        .append(domFactory.assets.answers(data))
        .append(domFactory.assets.players(data));
    },
    resultDisplay: function(data) {
      return domFactory.assets.gameBoard()
        .append(domFactory.assets.topAnswer(data))
        .append(domFactory.assets.scores(data))
        .append(domFactory.assets.countdown(function(){
          if (data.gameLength === 0)
            return "showing winner in ";
          return "next question in ";
        }, 7));
    },
    endingDisplay: function(data) {
      return domFactory.assets.gameBoard()
        .append(domFactory.assets.winner(data))
        .append(domFactory.assets.nextBtn("Play again!"));
    },
    disconnectDisplay: function() {
      return domFactory.assets.gameBoard()
        .append(
          d('h3').text("You have been disconnected from the server.")
        )
      ;
    }
  },
  assets: {
    gameBoard: function() {
      return d('div', 'game-board');
    },
    hostLobby: function() {
      return d('div', 'host-lobby')
        .append(
          domFactory.assets.nextBtn('Start Game.')
        )
      ;
    },
    participantLobby: function() {
      return d('div', 'participant-lobby')
        .append(
          d('h2').text("Waiting for host to start...")
        )
      ;
    },
    question: function(data) {
      return d('div', 'display-question')
        .append(
          d('div')
            .addClass("display-question-asker")
            .text(function(){
              if (data.currQuestion.by.length > 0)
                return data.currQuestion.by + " asks";
              else
                return "anonymous asks:";
            })
        )
        .append(
          d('div')
            .addClass("display-question-text")
            .text(data.currQuestion.q)
        );
    },
    answers: function(data) {
      var out = d('div', 'display-answers');
      var choices = data.currQuestion.a;
      for (var i = 0; i < choices.length; i++) {
        var choice = d('div')
          .addClass("display-choice")
          .text(choices[i])
          .attr("onclick", "if (user.active) socket.emit('submitAnswer', { 'answer': " + i + "});");
        out.append(choice);
      }
      return out;
    },
    players: function(data) {
      var out = d('div', 'display-players');
      var playerIds = Object.keys(data.players);
      for (var i = 0; i < playerIds.length; i++) {
        var player = d('div', "userId-"+data.players[playerIds[i]].name)
          .addClass("display-player")
          .css("border-color", getUsernameColor(data.players[playerIds[i]].name));
        var playerName = d('div')
          .addClass("display-player-name")
          .text(data.players[playerIds[i]].name)
          .css("color", getUsernameColor(data.players[playerIds[i]].name));
        var playerScore = d('div')
          .addClass("display-player-score")
          .text(data.players[playerIds[i]].score);
        player
          .append(playerName)
          .append(playerScore);
        out.append(player);
      }
      return out;
    },
    scores: function(data) {
      var out = d('div', "display-scores");
      var playerIds = Object.keys(data.players);
      for (var i = 0; i < playerIds.length; i++) {
        var player = d('div', "userId-"+data.players[playerIds[i]].name)
          .addClass("display-player")
          .css("border-color", getResultColor(data.players[playerIds[i]]))
          .append(
            d('div')
              .addClass("display-player-name")
              .text(data.players[playerIds[i]].name)
              .css("color", getResultColor(data.players[playerIds[i]])))
          .append(
            d('div')
              .addClass("display-player-increment")
              .text(data.players[playerIds[i]].increment));
        out.append(player);
      }
      return out;
    },
    topAnswer: function(data) {
      var out = d('div', "display-popular");
      if (data.tiedScoreCounter > 1) {
        out.append(
          d('div')
            .addClass("display-popular-header")
            .text("Even split. No points! No majority!"));
      } else {
        var answer = d('div')
          .addClass("display-popular-top")
          .text(data.topAnswer);
        out.append(
          d('div')
            .addClass("display-popular-header")
            .text("The most popular answer was")
        .append(answer));
      }
      return out;
    },
    winner: function(data) {
      var out = d('div', 'display-winner');
      var playerIds = Object.keys(data.players);
      var winner = "";
      var highestScore = 0;
      for (var i = 0; i < playerIds.length; i++) {
        if (data.players[playerIds[i]].score > highestScore) {
          highestScore = data.players[playerIds[i]].score;
          winner = data.players[playerIds[i]].name;
        }
      }
      out.text("The winner is " + winner + " with a score of " + highestScore);
      if (highestScore === 0) {
        out.text("Ugh, it was a tie... Lame.");
      }
      return out;
    },
    nextBtn: function(msg) {
      return d('h1').text(msg).click(function(){
        socket.emit("nextState");
      });
    },
    activeNextBtn: function(msg) {
      return d('h1').text(msg).click(function(){
        if (user.active) socket.emit("nextState");
      });
    },
    countdown: function(msg, seconds) {
      return d('div', "countdown-timer")
        .append(
          d('span')
            .text(msg)
            .addClass("countdown-timer-msg")
        )
        .append(
          d('span', "countdown-timer-num")
            .text(seconds)
        );
    },
  }
};

});