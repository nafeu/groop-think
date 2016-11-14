var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// ---------------------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------------------
app.use(express.static(__dirname + '/public'));

var serverData = {
  sockets: {},
  clientData: {}
};

// ---------------------------------------------------------------------------------------
io.on('connection', function(socket){ // IO Socket Connection Start
// ---------------------------------------------------------------------------------------

// On User Connect, SAVE, PERSIST, NOTIFY
serverData.numClients++;
saveClient(socket);
broadcastPersistClientData(serverData.clientData);
broadcastUserConnected(socket);

// ---------------------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------------------
socket.on('disconnect', function(){
  serverData.numClients--;
  removeClient(socket);
  broadcastPersistClientData(serverData.clientData);
  broadcastUserDisconnect(socket);
});

socket.on('sendChatMessage', function(data){
  broadcastPrintText(data);
});

socket.on('updateUsername', function(data){
  serverData.clientData[data.id] = data.user;
  // Persist user information across all clients
  broadcastPersistClientData(serverData.clientData);
  io.sockets.emit('updateOnlineUsers');
});
// ---------------------------------------------------------------------------------------
// Event Emitters
// ---------------------------------------------------------------------------------------
// ...

// ---------------------------------------------------------------------------------------
}); // IO Socket Connection End
// ---------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------
// Event Broadcasts
// ---------------------------------------------------------------------------------------
function broadcastUserConnected(socket) {
  io.sockets.emit('userConnected', socket.id);
  io.sockets.emit('printText', { type: "update", text: "a user has connected!"});
  io.sockets.emit('updateOnlineUsers');
}

function broadcastUserDisconnect(socket) {
  io.sockets.emit('userDisconnected', socket.id);
  io.sockets.emit('printText', { type: "update", text: "a user has disconnected!"});
  io.sockets.emit('updateOnlineUsers');
}

function broadcastPrintText(data) {
  io.sockets.emit('printText', data);
}

function broadcastPersistClientData(data) {
  io.sockets.emit('persistClientData', data);
}

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------
function saveClient(socket) {
  console.log("<< saving client >> : ", socket.id);
  serverData.sockets[socket.id] = socket;
  serverData.clientData[socket.id] = { name: socket.id };
  socket.emit("initializeUser", { name: socket.id });
}

function removeClient(socket) {
  console.log("<< removing client >> : ", socket.id);
  delete serverData.sockets[socket.id];
  delete serverData.clientData[socket.id];
}
// ---------------------------------------------------------------------------------------
// Server Config
// ---------------------------------------------------------------------------------------
http.listen(3000, function(){
  console.log('listening on localhost:3000');
});