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

var gameState = {
  "phase": "start",
  "currQuestion": {},
  "numActive": 0,
  "numAnswers": 0,
  "winner": null,
  "players": {
    // Iterate through client data and fill with
    // socketid _ username
    //         |_ score
    //         |_ choice
  },
};

var questions = [
  {
    "question": "What is the best?",
    "answers": [
      "answer a",
      "answer b"
    ]
  },
  {
    "question": "What is the worst?",
    "answers": [
      "answer c",
      "answer d"
    ]
  }
];

var gameState = {
  next: function(){
    switch (gameState.phase) {
      case "start":

        break;
      case "question":

        break;
      case "result":

        break;
      case "end":

        break;
    }
  },
  get: function(){
    switch (gameState.phase) {
      default:
        break;
    }
  }
};

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

function broadcastRender(data) {
  io.sockets.emit('render', data);
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
  socket.emit('render', gameState);
});

socket.on('disconnect', function(){
  var user = serverData.clientData[socket.id];
  removeClient(socket);
  broadcastPersistClientData(serverData.clientData);
  if (user) broadcastUserDisconnect(user);
  else broadcastUserDisconnect({ name: "a user" });
});

socket.on('sendChatMessage', function(data){
  broadcastPrintText(data);
});

socket.on('nextGameState', function(){
  gameState.next();
});

// ---------------------------------------------------------------------------------------
// Event Emitters
// ---------------------------------------------------------------------------------------
// ...

// ---------------------------------------------------------------------------------------
}); // IO Socket Connection End
// ---------------------------------------------------------------------------------------



// ---------------------------------------------------------------------------------------
// Server Config
// ---------------------------------------------------------------------------------------
http.listen(3000, function(){
  console.log('listening on localhost:3000');
});

// ---------------------------------------------------------------------------------------
// Game Logic
// ---------------------------------------------------------------------------------------


