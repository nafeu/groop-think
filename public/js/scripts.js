// ---------------------------------------------------------------------------------------
// Socket Reference Instantiation
// ---------------------------------------------------------------------------------------
var socket = io();
var clientData = {};
var user = {
  name: "",
};

// ---------------------------------------------------------------------------------------
$(function(){ // Document Ready - Start
// ---------------------------------------------------------------------------------------

// DOM Reference Instantiation
var body = $("#content");
var numClients = $("#num-clients");
var chatBox = $("#chat-box");
var usernameBox = $("#username-box");

// ---------------------------------------------------------------------------------------
// DOM Event Handlers
// ---------------------------------------------------------------------------------------
chatBox.enterKey(function(){
  var msg = chatBox.val();
  chatBox.val('');
  sendMessage(msg);
});

usernameBox.enterKey(function(){
  var newName = usernameBox.val();
  updateUsername(newName);
});

// ---------------------------------------------------------------------------------------
// Socket Event Handler Dispatcher
// ---------------------------------------------------------------------------------------
socket.on('updateNumClients',function(data){
  handleUpdateNumClients(data);
});

socket.on('updateMessages', function(data){
  printMessage(data);
});

// ---------------------------------------------------------------------------------------
// Socket Event Handlers - Functional
// ---------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------
// Socket Event Handlers - UI
// ---------------------------------------------------------------------------------------
function handleUpdateNumClients(data) {
  console.log("<< handling event: [ update num clients ] >> :", data);
  numClients.html(data);
}

function printMessage(data) {
  body.append($("<p></p>").text(data.message));
}

// ---------------------------------------------------------------------------------------
// Event Emitters
// ---------------------------------------------------------------------------------------
function sendMessage(msg) {
  console.log("<< emitting event: [ send message ] >> :", socket.id, user, msg);
  socket.emit('sendMessage', { id: socket.id, user: user, message: msg });
}

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------
// function createPayload(data) {
//   return {
//     id: socket.id,
//     user: user,
//     data: data
//   };
// }


// ---------------------------------------------------------------------------------------
}); // Document Ready - End
// ---------------------------------------------------------------------------------------