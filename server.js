var express = require('express');
var app = express();
var http = require('http');
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var io = require('socket.io')(server);
var config = require('./config.js');
var gameDeck = require('./components/game-deck');
var colors = require('colors');
var readline = require('readline');

// ---------------------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------------------

server.listen(process.env.PORT || 8000, function(){
  console.log('<< Application server listening on '.blue.bold + server.address().port + ' >>'.blue.bold);
  debug.prompt();
});

// Globals
var serverData = {
  sockets: {},
  clientData: {},
  rooms: {}
};
var rl, uiManager, statePusher;
var roomSize = 3;

// Debug Tool Configs
if (process.env.DEBUG === "true") {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  rl.on('line', function(command){
    switch (command) {
      case "h":
      case "help":
        debug.log(
          "sd, server data --- display all server data\n"+
          "fc, fetch cards --- display available cards from DB\n"+
          "r, rooms --- display all rooms\n"
        );
        break;
      case "sd":
      case "server data":
        logServerData();
        break;
      case "fc":
      case "fetch cards":
        logCardsDB();
        break;
      case "r":
      case "rooms":
        if (Object.keys(serverData.rooms).length > 0) {
          debug.log("active: ".blue + Object.keys(serverData.rooms).length, function(){
            Object.keys(serverData.rooms).forEach(function(room){
              logRoomData(room);
            });
          });
        } else {
          debug.log("There are currently no active rooms.");
        }
        break;
      case "clear":
        process.stdout.write("\u001b[2J\u001b[0;0H");
        debug.prompt();
        break;
      default:
        debug.log("Error: unrecognized command '"+command+"', try 'help' for a list of commands.");
        break;
    }
  });
}

// Module Configs
debug = require('./components/debug-tools')(rl);
uiManager = require('./components/ui-manager')(serverData, io, debug);
statePusher = require('./components/state-pusher')(serverData, uiManager, gameDeck, debug);

// Socket.io configs
io.set('heartbeat timeout', 4000);
io.set('heartbeat interval', 2000);

// Express server configs
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

// ---------------------------------------------------------------------------------------
io.on('connection', function(socket){ // IO Socket Connection Start
// ---------------------------------------------------------------------------------------

// On User Connect, SAVE, PERSIST, NOTIFY
saveClient(socket);

socket.on('registerUser', function(data){
  if (!(serverData.rooms[data.room])) {
    gameDeck.fetchCards(function(cards, err){
      serverData.rooms[data.room] = statePusher.createGameState(cards.slice(0), 5);
      socket.join(data.room);
      serverData.clientData[socket.id] = data;
      serverData.rooms[data.room].numActive = 1;
      serverData.rooms[data.room].hostId = socket.id;
      socket.emit('setHost');
      socket.emit('render', {
        method: "game-state",
        content: serverData.rooms[data.room]
      });
      roomRef = getRoom(socket.id);
      uiManager.printToChat(roomRef, { type: "update", text: data.name + " has connected!"});
      uiManager.updateUsers(roomRef);
      debug.log("\n<< new room created with id ".green + data.room + " at ".green + getTimeStamp().green + ">>".green, function(){
        logRoomData(data.room);
      });
    });
  } else {
    socket.join(data.room);
    serverData.clientData[socket.id] = data;
    serverData.rooms[data.room].numActive++;
    socket.emit('render', {
      method: "game-state",
      content: serverData.rooms[data.room]
    });
    uiManager.printToChat(getRoom(socket.id), { type: "update", text: data.name + " has connected!"});
    uiManager.updateUsers(getRoom(socket.id));
    debug.log("\n<< user ".green + socket.id + " joined room ".green + data.room + " at ".green + getTimeStamp().green + ">>".green, function(){
      logRoomData(data.room);
    });
  }
});

socket.on('disconnect', function(){
  var user = Object.assign({}, serverData.clientData[socket.id]);
  removeClient(socket);
  if (user.room) {
    uiManager.printToChat(roomRef, {
      type: "update",
      text: user.name + " has disconnected!"
    });
    if (serverData.rooms[user.room]) {
      var index = serverData.rooms[user.room].typing.indexOf(user.name);
      if (index >= 0) serverData.rooms[user.room].typing.splice(index, 1);
      io.sockets.to(user.room).emit('usersTyping',
        { typing: serverData.rooms[user.room].typing }
      );
      uiManager.updateUsers(user.room);
    }
  }
});

socket.on('printToChat', function(data){
  uiManager.printToChat(getRoom(socket.id), data);
});

socket.on('nextState', function(){
  statePusher.next(getRoom(socket.id));
});

socket.on('userStartedTyping', function(data) {
  serverData.rooms[data.room].typing.push(data.name);
  io.sockets.to(data.room).emit('usersTyping',
    { typing: serverData.rooms[data.room].typing }
  );
});

socket.on('userStoppedTyping', function(data) {
  if (serverData.rooms[data.room].typing.length > 0) {
    var index = serverData.rooms[data.room].typing.indexOf(data.name);
    serverData.rooms[data.room].typing.splice(index, 1);
  }
  io.sockets.to(data.room).emit('usersTyping',
    { typing: serverData.rooms[data.room].typing }
  );
});

socket.on('submitAnswer', function(data){
  var room = getRoom(socket.id);
  var currRoom = serverData.rooms[room];
  if (currRoom.players[socket.id] && (currRoom.players[socket.id].choice === null)) {
    currRoom.players[socket.id].choice = data.answer;
    currRoom.numAnswers++;
    io.sockets.to(room).emit('render', {
      method: "add-class",
      content: {
        "id": "#userId-"+currRoom.players[socket.id].name,
        "class": "submittedAnswer"
      }
    });
  }
  if (currRoom.numAnswers >= currRoom.numActive) {
    statePusher.next(getRoom(socket.id));
  }
});

socket.on('cycleRoomSize', function(){
  socket.emit('cycleRoomSize', { 'roomSize': cycleRoomSize(serverData.rooms[getRoom(socket.id)]) });
});

socket.on('cycleGameLength', function(){
  socket.emit('cycleGameLength', { 'gameLength': cycleGameLength(serverData.rooms[getRoom(socket.id)]) });
});

socket.on('attemptGameStart', function(data){
  if (serverData.rooms[data.room].numActive >= 2) {
    socket.emit('startGameSuccess', { message: "starting game..." });
  } else {
    socket.emit('startGameFail', { message: "at least 2 players needed to start, try again" });
  }
});

// ---------------------------------------------------------------------------------------
}); // IO Socket Connection End
// ---------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------
// Server API
// ---------------------------------------------------------------------------------------

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
  var joinable = false;
  var message = "";
  if (serverData.rooms[req.body.room]) {
    var room = serverData.rooms[req.body.room];
    // console.log(room);
    if (room.phase != "start") {
      message = "is already in a game, please try later.";
    }
    else if (Object.keys(room.players).length == roomSize)
    {
      message = "is full, please try a different room.";
    }
    else {
      joinable = true;
    }
  } else {
    message = "does not exist, please enter an existing room id.";
  }
  res.json({
    joinable: joinable,
    message: message
  });
});

// ---------------------------------------------------------------------------------------
// Debug Logging
// ---------------------------------------------------------------------------------------

function logServerData() {
  debug.log("\n[ Server Data - ".bold.blue + getTimeStamp().bold.blue + " ]".bold.blue, function(){
    console.log("Clients:".underline);
    console.log("  active: ".blue + "("+ Object.keys(serverData.sockets).length +")");
    Object.keys(serverData.sockets).forEach(function(item){
      console.log("    "+item);
    });
    console.log("  registered:".blue, Object.keys(serverData.clientData).length);
    console.log("Rooms:".underline);
    console.log("  active: ".blue + "("+ Object.keys(serverData.rooms).length +")");
    Object.keys(serverData.rooms).forEach(function(room){
      logRoomData(room);
    });
  });
}

function logCardsDB() {
  gameDeck.fetchCards(function(cards){
    debug.log("Fetching cards...".blue, function(){
      cards.forEach(function(card){
        console.log(card.q);
      });
      console.log("Total: ".blue + " " + cards.length);
    });
  });
}

function logRoomData(room) {
  if (serverData.rooms[room]) {
    console.log("\n  --[ ".blue+room.bold+" ]--".blue);
    console.log(JSON.stringify(
      Object.assign(
        {},
        serverData.rooms[room],
        {
          deck: serverData.rooms[room].deck.length,
          currQuestion: shortenQuestion(serverData.rooms[room].currQuestion.q)
        }),
      null,
      2).replace(/"|{|}|,/g,'')
      .replace(/^\s*[\r\n]/gm, ''));
  } else {
    console.log(room + " does not exist.");
  }
}

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------

function getTimeStamp() {
  var now = new Date();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  var ampm = "AM";
  if (hours > 12) {
    hours -= 12;
    ampm = "PM";
  }
  if (minutes < 10) {
    minutes = "0"+minutes;
  }
  if (seconds < 10) {
    seconds = "0"+seconds;
  }
  return hours + ":" + minutes + ":" + seconds + " " + ampm;
}

function shortenQuestion(q) {
  if (q) {
    if (q.length > 40)
      return "< " + q.substring(0, 40) + "... >";
    return "< " + q + " >";
  } else {
    return "null";
  }
}

function cycleRoomSize(roomRef) {
  if (roomRef.roomSize == 20) {
    if (roomRef.numActive > 1) roomRef.roomSize = roomRef.numActive;
    else roomRef.roomSize = 2;
  }
  else
  {
    roomRef.roomSize++;
  }
  return roomRef.roomSize;
}

function cycleGameLength(roomRef) {
  if (roomRef.gameLength == 20) {
    roomRef.gameLength = 5;
  }
  else
  {
    roomRef.gameLength += 5;
  }
  return roomRef.gameLength;
}


function saveClient(socket) {
  debug.log("\n<< new client connected at ".green + getTimeStamp().green + " >>".green, function(){
    console.log("id: ".green, socket.id);
    console.log("ip address: ".green, socket.request.connection.remoteAddress);
  });
  serverData.sockets[socket.id] = socket;
}

function removeClient(socket) {
  debug.log("\n<< a client disconnected at ".yellow + getTimeStamp().yellow + " >>".yellow, function(){
    console.log("id: ".yellow, socket.id);
    console.log("ip address: ".yellow, socket.request.connection.remoteAddress);
  });
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
        if (serverData.rooms[occupied.room].numActive > 0)
          serverData.rooms[occupied.room].numActive--;
        if (serverData.rooms[occupied.room].numAnswers > 0);
          serverData.rooms[occupied.room].numAnswers--;
        // TODO: Delete the user as well
        if (serverData.rooms[occupied.room].numActive === 0) {
          debug.log("\n<< deleting empty room ".red + occupied.room + " at ".red + getTimeStamp().red + ">>".red);
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

function generateUID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4);
}