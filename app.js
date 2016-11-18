var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var io = require('socket.io')(http);
io.set('heartbeat timeout', 4000);
io.set('heartbeat interval', 2000);

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// ---------------------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------------------
app.use(express.static(__dirname + '/public'));

var serverData = {
  sockets: {},
  clientData: {},
  rooms: {}
};

var statePusher = {
  next: function(room) {
    var activePlayers = Object.keys(serverData.rooms[room].players);
    switch (serverData.rooms[room].phase) {
      case "start":
        console.log("CURRENT PHASE", serverData.rooms[room].phase);
        var clientIds = [];
        Object.keys(serverData.clientData).forEach(function(cid){
          if (serverData.clientData[cid].room == room) {
            clientIds.push(cid);
          }
        });
        serverData.rooms[room].numActive = clientIds.length;
        for (var i = 0; i < clientIds.length; i++) {
          var playerObj = {
            name: serverData.clientData[clientIds[i]].name,
            score: 0,
            choice: null,
            increment: null
          };
          serverData.rooms[room].players[clientIds[i]] = playerObj;
        }
        serverData.rooms[room].currQuestion = questions[serverData.rooms[room].questionIdx];
        serverData.rooms[room].questionIdx++;
        console.log("SWITCHING PHASE TO QUESTION");
        serverData.rooms[room].phase = "question";
        break;
      case "question":
        console.log("CURRENT PHASE", serverData.rooms[room].phase);
        var resultCounter = [];
        for (var j = 0; j < serverData.rooms[room].currQuestion.a.length; j++) {
          resultCounter.push(0);
        }
        for (var k = 0; k < activePlayers.length; k++) {
          resultCounter[serverData.rooms[room].players[activePlayers[k]].choice] += 1;
        }
        serverData.rooms[room].topAnswer = serverData.rooms[room].currQuestion.a[indexOfMax(resultCounter)];
        for (var l = 0; l < activePlayers.length; l++) {
          if (serverData.rooms[room].players[activePlayers[l]].choice == indexOfMax(resultCounter)) {
            serverData.rooms[room].players[activePlayers[l]].score += 1;
            serverData.rooms[room].players[activePlayers[l]].increment = "+1";
          } else {
            serverData.rooms[room].players[activePlayers[l]].increment = "-";
          }
        }
        console.log("SWITCHING PHASE TO RESULT");
        serverData.rooms[room].phase = "result";
        break;
      case "result":
        console.log("CURRENT PHASE", serverData.rooms[room].phase);
        if (serverData.rooms[room].questionIdx < questions.length) {
          serverData.rooms[room].currQuestion = questions[serverData.rooms[room].questionIdx];
          serverData.rooms[room].questionIdx++;
          for (var m = 0; m < activePlayers.length; m++) {
            serverData.rooms[room].players[activePlayers[m]].choice = null;
          }
          serverData.rooms[room].numAnswers = 0;
          console.log("SWITCHING PHASE TO QUESTION");
          serverData.rooms[room].phase = "question";
        } else {
          console.log("SWITCHING PHASE TO END");
          serverData.rooms[room].phase = "end";
        }
        break;
      case "end":
        serverData.rooms[room].questionIdx = 0;
        serverData.rooms[room].currQuestion = {};
        serverData.rooms[room].numActive = 0;
        serverData.rooms[room].numAnswers = 0;
        serverData.rooms[room].topAnswer = null;
        serverData.rooms[room].winner = null;
        serverData.rooms[room].players = {};
        serverData.rooms[room].phase = "start";
        break;
    }
    uiManager.renderState(room);
  }
};

var questions = [
  {
    "q": "What is the best fruit?",
    "a": [
      "apple",
      "orange",
      "pineapple"
    ]
  },
  {
    "q": "What is the worst fruit?",
    "a": [
      "durian",
      "kiwi",
      "coconut"
    ]
  },
  {
    "q": "What is the best worst fruit?",
    "a": [
      "applepen",
      "pineapplepen",
      "penpinappleapplepen"
    ]
  }
];

var uiManager = {
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

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------
function saveClient(socket) {
  console.log("<< new connection >> : ", socket.id);
  serverData.sockets[socket.id] = socket;
}

function removeClient(socket) {
  console.log("<< removing client >> : ", socket.id);
  var occupied = serverData.clientData[socket.id];
  if (occupied) {
    if (occupied.room) {
      if (serverData.rooms[occupied.room]) {
        serverData.rooms[occupied.room].numActive--;
        if (serverData.rooms[occupied.room].numActive === 0) {
          delete serverData.rooms[occupied.room];
        }
      }
    }
  }
  delete serverData.sockets[socket.id];
  delete serverData.clientData[socket.id];
}

function getRoom(sid) {
  return serverData.clientData[sid].room;
}

function createGameState() {
  return {
    "phase": "start",
    "questionIdx": 0,
    "currQuestion": {},
    "numActive": 0,
    "numAnswers": 0,
    "topAnswer": null,
    "winner": null,
    "players": {}
  };
}

function indexOfMax(arr) {
  if (arr.length === 0) {
    return -1;
  }
  var max = arr[0];
  var maxIndex = 0;
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }
  return maxIndex;
}

function generateUID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4);
}

// ---------------------------------------------------------------------------------------
io.on('connection', function(socket){ // IO Socket Connection Start
// ---------------------------------------------------------------------------------------

// On User Connect, SAVE, PERSIST, NOTIFY
saveClient(socket);

// ---------------------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------------------
socket.on('registerUser', function(data){
  // TODO: Join a room here using data.room
  if (!(serverData.rooms[data.room])) {
    console.log("Creating game... : ", data.room);
    serverData.rooms[data.room] = createGameState();
  }
  socket.join(data.room);
  serverData.clientData[socket.id] = data;
  socket.emit('render', {
    method: "game-state",
    content: serverData.rooms[data.room]
  });
  uiManager.printToChat(getRoom(socket.id), { type: "update", text: data.name + " has connected!"});
  uiManager.updateUsers(getRoom(socket.id));
  console.log("Added new room : ", serverData.rooms);
});

socket.on('disconnect', function(){
  var user = serverData.clientData[socket.id];
  removeClient(socket);
  if (user) {
    uiManager.printToChat({
      type: "update",
      text: user.name + " has disconnected!"
    });
    uiManager.updateUsers(user.room);
  }
});

socket.on('printToChat', function(data){
  uiManager.printToChat(getRoom(socket.id), data);
});

socket.on('nextState', function(){
  console.log("STATEPUSHER PUSHING ROOM : ", getRoom(socket.id), " for ", socket.id);
  statePusher.next(getRoom(socket.id));
});

socket.on('submitAnswer', function(data){
  console.log("Submitted answer : ", data);
  var room = getRoom(socket.id);
  if (serverData.rooms[room].players[socket.id] && (serverData.rooms[room].players[socket.id].choice === null)) {
    serverData.rooms[room].players[socket.id].choice = data.answer;
    serverData.rooms[room].numAnswers++;
    io.sockets.to(room).emit('render', {
      method: "add-class",
      content: {
        "id": "#userId-"+serverData.rooms[room].players[socket.id].name,
        "class": "submittedAnswer"
      }
    });
  }
  if (serverData.rooms[room].numAnswers == serverData.rooms[room].numActive) {
    statePusher.next(getRoom(socket.id));
  }
});


// ---------------------------------------------------------------------------------------
}); // IO Socket Connection End
// ---------------------------------------------------------------------------------------



// ---------------------------------------------------------------------------------------
// Server Config
// ---------------------------------------------------------------------------------------
http.listen(process.env.PORT || 3000, function(){
  console.log('listening on', http.address().port);
});

// ---------------------------------------------------------------------------------------
// Data API
// ---------------------------------------------------------------------------------------

app.get('/api/users', function(req, res) {
  res.json(serverData.clientData);
});

app.post('/api/users/validate', function(req, res){

  var name = req.body.name;
  valid = true;
  message = "";
  color = "";

  var clients = Object.keys(serverData.clientData);
  for (var i = 0; i < clients.length; i++) {
    if (serverData.clientData[clients[i]].name == name)
      valid = false;
      message = "That name is already taken.";
      color = "green";
  }

  if (req.body.name.length > 20) {
    valid = false;
    message = "Sorry, your name is too long.";
    color = "#CB4335";
  }

  if (req.body.name.length < 2) {
    valid = false;
    message = "Sorry, your name is too short.";
    color = "#CB4335";
  }

  if (req.body.name.length === 0) {
    valid = false;
    message = "At least TRY to enter a name.";
    color = "#CB4335";
  }

  res.json({
    valid: valid,
    message: message,
    color: color
  });

});

app.get('/api/rooms/create', function(req, res) {
  var room = generateUID();
  res.json({ room: room });
});

app.post('/api/rooms/join', function(req, res) {
  var exists = false;
  if (serverData.rooms[req.body.room]) {
    exists = true;
  }
  res.json({
    exists: exists
  });
});