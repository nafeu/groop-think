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
  isTyping: false
};

var COLORS = [
  '#922B21', '#B03A2E', '#76448A', '#6C3483',
  '#1F618D', '#2874A6', '#148F77', '#117A65',
  '#1E8449', '#239B56', '#B7950B', '#AF601A'
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
  roomBox,
  roomWarn,
  roomCreate,
  roomInfoBar,
  roomInfoNotice,
  roomInfoUrl,
  roomJoin,
  gameArea;

// Component Vars
var UI, domFactory;

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
roomBox = $("#room-box");
roomWarn = $("#room-warn");
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
var queryVars = $.parseQuery();
if (queryVars.room) {
  $.post("/api/rooms/join", { room: queryVars.room }).done(function(data){
    if (data.joinable) {
      user.room = queryVars.room;
      showRegistration();
    } else {
      UI.displayRoomWarn({
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