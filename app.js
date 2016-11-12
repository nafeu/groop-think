var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


// Routing
app.use(express.static(__dirname + '/public'));

var numClients = 0;
var numRooms = 1;

io.on('connection', function(socket){

  // console.log(io.nsps['/'].adapter.rooms);
  // if(io.nsps['/'].adapter.rooms["room-" + numRooms] && io.nsps['/'].adapter.rooms["room-" + numRooms].length > 1)
  //   numRooms++;
  // socket.join("room-" + numRooms);

  // //Send this event to everyone in the room.
  // io.sockets.in("room-" + numRooms).emit('connectToRoom', { desc: "You are in room no. " + numRooms });

  // Broadcast user connection message and information
  broadcastUserConnected();

  // Broadcast user disconnection message
  broadcastUserDisconnect(socket);

});

http.listen(3000, function(){
  console.log('listening on localhost:3000');
});

// Helpers
function broadcastUserConnected() {
  numClients++;
  io.sockets.emit('updateNumClients', numClients);
}

function broadcastUserDisconnect(socket) {
  socket.on('disconnect', function () {
    numClients--;
    io.sockets.emit('updateNumClients', numClients);
  });
}