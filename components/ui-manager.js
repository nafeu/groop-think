module.exports = function(serverData, io, debug){
  return {
    updateUsers: function(room) {
      var onlineUsers = [];
      var clients = [];
      Object.keys(serverData.clientData).forEach(function(cid){
        if (serverData.clientData[cid].room == room) {
          clients.push(cid);
        }
      });
      for (var i = 0; i < clients.length; i++) {
        onlineUsers.push(serverData.clientData[clients[i]].name);
      }
      io.sockets.to(room).emit('render', {
        method: "update-online-users",
        content: onlineUsers
      });
    },
    printToChat: function(room, data) {
      io.sockets.to(room).emit('render', {
        method: "print-to-chat",
        content: data
      });
    },
    renderState: function(room) {
      io.sockets.to(room).emit('render', {
        method: "game-state",
        content: serverData.rooms[room]
      });
    }
  };
};