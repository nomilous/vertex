// Generated by CoffeeScript 1.6.3
var engine;

engine = require('engine.io');

module.exports = function(config) {
  var local;
  return local = {
    server: void 0,
    listen: function() {
      return local.server = engine.listen(config.listen.port);
    },
    close: function() {}
  };
};