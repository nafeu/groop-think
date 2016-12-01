$(function(){
console.log("Loading: dom-factory");

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
          $(this).append(domFactory.assets.nextBtn("Click to start game."));
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
        // .append(domFactory.assets.activeNextBtn("next question"));
    },
    endingDisplay: function(data) {
      return domFactory.assets.gameBoard()
        .append(domFactory.assets.winner(data))
        .append(domFactory.assets.nextBtn("Play again!"));
    }
  },
  assets: {
    gameBoard: function() {
      return $("<div></div>").attr("id", "game-board");
    },
    question: function(data) {
      return $("<div></div>").attr("id", "display-question")
        .append(
          $("<div></div>")
            .addClass("display-question-asker")
            .text(function(){
              if (data.currQuestion.by.length > 0)
                return data.currQuestion.by + " asks";
              else
                return "anonymous asks:";
            })
        )
        .append(
          $("<div></div>")
            .addClass("display-question-text")
            .text(data.currQuestion.q)
        );
    },
    answers: function(data) {
      var out = $("<div></div>").attr("id", "display-answers");
      var choices = data.currQuestion.a;
      for (var i = 0; i < choices.length; i++) {
        var choice = $("<div></div>")
          .addClass("display-choice")
          .text(choices[i])
          .attr("onclick", "if (user.active) socket.emit('submitAnswer', { 'answer': " + i + "});");
        out.append(choice);
      }
      return out;
    },
    players: function(data) {
      var out = $("<div></div>").attr("id", "display-players");
      var playerIds = Object.keys(data.players);
      for (var i = 0; i < playerIds.length; i++) {
        var player = $("<div></div>")
          .addClass("display-player")
          .attr("id", "userId-"+data.players[playerIds[i]].name)
          .css("border-color", getUsernameColor(data.players[playerIds[i]].name));
        var playerName = $("<div></div>")
          .addClass("display-player-name")
          .text(data.players[playerIds[i]].name)
          .css("color", getUsernameColor(data.players[playerIds[i]].name));
        var playerScore = $("<div></div>")
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
      var out = $("<div></div>").attr("id", "display-scores");
      var playerIds = Object.keys(data.players);
      for (var i = 0; i < playerIds.length; i++) {
        var player = $("<div></div>")
          .addClass("display-player")
          .attr("id", "userId-"+data.players[playerIds[i]].name)
          .css("border-color", getResultColor(data.players[playerIds[i]]))
          .append(
            $("<div></div>")
              .addClass("display-player-name")
              .text(data.players[playerIds[i]].name)
              .css("color", getResultColor(data.players[playerIds[i]])))
          .append(
            $("<div></div>")
              .addClass("display-player-increment")
              .text(data.players[playerIds[i]].increment));
        out.append(player);
      }
      return out;
    },
    topAnswer: function(data) {
      var out = $("<div></div>").attr("id", "display-popular");
      if (data.tiedScoreCounter > 1) {
        out.append(
          $("<div></div>")
            .addClass("display-popular-header")
            .text("Even split. No points! No majority!"));
      } else {
        var answer = $("<div></div>")
          .addClass("display-popular-top")
          .text(data.topAnswer);
        out.append(
          $("<div></div>")
            .addClass("display-popular-header")
            .text("The most popular answer was")
        .append(answer));
      }
      return out;

    },
    winner: function(data) {
      var out = $("<div></div>").attr("id", "display-winner");
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
      return $("<h1></h1>").text(msg).click(function(){
        socket.emit("nextState");
      });
    },
    activeNextBtn: function(msg) {
      return $("<h1></h1>").text(msg).click(function(){
        if (user.active) socket.emit("nextState");
      });
    },
    countdown: function(msg, seconds) {
      return $("<div></div>")
        .attr("id", "countdown-timer")
        .append(
          $("<span></span>")
            .text(msg)
            .addClass("countdown-timer-msg")
        )
        .append(
          $("<span></span>")
            .attr("id", "countdown-timer-num")
            .text(seconds)
        );
    }
  }
};

});