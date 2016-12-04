console.log("Loading: helpers");

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------
function updateChatBoxSize() {
  chat.css("height", (chatBox.offset().top - (onlineUsers.height() + 40) - 80));
}

function showRegistration() {
  room.hide();
  login.show();
  usernameBox.focus();
}

function showContent() {
  login.hide();
  body.show();
  chatBox.focus();
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

function copyToClipboard(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}

function getResultColor(player) {
  if (player) {
    if (player.points)
      return "green";
    else
      return "red";
  }
  return "purple";
}

function attemptRoomJoin() {
  var roomId = roomBox.val().trim();
  $.post("/api/rooms/join", { room: roomId }).done(function(data){
    if (data.exists) {
      user.room = roomId;
      showRegistration();
    } else {
      UI.displayRoomWarn({
        color: "purple",
        message: "That room does not exist."
      });
    }
  });
}

function registerUser(name) {
  $.post('/api/users/validate', { name: name }).done(function(data){
    if (data.valid) {
      user.name = name;
      socket.emit('registerUser', {
        name: user.name,
        room: user.room
      });
      var gameUrl = location.host + location.pathname + "?room=" + user.room;
      roomInfoUrl.text(location.protocol + "//" + gameUrl);
      roomInfoNotice.text("Invite your friends! Share this link: ");
      roomInfoBar.click(function(){
        copyToClipboard(roomInfoUrl);
        roomInfoNotice.text("Invite your friends! Copied to clipboard. ");
      });
      if ($.parseQuery.room != user.room)
        window.history.pushState('', 'Title', '/?room='+user.room);
      // update the gameUrl
      showContent();
      updateChatBoxSize();
    } else {
      UI.displayUsernameWarn({
        color: data.color,
        message: data.message
      });
    }
  });
}
