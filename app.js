var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
io.set('heartbeat timeout', 4000);
io.set('heartbeat interval', 2000);

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
saveClient(socket);
socket.emit('persistClientData', serverData.clientData);

// ---------------------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------------------
socket.on('registerUser', function(data){
  serverData.clientData[socket.id] = data;
  broadcastPersistClientData(serverData.clientData);
  broadcastUserConnected(data);
});

socket.on('disconnect', function(){
  var user = serverData.clientData[socket.id];
  if (user) broadcastUserDisconnect(user);
  else broadcastUserDisconnect({ name: "a user" });
  removeClient(socket);
  broadcastPersistClientData(serverData.clientData);
});

socket.on('sendChatMessage', function(data){
  broadcastPrintText(data);
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
function broadcastUserConnected(user) {
  io.sockets.emit('userConnected', user.name);
  io.sockets.emit('printText', { type: "update", text: user.name + " has connected!"});
  io.sockets.emit('updateOnlineUsers');
}

function broadcastUserDisconnect(user) {
  io.sockets.emit('userDisconnected', user.name);
  io.sockets.emit('printText', { type: "update", text: user.name + " has disconnected!"});
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
  console.log("<< new connection client >> : ", socket.id);
  serverData.sockets[socket.id] = socket;
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

