$(function(){
  if (queryVars.status) {
    switch(queryVars.status) {
      case "disconnected":
        UI.displayStatusMessage({
          color: "orange",
          message: "You were disconnected from the server."
        });
        break;
      case "ended":
        UI.displayStatusMessage({
          color: "orange",
          message: "The game has ended."
        });
        break;
    }
  }
});
