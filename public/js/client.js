// ---------------------------------------------------------------------------------------
// Variable Instantation
// ---------------------------------------------------------------------------------------
var socket = io({
  'reconnection': false
});

var user = {
  name: "",
  room: "",
  active: false,
  isTyping: false,
  isHost: false
};

var COLORS = [
  '#1abc9c', '#3498db', '#9b59b6',
  '#f1c40f', '#e67e22', '#446CB3',
  '#87D37C', '#D35400', '#F1A9A0',
  '#F2784B', '#4ECDC4', '#1E824C',
  '#52B3D9', '#1F3A93', '#F4D03F'
];

// DOM Vars
var body,
  login,
  room,
  chat,
  onlineUsers,
  chatBox,
  chatUserTyping,
  usernameBox,
  usernameWarn,
  usernameConfirm,
  roomBox,
  statusMessage,
  roomCreate,
  roomInfoBar,
  roomInfoNotice,
  roomInfoUrl,
  roomJoin,
  gameArea;

// Component Vars
var UI, domFactory, queryVars;

// ---------------------------------------------------------------------------------------
$(function(){ // Document Ready - Start
// ---------------------------------------------------------------------------------------
console.log("Loading: client");

// DOM References
body = $("#content");
login = $("#login");
room = $("#room");
chat = $("#chat");
onlineUsers = $("#online-users");
chatBox = $("#chat-box");
chatUserTyping = $("#chat-user-typing");
usernameBox = $("#username-box");
usernameWarn = $("#username-warn");
usernameConfirm = $("#username-confirm");
roomBox = $("#room-box");
statusMessage = $("#status-message");
roomCreate = $("#room-create-btn");
roomInfoBar = $("#room-info-bar");
roomInfoNotice = $("#room-info-notice");
roomInfoUrl = $("#room-info-url");
roomJoin = $("#room-join-btn");
gameArea = $("#game-area");

// Setup UI
$(window).resize(function () {
  updateChatBoxSize();
});

// Default User Actions
queryVars = $.parseQuery();
if (queryVars.room) {
  $.post("/api/rooms/join", { room: queryVars.room }).done(function(data){
    if (data.joinable) {
      user.room = queryVars.room;
      showRegistration();
    } else {
      UI.displayStatusMessage({
        color: "purple",
        message: 'Room "' + queryVars.room + '" ' + data.message
      });
      room.show();
    }
  });
} else {
  room.show();
}

// ---------------------------------------------------------------------------------------
}); // Document Ready - End
// ---------------------------------------------------------------------------------------