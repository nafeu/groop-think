$(function(){
console.log("Loading: ui-renderer");

// UI Rendering
UI = {
  render: function(data) {
    switch (data.method) {
      case "update-online-users":
        onlineUsers.empty();
        if (data.content.length < 7) {
          $.each(data.content, function(index, value){
            var userLabel = $("<span></span>")
              .css("color", getUsernameColor(value))
              .text(value);
            onlineUsers
              .append(userLabel)
              .append("<span class='online-user-sep'>, </span>");
          });
        } else {
          onlineUsers.text(data.content.length);
        }
        break;
      case "print-to-chat":
        if (data.content.type == "update")
          this.printToChat(domFactory.build.updateMessage(data.content));
        if (data.content.type == "chat")
          this.printToChat(domFactory.build.chatMessage(data.content));
        break;
      case "typing-update":
        chatUserTyping.text(data.content);
        break;
      case "add-class":
        $(data.content.id).addClass(data.content.class);
        break;
      case "game-state":
        var gameState = data.content;
        if (gameState.phase == "start") {
          user.active = true;
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
  displayStatusMessage: function(data) {
    statusMessage
      .css("color", data.color)
      .text(data.message);
  },
  printToChat: function(data) {
    chat.append(data);
    chat.scrollTop(chat[0].scrollHeight);
  }
};

});