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