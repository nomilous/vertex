// Generated by CoffeeScript 1.6.3
var Hub, hub;

Hub = require('../hub/hub');

hub = Hub({
  listen: {
    port: 3002
  }
});

hub.listen();