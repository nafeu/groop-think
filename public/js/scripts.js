var socket = io();

$(function(){
  var body = $("#content");
  // var numRooms = $("#num-rooms");
  var numClients = $("#num-clients");

  socket.on('updateNumClients',function(data){
    handleUpdateNumClients(data);
  });

  socket.on('connectToRoom', function(data){
    handleConnectToRoom(data);
  });

  function handleUpdateNumClients(data) {
    console.log("<< handling event: [ update num clients ] >> :", data);
    numClients.html(data);
  }

  function handleConnectToRoom(data) {
    console.log("<< handling event: [ connect to room ] >> :", data);
    // numRooms.html(data.desc);
  }

});
