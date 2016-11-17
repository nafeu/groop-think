// ---------------------------------------------------------------------------------------
// Variable Instantation
// ---------------------------------------------------------------------------------------
var socket = io();
var user = {
  name: "",
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
var gameArea = $("#game-area");
var chat = $("#chat");
var onlineUsers = $("#online-users");
var chatBox = $("#chat-box");
var usernameBox = $("#username-box");
var usernameWarn = $("#username-warn");

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
          gameArea.empty();
          gameArea.append(
            $("<h1></h1>")
              .text("Click here to start game!")
              .click(function(){
                socket.emit("nextState");
              })
          );
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
        }
        break;
    }
  },
  displayWarning: function(warning) {
    usernameWarn
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
    questionDisplay: function(data) {
      var out = $("<div></div>").attr("id", "game-board");
      var question = $("<div></div>").attr("id", "display-question");
      var answers = $("<div></div>").attr("id", "display-answers");
      var players = $("<div></div>").attr("id", "display-players");

      // Question segment
      question.text(data.currQuestion.q);

      // Answer segment
      var choices = data.currQuestion.a;
      for (var i = 0; i < choices.length; i++) {
        var choice = $("<div></div>")
          .addClass("display-choice")
          .text(choices[i])
          .attr("onclick", "socket.emit('submitAnswer', { 'answer' : " + i + "})");
        answers.append(choice);
      }

      // Player segment
      var playerIds = Object.keys(data.players);
      for (var j = 0; j < playerIds.length; j++) {
        var player = $("<div></div>")
          .addClass("display-player")
          .attr("id", "userId-"+data.players[playerIds[j]].name)
          .text(data.players[playerIds[j]].name)
          .css("color", getUsernameColor(data.players[playerIds[j]].name));
        players.append(player);
      }

      return out
        .append(question)
        .append(answers)
        .append(players);

    },
    resultDisplay: function(data) {
      return $("<h1></h1>").text("The most popular answer was '" + data.topAnswer + "'");
    }
  }
};

// Setup UI
$(window).resize(function () {
  updateChatBoxSize();
});

// Default User Actions
usernameBox.focus();

// ---------------------------------------------------------------------------------------
// DOM Event Handlers
// ---------------------------------------------------------------------------------------
usernameBox.on('input', function(){
  if (usernameBox.val().length > 20) {
    UI.displayWarning({
      color: "#CB4335",
      message: "Sorry, your name is too long"
    });
  } else {
    usernameWarn.html("");
  }
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
        name: name
      });
      showContent();
      updateChatBoxSize();
      chatBox.focus();
    } else {
      UI.displayWarning({
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

function showContent() {
  login.fadeOut();
  body.fadeIn();
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

// ---------------------------------------------------------------------------------------
}); // Document Ready - End
// ---------------------------------------------------------------------------------------

// Sandbox
function apiTest() {
  $.get( "api/users", function( data ) {
    console.log("API CALL [ USERS ] : ", data);
  });
}
