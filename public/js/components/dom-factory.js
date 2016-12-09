$(function(){
console.log("Loading: dom-factory");

function d(type, attrs) {
  var out = $("<"+type+">");
  if (attrs) out.attr(attrs);
  return out;
}

domFactory = {
  build: {
    chatMessage: function(data) {
      var name = d('span', { class: 'chat-name' })
        .css("color", getUsernameColor(data.user.name))
        .text(data.user.name);
      var message = d('span', { class: 'chat-message-text' })
        .text(data.message);
      return d('p', { class: 'chat-message' })
        .append(name, ": ", message);
    },
    updateMessage: function(data) {
      var update = d('span', { class: 'chat-update-text' })
        .text(data.text);
      return d('p', { class: 'chat-update' })
        .append(update);
    },
    startingDisplay: function(data) {
      return domFactory.assets.gameBoard()
        .load("templates/game-rules.html", function(){
          if (user.isHost)
            $(this).append(domFactory.assets.hostLobby(data));
          else
            $(this).append(domFactory.assets.participantLobby());
        });
    },
    questionDisplay: function(data) {
      return domFactory.assets.gameBoard()
        .append(
          domFactory.assets.question(data),
          domFactory.assets.answers(data),
          domFactory.assets.players(data)
        );
    },
    resultDisplay: function(data) {
      return domFactory.assets.gameBoard()
        .append(
          domFactory.assets.topAnswer(data),
          domFactory.assets.scores(data),
          domFactory.assets.countdown(function(){
            if (data.gameLength === 0)
              return "showing winner in ";
            return "next question in ";
          }, 7)
        );
    },
    endingDisplay: function(data) {
      return domFactory.assets.gameBoard()
        .append(
          domFactory.assets.winner(data),
          domFactory.assets.nextBtn("Play again!")
        );
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
      return d('div', { id: 'game-board' });
    },
    hostLobby: function(data) {
      return d('div', { id: 'host-lobby' })
        .append(
          domFactory.assets.gameSettings(data),
          domFactory.assets.inviteBtn(),
          domFactory.assets.gameStartBtn()
        )
      ;
    },
    participantLobby: function() {
      return d('div', { id: 'participant-lobby' })
        .append(
          domFactory.assets.inviteBtn(),
          d('h2').text("Waiting for host to start...")
        )
      ;
    },
    gameSettings: function(data) {
      return d('div', { id: 'game-settings' })
        .append(
          d('div')
            .append(
              d('div', { class: 'room-size-btn' }).text(data.roomSize).click(function(){
                socket.emit('cycleRoomSize');
              }),
              d('div', { class: 'room-size-label' }).text("Room Size")
            ),
          d('div', { class: "game-length" })
            .append(
              d('div', { class: 'game-length-btn' }).text(data.gameLength).click(function(){
                socket.emit('cycleGameLength');
              }),
              d('div', { class: 'game-length-label' }).text("Game Length")
            )
        );
    },
    inviteBtn: function() {
      return d('div', { id: 'invite-btn' })
      .text("Invite your friends!")
      .on('click', function(){
        copyToClipboard(getCurrentUrl());
        $(this).text("Invite link copied to clipboard.");
      });
    },
    question: function(data) {
      return d('div', { id: 'display-question' })
        .append(
          d('div', { class: 'display-question-asker' })
            .text(function(){
              if (data.currQuestion.by.length > 0)
                return data.currQuestion.by + " asks";
              else
                return "anonymous asks:";
            }),
          d('div', { class: 'display-question-text' })
            .text(data.currQuestion.q)
        );
    },
    answers: function(data) {
      var out = d('div', { id: 'display-answers' });
      var choices = data.currQuestion.a;
      choices.forEach(function(answer, index){
        var choice = d('div', { class: 'display-choice' })
          .text(answer)
          .attr("onclick", "if (user.active) socket.emit('submitAnswer', { 'answer': " + index + "});");
        out.append(choice);
      });
      return out;
    },
    players: function(data) {
      var out = d('div', { id: 'display-players' });
      var playerIds = Object.keys(data.players);
      playerIds.forEach(function(playerId){
        var player = d('div', {
            id: "userId-"+data.players[playerId].name,
            class: "display-player",
          })
          .css("border-color", getUsernameColor(data.players[playerId].name));
        var playerName = d('div', { class: 'display-player-name' })
          .text(data.players[playerId].name)
          .css("color", getUsernameColor(data.players[playerId].name));
        var playerScore = d('div', { class: 'display-player-score' })
          .text(data.players[playerId].score);
        player.append(playerName, playerScore);
        out.append(player);
      });
      return out;
    },
    scores: function(data) {
      var out = d('div', { id: "display-scores" });
      var playerIds = Object.keys(data.players);
      playerIds.forEach(function(playerId){
        var player = d('div', {
          id: "userId-"+data.players[playerId].name,
          class: "display-player"
        })
        .css("border-color", getResultColor(data.players[playerId]))
        .append(
          d('div', { class: 'display-player-name' })
            .text(data.players[playerId].name)
            .css("color", getResultColor(data.players[playerId])),
          d('div', { class: 'display-player-increment' })
            .text(data.players[playerId].increment)
        );
        out.append(player);
      });
      return out;
    },
    topAnswer: function(data) {
      var out = d('div', { id: 'display-popular' });
      if (data.tiedScoreCounter > 1) {
        out.append(
          d('div', { class: 'display-popular-header' })
            .text("Even split. No points! No majority!"));
      } else {
        var answer = d('div', { class: 'display-popular-top' })
          .text(data.topAnswer);
        out.append(
          d('div', { class: 'display-popular-header' })
            .text("The most popular answer was")
        .append(answer));
      }
      return out;
    },
    winner: function(data) {
      var out = d('div', { id: 'display-winner' });
      var playerIds = Object.keys(data.players);
      var winner = "";
      var highestScore = 0;
      playerIds.forEach(function(playerId){
        if (data.players[playerId].score > highestScore) {
          highestScore = data.players[playerId].score;
          winner = data.players[playerId].name;
        }
      });
      out.text("The winner is " + winner + " with a score of " + highestScore);
      if (highestScore === 0) {
        out.text("Ugh, it was a tie... Lame.");
      }
      return out;
    },
    gameStartBtn: function() {
      return d('div', { id: 'game-start-btn' })
        .text("Start Game.")
        .on('click', function() { socket.emit('attemptGameStart', { room: user.room }); });
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
      return d('div', { id: "countdown-timer" })
        .append(
          d('span', { class: 'countdown-timer-msg' })
            .text(msg),
          d('span', { id: "countdown-timer-num" })
            .text(seconds)
        );
    },
    homeBtn: function(label) {
      return d('a', { href: "/" }).text(label);
    }
  }
};

});