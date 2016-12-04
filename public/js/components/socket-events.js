console.log("Loading: socket-events");

// ---------------------------------------------------------------------------------------
// Socket Event Handlers
// ---------------------------------------------------------------------------------------
socket.on('render', function(data){ UI.render(data); });

socket.on('disconnect', function(){
  UI.render({ method: "disconnect" });
  UI.render({
    method: "print-to-chat",
    content: {
      type: "update",
      text: "You have lost connection to the server..."
    }
  });
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