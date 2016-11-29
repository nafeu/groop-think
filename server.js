var express = require('express');
var app = express();
var http = require('http');
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var io = require('socket.io')(server);
var msgt = require('./components/msg-tools');
var config = require('./config.js');
var gd = require('./components/game-deck');
io.set('heartbeat timeout', 4000);
io.set('heartbeat interval', 2000);

// ---------------------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------------------

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

var questions = [];

function resetQuestions() {
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
          var randInt = Math.floor(Math.random()*questionLib.length);
          var toPush = questionLib.splice(randInt, 1)[0];
          questions.push(toPush);
        }
      }
    });
  }).on('error', function(e){
    // Log
  });
}

resetQuestions();

var serverData = {
  sockets: {},
  clientData: {},
  rooms: {}
};

var uiManager = require('./components/ui-manager')(serverData, io);
var statePusher = require('./components/state-pusher')(serverData, uiManager, gd);


// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------
function saveClient(socket) {
  serverData.sockets[socket.id] = socket;
}

function removeClient(socket) {
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

function createGameState(cards, len) {
  return {
    "phase": "start",
    "gameLength": len,
    "currQuestion": {},
    "numActive": 0,
    "numAnswers": 0,
    "topAnswer": null,
    "tiedScoreCounter": 0,
    "winner": null,
    "players": {},
    "deck": cards
  };
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
    gd.fetchCards(function(cards, err){
      serverData.rooms[data.room] = createGameState(cards, 3);
      socket.join(data.room);
      serverData.clientData[socket.id] = data;
      socket.emit('render', {
        method: "game-state",
        content: serverData.rooms[data.room]
      });
      uiManager.printToChat(getRoom(socket.id), { type: "update", text: data.name + " has connected!"});
      uiManager.updateUsers(getRoom(socket.id));
    });
  }
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
  statePusher.next(getRoom(socket.id));
});

socket.on('submitAnswer', function(data){
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