// ---------------------------------------------------------------------------------------
// Variable Instantation
// ---------------------------------------------------------------------------------------
var socket = io();
var clientData = {};
var user = {
  name: "",
};
var COLORS = [
  '#922B21', '#B03A2E', '#76448A', '#6C3483',
  '#1F618D', '#2874A6', '#148F77', '#117A65',
  '#1E8449', '#239B56', '#B7950B', '#AF601A'
];

// ---------------------------------------------------------------------------------------
$(function(){ // Document Ready - Start
// ---------------------------------------------------------------------------------------

// DOM Reference Instantiation
var body = $("#content");
var chat = $("#chat");
var onlineUsers = $("#online-users");
var chatBox = $("#chat-box");
var usernameBox = $("#username-box");
var usernameWarn = $("#username-warn");
// var userName = $("#user-name");

// Update DOM
// userName.text(user.name);

// Setup UI
$(window).resize(function () {
  chat.css("height", (chatBox.offset().top - (onlineUsers.height() + 40) - 40));
});

// Default User Actions
usernameBox.focus();


// ---------------------------------------------------------------------------------------
// DOM Event Handlers
// ---------------------------------------------------------------------------------------
usernameBox.on('input', function(){
  console.log("username box changed...");
  if (usernameBox.val().length > 20) {
    displayWarning({
      color: "#CB4335",
      text: "Sorry, your name is too long"
    });
  } else {
    usernameWarn.html("");
  }
});

usernameBox.enterKey(function(){
  var name = usernameBox.val().trim();
  if (validateName(name)) {
    registerUser(name);
  }
});

chatBox.enterKey(function(){
  var msg = chatBox.val();
  chatBox.val('');
  if (msg.trim() !== "") {
    sendChatMessage(msg);
  }
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
  switch (data.type) {
    case "chat":
      printMessage(buildChatMessage(data));
      break;
    case "update":
      printMessage(buildUpdateMessage(data));
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
  onlineUsers.empty();
  var names = "";
  $.each(clientData, function(key){
    names += clientData[key].name + ", ";
    var userLabel = $("<span></span>")
      .css("color", getUsernameColor(clientData[key].name))
      .text(clientData[key].name);
    onlineUsers
      .append(userLabel)
      .append("<span class='online-user-sep'>, </span>");
  });

}

function printMessage(messageObj) {
  chat.append(messageObj);
  chat.scrollTop(chat[0].scrollHeight);
}

// ---------------------------------------------------------------------------------------
// Event Emitters
// ---------------------------------------------------------------------------------------
function registerUser(name) {
  // Update local data
  user.name = name;
  // Inform Server
  console.log("<< emitting event: [ registering user ] >> :", user.name );
  socket.emit('registerUser', {
    name: name
  });
  showContent();
  updateChatBoxSize();
}

function sendChatMessage(msg) {
  console.log("<< emitting event: [ send message ] >> :", socket.id, user, msg);
  socket.emit('sendChatMessage', { type: "chat", user: user, message: msg });
}

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------
function cleanInput (input) {
    return $('<div/>').text(input).text();
}

function displayWarning(warning) {
  usernameWarn
    .css("color", warning.color)
    .text(warning.text);
}

function validateName(name) {
  var valid = true;
  $.each(clientData, function(key){
    if (clientData[key].name == name) {
      displayWarning({
        color: "#D35400",
        text: "That name is already taken."
      });
      valid = false;
    }
  });
  if (name.length > 20) {
    valid = false;
  }
  return valid;
}

function buildChatMessage(data) {
  var name = $("<span></span>")
    .addClass("chat-name")
    .css("color", getUsernameColor(data.user.name))
    .text(data.user.name);
  var message = $("<span></span>")
    .addClass("chat-message-text")
    .text(data.message);
  return $("<p></p>")
    .addClass("chat-message")
    .append(name)
    .append(": ")
    .append(message);
}

function buildUpdateMessage(data) {
  var update = $("<span></span>")
    .addClass("chat-update-text")
    .text(data.text);
  return $("<p></p>")
    .addClass("chat-update")
    .append(update);
}

function updateChatBoxSize() {
  chat.css("height", (chatBox.offset().top - (onlineUsers.height() + 40) - 40));
}

function showContent() {
  $("#login").fadeOut();
  $("#content").fadeIn();
}

function getUsernameColor(username) {
  // Compute hash code
  var hash = 7;
  for (var i = 0; i < username.length; i++) {
     hash = username.charCodeAt(i) + (hash << 5) - hash;
  }
  // Calculate color
  var index = Math.abs(hash % COLORS.length);
  return COLORS[index];
}

// ---------------------------------------------------------------------------------------
}); // Document Ready - End
// ---------------------------------------------------------------------------------------