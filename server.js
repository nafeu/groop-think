var express = require('express');
var app = express();
var http = require('http');
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var io = require('socket.io')(server);
var msgt = require('./components/msg-tools');
var config = require('./config.js');
var gd = require('./components/game-deck');
var colors = require('colors');
var readline = require('readline');

// ---------------------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------------------

// debugger
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

if (config.debug) {
  rl.on('line', function(command){
    switch (command) {
      case "h":
      case "help":
        debug(
          "sd, server data --- display server data\n"+
          "fc, fetch cards --- display available cards from DB\n"+
          "client [id] --- display client info\n"
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
      default:
        debug("Error: unrecognized command '"+command+"', try 'help' for a list of commands.");
        break;
    }
  });
}

// socket.io configs
io.set('heartbeat timeout', 4000);
io.set('heartbeat interval', 2000);

// Express server configs
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

// Server state data (stored in memory)
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
function prompt() {
  if (config.debug) rl.prompt();
}

function debug(msg, color, cb) {
  if (config.debug || process.env.DEBUG === true) {
    process.stdout.clearLine();
    if (color) {
      console.log(colors[color](msg));
      if (cb) cb();
    }
    else {
      console.log(msg);
      if (cb) cb();
    }
  }
  prompt();
}

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

function logServerData() {
  debug("\n[ Server Data - ".bold + getTimeStamp().bold + " ]".bold, "blue", function(){
    console.log("Clients:".underline);
    console.log("  active: ".blue + "("+ Object.keys(serverData.sockets).length +")");
    Object.keys(serverData.sockets).forEach(function(item){
      console.log("    "+item);
    });
    console.log("  registered:".blue, Object.keys(serverData.clientData).length);
    console.log("Rooms:".underline);
    console.log("  active: ".blue + "("+ Object.keys(serverData.rooms).length +")\n");
    Object.keys(serverData.rooms).forEach(function(room){
      console.log("  --[ "+room.bold+" ]--");
      var roomData = JSON.stringify(
        Object.assign(
          {},
          serverData.rooms[room],
          {
            deck: serverData.rooms[room].deck.length,
            currQuestion: shortenQuestion(serverData.rooms[room].currQuestion.q)
          }),
        null,
        2);
      roomData = roomData.replace(/"|{|}|,/g,'').replace(/^\s*[\r\n]/gm, '');
      console.log(roomData);
    });
  });
}

function logCardsDB() {
  gd.fetchCards(function(cards){
    debug(JSON.stringify(cards, null, 2));
  });
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

function saveClient(socket) {
  debug("\n<< new client connected at " + getTimeStamp() + " >>", "green", function(){
    console.log("id: ".green, socket.id);
    console.log("ip address: ".green, socket.request.connection.remoteAddress);
  });
  serverData.sockets[socket.id] = socket;
}

function removeClient(socket) {
  debug("\n<< a client disconnected at " + getTimeStamp() + " >>", "yellow", function(){
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
  if (!(serverData.rooms[data.room])) {
    gd.fetchCards(function(cards, err){
      serverData.rooms[data.room] = statePusher.createGameState(cards.slice(0), 3);
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

socket.on('logServerData', function(){ logServerData(); });


// ---------------------------------------------------------------------------------------
}); // IO Socket Connection End
// ---------------------------------------------------------------------------------------



// ---------------------------------------------------------------------------------------
// Server Config
// ---------------------------------------------------------------------------------------
server.listen(process.env.PORT || 3000, function(){
  console.log("\n------------------------------------");
  console.log('Application server listening on', server.address().port);
  console.log("------------------------------------\n");
  prompt();
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