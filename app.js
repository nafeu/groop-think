var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


// Routing
app.use(express.static(__dirname + '/public'));

var clients = 0;

io.on('connection', function(socket){

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
  clients++;
  io.sockets.emit('broadcast', { description: clients + ' clients connected!' });
}

function broadcastUserDisconnect(socket) {
  socket.on('disconnect', function () {
    clients--;
    io.sockets.emit('broadcast',{ description: clients + ' clients connected!'});
  });
}