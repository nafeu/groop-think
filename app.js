var express = require('express');
var app = express();
var http = require('http');
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var io = require('socket.io')(server);
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

var questions = [
  {
    "q": "Who is best equipped to run America?",
    "a": [
      "Donald Trump",
      "Hillary Clinton",
      "Hilary Duff",
      "Donald Duck"
    ],
    "by": "@phrakturemusic"
  },
  {
    "q": "What is the proper pronounciation of GIF?",
    "a": [
      "JIFF, similar to the J in Jerry",
      "GIF, similar to G in Guild"
    ],
    "by": "@phrakturemusic"
  },
  {
    "q": "Which animal would be more affective in close quarters combat when equipped with a 12-gauge shotgun?",
    "a": [
      "Hamster",
      "Squirrel",
      "Hedgehog"
    ],
    "by": "@phrakturemusic"
  }
];

var url = "http://phrakture.com/apps/mrsubmission/data/questions.json";
http.get(url, function(res){
  var body = '';
  res.on('data', function(chunk){
    body += chunk;
  });
  res.on('end', function(){
    var apiRes = JSON.parse(body);
    var questionLib = apiRes;
    questions = [];
    var gameLengthSetting = 10;
    if (questionLib.length < gameLengthSetting) {
      questions = questionLib;
    } else {
      for (var i = 0; i < gameLengthSetting; i++) {
        question.push(questionLib.splice(Math.floor(Math.random()*questionLib.length), 1));
      }
    }
    console.log(questions);
  });
}).on('error', function(e){
    console.log("Got an error: ", e);
});

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
        var majorityIdx = indexOfMax(resultCounter);
        serverData.rooms[room].tiedScoreCounter = 0;
        serverData.rooms[room].topAnswer = serverData.rooms[room].currQuestion.a[majorityIdx];
        console.log(resultCounter);
        resultCounter.forEach(function(item){
          if (item == resultCounter[majorityIdx]) {
            console.log("This is the item inside result counter: ", item);
            serverData.rooms[room].tiedScoreCounter++;
            console.log("Incrementing tied score counter: ", serverData.rooms[room].tiedScoreCounter);
          }
        });
        for (var l = 0; l < activePlayers.length; l++) {
          if (serverData.rooms[room].tiedScoreCounter > 1) {
            serverData.rooms[room].players[activePlayers[l]].increment = scoreMessages.even();
          } else {
            if (serverData.rooms[room].players[activePlayers[l]].choice == majorityIdx) {
              serverData.rooms[room].players[activePlayers[l]].score += 1;
              serverData.rooms[room].players[activePlayers[l]].increment = scoreMessages.majority();
            } else {
              serverData.rooms[room].players[activePlayers[l]].increment = scoreMessages.minority();
            }
          }
        }
        console.log("SWITCHING PHASE TO RESULT");
        serverData.rooms[room].phase = "result";
        var interval = setInterval(function() {
          statePusher.next(room);
          clearInterval(interval);
        }, 7000);
        break;
      case "result":
        if (serverData.rooms[room].questionIdx < serverData.rooms[room].gameLength) {
          serverData.rooms[room].currQuestion = questions[serverData.rooms[room].questionIdx];
          serverData.rooms[room].questionIdx++;
          for (var m = 0; m < activePlayers.length; m++) {
            serverData.rooms[room].players[activePlayers[m]].choice = null;
          }
          serverData.rooms[room].numAnswers = 0;
          serverData.rooms[room].phase = "question";
        } else {
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

var scoreMessages = {
  majorityMessages: [
    "Look at me I'm sheeple",
    "Majority YEAH",
    "We observe collective thought",
    "Yeah I naw what you mean",
    "My opinion is better than yours",
    "I'm more equal than you",
    "I watch FOX News",
    "The hive mind... yes",
    "Sucks to be ya",
    "Ur mad cuz bad",
    "420 noscope blazeit"
  ],
  minorityMessages: [
    "Fuck you I won't do what you tell me",
    "Unpopular opinion puffin",
    "Shut the front door",
    "Originality is key except in this game",
    "Who gives a shit honestly",
    "Hipster till I die bruh",
    "I don't like things because other people do"
  ],
  evenMessages: [
    "Feeling a little too original aren't we",
    "3 original 4 me",
    "Even split my ass",
    "Whatever, at least we unique y'all",
    "I'm a special snowflake"
  ],
  majority: function(){
    return this.majorityMessages[Math.floor(Math.random()*this.majorityMessages.length)] + ", +1";
  },
  minority: function(){
    return this.minorityMessages[Math.floor(Math.random()*this.minorityMessages.length)] + ", no points";
  },
  even: function(){
    return this.evenMessages[Math.floor(Math.random()*this.evenMessages.length)];
  }
};

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
        if (
            (serverData.rooms[occupied.room].numAnswers >= serverData.rooms[occupied.room].numActive) &&
            (serverData.rooms[occupied.room].phase == "question")) {
          statePusher.next(occupied.room);
        }
        delete serverData.rooms[occupied.room].players[socket.id];
        serverData.rooms[occupied.room].numActive--;
        serverData.rooms[occupied.room].numAnswers--;
        // TODO: Delete the user as well
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
    "gameLength": questions.length,
    "currQuestion": {},
    "numActive": 0,
    "numAnswers": 0,
    "topAnswer": null,
    "tiedScoreCounter": 0,
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
  if (serverData.rooms[room].numAnswers >= serverData.rooms[room].numActive) {
    statePusher.next(getRoom(socket.id));
  }
});


// ---------------------------------------------------------------------------------------
}); // IO Socket Connection End
// ---------------------------------------------------------------------------------------



// ---------------------------------------------------------------------------------------
// Server Config
// ---------------------------------------------------------------------------------------
server.listen(process.env.PORT || 3000, function(){
  console.log('listening on', server.address().port);
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