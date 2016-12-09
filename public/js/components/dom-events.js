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
  statusMessage.html("");
});

usernameBox.enterKey(function(){
  registerUser(usernameBox.val().trim());
});

chatBox.enterKey(function(){
  var msg = chatBox.val();
  chatBox.val('');
  if (msg.length > 0)
    socket.emit('printToChat', { type: "chat", user: user, message: msg });
  if (user.isTyping) {
    socket.emit("userStoppedTyping", { room: user.room, name: user.name });
    user.isTyping = false;
  }
});

chatBox.keyup(function(){
  if (!user.isTyping && chatBox.val().length > 0) {
    socket.emit("userStartedTyping", { room: user.room, name: user.name });
    user.isTyping = true;
  }
  else if (user.isTyping && chatBox.val().length < 1) {
    socket.emit("userStoppedTyping", { room: user.room, name: user.name });
    user.isTyping = false;
  }
});

// chatBox.blur(function(){
// });

}); // Document Ready End
