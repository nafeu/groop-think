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
var userName = $("#user-name");

// Update DOM
userName.text(user.name);


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
socket.on('userConnected', function(data){
  console.log(">> A user connected! << : ", data);
});

socket.on('userDisconnected', function(data){
  console.log(">> A user disconnected! << : ", data);
});

socket.on('initializeUser', function(data){
  console.log(">> init user << : ", data);
  user = data;
  userName.text(user.name);
});

socket.on('updateNumClients',function(data){
  handleUpdateNumClients(data);
});

socket.on('updateMessages', function(data){
  printMessage(data);
});

socket.on('persistClientData', function(data){
  clientData = data;
  console.log(">> persisting client data << : ", clientData);
});

// ---------------------------------------------------------------------------------------
// Socket Event Handlers - Functional
// ---------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------
// Socket Event Handlers - UI
// ---------------------------------------------------------------------------------------
function handleUpdateNumClients(data) {
  console.log("!! handling event: [ update num clients ] !! :", data);
  numClients.html(data);
}

function printMessage(data) {
  body.append($("<p></p>").text(data.user.name + ": " + data.message));
}

// ---------------------------------------------------------------------------------------
// Event Emitters
// ---------------------------------------------------------------------------------------
function sendMessage(msg) {
  console.log("<< emitting event: [ send message ] >> :", socket.id, user, msg);
  socket.emit('sendMessage', { id: socket.id, user: user, message: msg });
}

function updateUsername(name) {
  var action = true;
  $.each(Object.keys(clientData), function(key){
    if (clientData[key].name == name) {
      alert("name is already taken!");
      action = false;
    }
  });
  if (action) {
    // Update local data
    user.name = name;
    // Update UI
    userName.text(name);
    // Inform Server
    console.log("<< emitting event: [ update username ] >> :", socket.id, user );
    socket.emit('updateUsername', { id: socket.id, user: user });
  }
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