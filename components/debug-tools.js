module.exports = function(rl) {
  return {
    log: function(msg, cb){
      if (process.env.DEBUG === "true") {
        process.stdout.clearLine();
        console.log(msg);
        if (cb) cb();
        rl.prompt();
      }
    },
    prompt: function() {
      rl.prompt();
    }
  };
};