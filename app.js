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
  clientData: {}
};

var gameState = {
  "phase": "start",
  "questionIdx": 0,
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
  next: function(){
    switch (gameState.phase) {
      case "start":
        var clientIds = Object.keys(serverData.clientData);
        gameState.numActive = clientIds;
        for (var i = 0; i < clientIds.length; i++) {
          var playerObj = {
            name: serverData.clientData[clientIds[i]].name,
            score: 0,
            choice: 0
          };
          gameState.players[clientIds[i]] = playerObj;
        }
        console.log("players : ", gameState.players);
        gameState.currQuestion = questions[gameState.questionIdx];
        gameState.questionIdx++;
        gameState.phase = "question";
        break;
      case "question":
        gameState.phase = "result";
        break;
      case "result":
        gameState.phase = "end";
        break;
      case "end":
        gameState.phase = "start";
        break;
    }
    uiManager.renderState();
  }
};

var questions = [
  {
    "q": "What is the best?",
    "a": [
      "answer a",
      "answer b"
    ]
  },
  {
    "q": "What is the worst?",
    "a": [
      "answer c",
      "answer d"
    ]
  }
];

var uiManager = {
  updateUsers: function() {
    var onlineUsers = [];
    var clients = Object.keys(serverData.clientData);
    for (var i = 0; i < clients.length; i++) {
      onlineUsers.push(serverData.clientData[clients[i]].name);
    }
    io.sockets.emit('render', {
      method: "update-online-users",
      content: onlineUsers
    });
  },
  printToChat: function(data) {
    io.sockets.emit('render', {
      method: "print-to-chat",
      content: data
    });
  },
  renderState: function() {
    io.sockets.emit('render', {
      method: "game-state",
      content: gameState
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
  delete serverData.sockets[socket.id];
  delete serverData.clientData[socket.id];
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
  serverData.clientData[socket.id] = data;
  socket.emit('render', {
    method: "game-state",
    content: gameState
  });
  uiManager.printToChat({ type: "update", text: data.name + " has connected!"});
  uiManager.updateUsers();
});

socket.on('disconnect', function(){
  var user = serverData.clientData[socket.id];
  removeClient(socket);
  if (user) uiManager.printToChat({
    type: "update",
    text: user.name + " has disconnected!"
  });
  uiManager.updateUsers();
});

socket.on('printToChat', function(data){
  uiManager.printToChat(data);
});

socket.on('nextState', function(){
  gameState.next();
});

socket.on('submitAnswer', function(data){
  console.log("Submitted answer: ", serverData.clientData[socket.id].name, data);
  if (gameState.players[socket.id]) {
    gameState.players[socket.id].choice = data.answer;
    gameState.numAnswers++;
    io.sockets.emit('render', {
      method: "add-class",
      content: {
        "id": "#userId-"+gameState.players[socket.id].name,
        "class": "submittedAnswer"
      }
    });
  }
});


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
      message = "That name is already taken";
      color = "green";
  }

  if (req.body.name.length > 20) {
    valid = false;
    message = "Sorry, your name is too long";
    color = "#CB4335";
  }

  res.json({
    valid: valid,
    message: message,
    color: color
  });

});

