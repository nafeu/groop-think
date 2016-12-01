$(function(){
console.log("Loading: dom-events");

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

});