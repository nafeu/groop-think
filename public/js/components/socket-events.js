console.log("Loading: socket-events");

// ---------------------------------------------------------------------------------------
// Socket Event Handlers
// ---------------------------------------------------------------------------------------
socket.on('render', function(data){ UI.render(data); });

socket.on('disconnect', function(){
  window.location.href = getStatusUrl("disconnected");
});

socket.on('usersTyping', function(data){
  if ((user.isTyping && data.typing.length == 1) || data.typing.length === 0) {
    UI.render({
      method: "typing-update",
      content: ""
    });
  } else {
    var content = "";
    if (data.typing.length > 1)
      content = "multiple users are typing...";
    else
      content = data.typing[0] + " is typing...";
    UI.render({
      method: "typing-update",
      content: content
    });
  }
});

socket.on('setHost', function(){
  user.isHost = true;
});

socket.on('startGameSuccess', function(data) {
  $("#game-start-btn").text(data.message).unbind('click');
  setTimeout(function(){
    socket.emit('nextState');
  }, 3000);
});

socket.on('startGameFail', function(data) {
  $("#game-start-btn").text(data.message);
});

socket.on('cycleRoomSize', function(data){
  $("#game-settings .room-size-btn").text(data.roomSize);
});

socket.on('cycleGameLength', function(data){
  $("#game-settings .game-length-btn").text(data.gameLength);
});