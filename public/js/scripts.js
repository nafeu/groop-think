// ---------------------------------------------------------------------------------------
// Socket Reference Instantiation
// ---------------------------------------------------------------------------------------
var socket = io();

// ---------------------------------------------------------------------------------------
$(function(){ // Document Ready - Start
// ---------------------------------------------------------------------------------------

// DOM Reference Instantiation
var body = $("#content");
// var numRooms = $("#num-rooms");
var numClients = $("#num-clients");
var chatBox = $("#chat-box");

// ---------------------------------------------------------------------------------------
// DOM Event Handlers
// ---------------------------------------------------------------------------------------
chatBox.enterKey(function(){
  var msg = chatBox.val();
  chatBox.val('');
  sendMessage(msg);
});

// ---------------------------------------------------------------------------------------
// Socket Event Handler Dispatcher
// ---------------------------------------------------------------------------------------
socket.on('updateNumClients',function(data){
  handleUpdateNumClients(data);
});

socket.on('connectToRoom', function(data){
  handleConnectToRoom(data);
});

socket.on('updateMessages', function(data){
  printMessage(data);
});

// ---------------------------------------------------------------------------------------
// Socket Event Handlers - Functional
// ---------------------------------------------------------------------------------------
function handleConnectToRoom(data) {
  console.log("<< handling event: [ connect to room ] >> :", data);
  // numRooms.html(data.desc);
}

// ---------------------------------------------------------------------------------------
// Socket Event Handlers - UI
// ---------------------------------------------------------------------------------------
function handleUpdateNumClients(data) {
  console.log("<< handling event: [ update num clients ] >> :", data);
  numClients.html(data);
}

function printMessage(msg) {
  body.append($("<p></p>").text(msg));
}

// ---------------------------------------------------------------------------------------
// Event Emitters
// ---------------------------------------------------------------------------------------
function sendMessage(msg) {
  socket.emit('sendMessage', msg);
}

// ---------------------------------------------------------------------------------------
}); // Document Ready - End
// ---------------------------------------------------------------------------------------