const {VertexServer} = require('vertex-transport');

class Network {

  static attach(vertex) {
    vertex._net = new Network(vertex);
    return Promise.resolve()
      .then(vertex._net._listenSystem.bind(vertex._net))
      .then(vertex._net._listenUser.bind(vertex._net))
      .then(() => {

      })
  }


  constructor(vertex) {
    this.log = vertex.log.createLogger({name: 'net'});
    this._config = {
      listen: vertex._config.listen || {}
    };

    this._defaults();
  }


  stop() {
    this.log.info('stopping');
    let stops = [];
    if (this._sys) stops.push(this._sys.close());
    if (this._usr) stops.push(this._usr.close());
    return Promise.all(stops)
      .then(() => {
        this.log.info('stopped');
      })
  }


  _listenSystem() {
    return VertexServer.listen(this._config.listen.system)
      .then(server => {
        this._sys = server;
        let address = server.address();
        this.log.info('listening/sys %s:%d', address.address, address.port);
      });
  }


  _listenUser() {
    return VertexServer.listen(this._config.listen.user)
      .then(server => {
        this._usr = server;
        let address = server.address();
        this.log.info('listening/usr %s:%d', address.address, address.port);
      });
  }


  _defaults() {
    ['system', 'user'].forEach(key => {
      if (typeof this._config.listen[key] == 'undefined') {
        this._config.listen[key] = {
          host: '0.0.0.0',
          port: key == 'system' ? 65535 : 49152
        };
        return;
      }
      if (typeof this._config.listen[key] == 'number') {
        this._config.listen[key] = {
          host: '0.0.0.0',
          port: this._config.listen[key]
        };
        return;
      }
      if (typeof this._config.listen[key] == 'string') {
        let parts = this._config.listen[key].split(':');
        if (parts.length > 1) {
          this._config.listen[key] = {
            port: parseInt(parts.pop()),
            host: parts.join(':')
          };
          return;
        }
        this._config.listen[key] = {
          host: this._config.listen[key],
          port: key == 'system' ? 65535 : 49152
        };
      }
    });
  }


}

module.exports = Network;
