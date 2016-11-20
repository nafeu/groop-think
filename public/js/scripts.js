// ---------------------------------------------------------------------------------------
// Variable Instantation
// ---------------------------------------------------------------------------------------
var socket = io();
var user = {
  name: "",
  room: "",
  active: false
};
var COLORS = [
  '#922B21', '#B03A2E', '#76448A', '#6C3483',
  '#1F618D', '#2874A6', '#148F77', '#117A65',
  '#1E8449', '#239B56', '#B7950B', '#AF601A'
];

// ---------------------------------------------------------------------------------------
$(function(){ // Document Ready - Start
// ---------------------------------------------------------------------------------------

// DOM References
var body = $("#content");
var login = $("#login");
var room = $("#room");
var gameArea = $("#game-area");
var chat = $("#chat");
var onlineUsers = $("#online-users");
var chatBox = $("#chat-box");
var usernameBox = $("#username-box");
var usernameWarn = $("#username-warn");
var roomBox = $("#room-box");
var roomWarn = $("#room-warn");
var roomCreate = $("#room-create-btn");
var roomInfoBar = $("#room-info-bar");
var roomInfoNotice = $("#room-info-notice");
var roomInfoUrl = $("#room-info-url");
var roomJoin = $("#room-join-btn");

// UI Rendering
var UI = {
  render: function(data) {
    console.log("RENDER : ", data);
    switch (data.method) {
      case "update-online-users":
        onlineUsers.empty();
        $.each(data.content, function(index, value){
          var userLabel = $("<span></span>")
            .css("color", getUsernameColor(value))
            .text(value);
          onlineUsers
            .append(userLabel)
            .append("<span class='online-user-sep'>, </span>");
        });
        break;
      case "print-to-chat":
        if (data.content.type == "update")
          UI.printToChat(domFactory.build.updateMessage(data.content));
        if (data.content.type == "chat")
          UI.printToChat(domFactory.build.chatMessage(data.content));
        break;
      case "add-class":
        $(data.content.id).addClass(data.content.class);
        break;
      case "game-state":
        var gameState = data.content;
        if (gameState.phase == "start") {
          user.active = true;
          console.log(user);
          gameArea.empty();
          gameArea.append(domFactory.build.startingDisplay(gameState));
        }
        if (gameState.phase == "question") {
          gameArea.empty();
          gameArea.append(domFactory.build.questionDisplay(gameState));
          $.each(gameState.players, function(key){
            if (gameState.players[key].choice !== null) {
              $("#userId-"+gameState.players[key].name).addClass("submittedAnswer");
            }
          });
        }
        if (gameState.phase == "result") {
          console.log("calling result block... : ", user.name);
          gameArea.empty();
          gameArea.append(domFactory.build.resultDisplay(gameState));
          var counter = parseInt($("#countdown-timer-num").text());
          var interval = setInterval(function() {
            if (counter == 1) {
              clearInterval(interval);
            }
            counter--;
            $("#countdown-timer-num").text(counter);
          }, 1000);
        }
        if (gameState.phase == "end") {
          user.active = false;
          gameArea.empty();
          gameArea.append(domFactory.build.endingDisplay(gameState));
        }
        break;
    }
  },
  displayUsernameWarn: function(warning) {
    usernameWarn
      .css("color", warning.color)
      .text(warning.message);
  },
  displayRoomWarn: function(warning) {
    roomWarn
      .css("color", warning.color)
      .text(warning.message);
  },
  printToChat: function(data) {
    chat.append(data);
    chat.scrollTop(chat[0].scrollHeight);
  }
};

var domFactory = {
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
        .append(domFactory.assets.nextBtn("Click to start game!"));
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
          if (data.questionIdx == data.gameLength)
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
      return $("<div></div>").attr("id", "display-question").text(data.currQuestion.q);
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
          .css("border-color", getUsernameColor(data.players[playerIds[i]].name))
          .append(
            $("<div></div>")
              .addClass("display-player-name")
              .text(data.players[playerIds[i]].name)
              .css("color", getUsernameColor(data.players[playerIds[i]].name)))
          .append(
            $("<div></div>")
              .addClass("display-player-increment")
              .text(data.players[playerIds[i]].increment));
        out.append(player);
      }
      return out;
    },
    topAnswer: function(data) {
      var answer = $("<div></div>")
        .addClass("display-popular-top")
        .text(data.topAnswer);
      return $("<div></div>")
        .attr("id", "display-popular")
        .append(
          $("<div></div>")
            .addClass("display-popular-header")
            .text("The most popular answer was")
        .append(answer));
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

// Setup UI
$(window).resize(function () {
  updateChatBoxSize();
});

// Default User Actions
var queryVars = $.parseQuery();
console.log(queryVars);
if (queryVars.room) {
  $.post("/api/rooms/join", { room: queryVars.room }).done(function(data){
    if (data.exists) {
      user.room = queryVars.room;
      showRegistration();
    } else {
      UI.displayRoomWarn({
        color: "purple",
        message: 'Room "' + queryVars.room + '" does not exist, please enter a correct room id.'
      });
      room.show();
    }
  });
} else {
  room.show();
}

// ---------------------------------------------------------------------------------------
// DOM Event Handlers
// ---------------------------------------------------------------------------------------
usernameBox.on('input', function(){
  if (usernameBox.val().length > 20) {
    UI.displayUsernameWarn({
      color: "#CB4335",
      message: "Sorry, your name is too long"
    });
  } else {
    usernameWarn.html("");
  }
});

roomCreate.click(function(){
  $.get("/api/rooms/create").done(function(data){
    user.room = data.room;
    showRegistration();
  });
});

roomBox.enterKey(function(){
  attemptRoomJoin();
});

roomJoin.click(function(){
  attemptRoomJoin();
});

roomBox.on('input', function(){
  roomWarn.html("");
});

usernameBox.enterKey(function(){
  registerUser(usernameBox.val().trim());
});

chatBox.enterKey(function(){
  var msg = chatBox.val();
  chatBox.val('');
  if (msg.trim() !== "") {
    socket.emit('printToChat', { type: "chat", user: user, message: msg });
  }
});

// ---------------------------------------------------------------------------------------
// Socket Event Handlers
// ---------------------------------------------------------------------------------------
socket.on('render', function(data){ UI.render(data); });

// ---------------------------------------------------------------------------------------
// Event Emitters
// ---------------------------------------------------------------------------------------
function registerUser(name) {
  $.post('/api/users/validate', { name: name }).done(function(data){
    if (data.valid) {
      user.name = name;
      socket.emit('registerUser', {
        name: user.name,
        room: user.room
      });
      var gameUrl = location.host + location.pathname + "?room=" + user.room;
      roomInfoUrl.text(location.protocol + "//" + gameUrl);
      roomInfoNotice.text("Invite your friends! Share this link: ");
      roomInfoBar.click(function(){
        copyToClipboard(roomInfoUrl);
        roomInfoNotice.text("Invite your friends! Copied to clipboard. ");
      });
      if ($.parseQuery.room != user.room)
        window.history.pushState('', 'Title', '/?room='+user.room);
      // update the gameUrl
      showContent();
      updateChatBoxSize();
    } else {
      UI.displayUsernameWarn({
        color: data.color,
        message: data.message
      });
    }
  });
}

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------
function updateChatBoxSize() {
  chat.css("height", (chatBox.offset().top - (onlineUsers.height() + 40) - 40));
}

function showRegistration() {
  room.hide();
  login.show();
  usernameBox.focus();
}

function showContent() {
  login.hide();
  body.show();
  chatBox.focus();
}

function getUsernameColor(username) {
  // Compute hash code
  var hash = 7;
  for (var i = 0; i < username.length; i++) {
     hash = username.charCodeAt(i) + (hash << 5) - hash;
  }
  // Calculate color
  var index = Math.abs(hash % COLORS.length);
  return COLORS[index];
}

function copyToClipboard(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}

function attemptRoomJoin() {
  var roomId = roomBox.val().trim();
  $.post("/api/rooms/join", { room: roomId }).done(function(data){
    if (data.exists) {
      user.room = roomId;
      showRegistration();
    } else {
      UI.displayRoomWarn({
        color: "purple",
        message: "That room does not exist."
      });
    }
  });
}



// ---------------------------------------------------------------------------------------
}); // Document Ready - End
// ---------------------------------------------------------------------------------------

// Sandbox
function apiTest() {
  $.get( "api/users", function( data ) {
    console.log("API CALL [ USERS ] : ", data);
  });
}
