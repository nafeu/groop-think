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
var onlineUsers = $("#online-users");
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
  sendChatMessage(msg);
});

usernameBox.enterKey(function(){
  var name = usernameBox.val().trim();
  registerUser(name);
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

socket.on('updateOnlineUsers',function(){
  handleUpdateOnlineUsers();
});

socket.on('printText', function(data){
  var out = "";
  switch (data.type) {
    case "chat":
      out = data.user.name + ": " + data.message;
      printMessage(cleanInput(out));
      break;
    case "update":
      out = data.text;
      printMessage(cleanInput(out));
      break;
  }
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
function handleUpdateOnlineUsers() {
  console.log("!! handling event: [ update online users ] !! :");
  var names = "";
  $.each(clientData, function(key){
    names += clientData[key].name + ", ";
  });
  onlineUsers.html(names.substr(0, names.length-2));
  // onlineUsers.html(data);
}

function printMessage(message) {
  body.append($("<p></p>").text(message));
}

// ---------------------------------------------------------------------------------------
// Event Emitters
// ---------------------------------------------------------------------------------------
function registerUser(name) {
  var action = true;
  $.each(clientData, function(key){
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
    console.log("<< emitting event: [ registering user ] >> :", user.name );
    socket.emit('registerUser', {
      name: name
    });
    $("#login").hide();
    $("#content").show();
  }
}

function sendChatMessage(msg) {
  console.log("<< emitting event: [ send message ] >> :", socket.id, user, msg);
  socket.emit('sendChatMessage', { type: "chat", user: user, message: msg });
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

function cleanInput (input) {
    return $('<div/>').text(input).text();
}


// ---------------------------------------------------------------------------------------
}); // Document Ready - End
// ---------------------------------------------------------------------------------------