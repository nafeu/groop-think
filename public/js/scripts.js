var socket = io();

$(function(){
  var body = $("body");

  console.log("document is ready...");

  // socket.on('broadcast',function(data){
  //   handleBroadcast(data);
  // });

  socket.on('connectToRoom', function(data){
    handleConnectToRoom(data);
  });

  function handleBroadcast(data) {
    console.log("<< handling event: [ broadcast ] >> :", data);
    body.html(data.desc);
  }

  function handleConnectToRoom(data) {
    console.log("<< handling event: [ connect to room ] >> :", data);
    body.html(data.desc);
  }

});
