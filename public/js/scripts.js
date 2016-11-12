$(function(){
  console.log("document is ready...");
});

var socket = io();
socket.on('broadcast',function(data){
    document.body.innerHTML = '';
    document.write(data.description);
});