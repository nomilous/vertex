const {VertexServer} = require('vertex-transport');
const deepcopy = require('deepcopy');
const {format} = require('util');

const {isInt} = require('./utils');
const {VertexConfigError} = require('./errors');

class Network {

  static listen(vertex) {
    let network = vertex._net = new Network(vertex);
    return Promise.resolve()
      .then(network._listen.bind(network))
      .then(() => {

      })
  }


  constructor(vertex) {
    this.log = vertex.log.createLogger({name: 'net'});
    this._services = {};
    this._config = {
      listen: deepcopy(vertex._config.listen)
    };

    this._defaults();
  }


  stop() {
    this.log.debug('stopping');
    let address;
    let stops = [];
    if (this._server) {
      address = this._server.address();
      stops.push(this._server.close());
    }
    return Promise.all(stops)
      .then(() => {
        if (this._server) {
          this.log.info('closed %s:%d', address.address, address.port);
          this._server.removeListener('error', this._onErrorListener);
          this._server.removeListener('connection', this._onConnectionListener);
        }
        delete this._server;
        this.log.debug('stopped');
      })
  }


  registerService(routeKey, instance) {
    if (this._services.hasOwnProperty(routeKey)) {
      throw new VertexConfigError(format('Service \'%s\' already exists', routeKey));
    }
    this._services[routeKey] = instance.handlers;
  }


  _listen() {
    return VertexServer.listen(this._config.listen)
      .then(server => {
        this._server = server;
        let address = this._server.address();
        this.log.info('listening %s:%d', address.address, address.port);
        this._onErrorListener = this._onError.bind(this);
        this._onConnectionListener = this._onConnection.bind(this);
        this._server.on('error', this._onErrorListener);
        this._server.on('connection', this._onConnectionListener);
      });
  }


  _onError(error) {
    this.log.warn('server error', error);
  }


  _onConnection(socket) {
    let address = socket.remoteAddress();
    this.log.debug('connect from %s:%s', address.address, address.port);

    let session = this._createSession(socket);

    let onError = (error) => {
      this.log.warn('socket error', error);
    };

    let onClose = (code, message) => {
      this.log.debug('socket closed %s %s', code, message);
      socket.removeListener('error', onError);
      socket.removeListener('close', onClose);
      socket.removeListener('data', onData);
    };

    let onData = (data, meta, reply) => {
      if (this._invalidPayload(data, reply)) return;
      let {FOR, DO} = data[0];
      let handler = this._services[FOR][DO || 'default'];

      if (typeof handler != 'function' && !Buffer.isBuffer(handler)) {
        // must be data, send in reply
        return reply(DO || 'default', handler);
      }

      if (!session.contexts[FOR]) this._createSessionContext(session, FOR);
      // TODO: too tight?

      handler(session.contexts[FOR], data[1], meta, reply);
    };

    socket.on('error', onError);
    socket.on('close', onClose);
    socket.on('data', onData);
  }


  _createSession(socket) {
    let session = {};
    session.contexts = {};
    Object.defineProperty(session, 'socket', {
      get: () => {
        return socket;
      },
      enumerable: true
    });
    return session;
  }

  _createSessionContext(session, handler) {
    session.contexts[handler] = {
      send: (data, timeout) => {
        return session.socket.send(data, timeout);
      }
    }
  }

  _invalidPayload(data, reply) {
    if (!Array.isArray(data)) {
      reply('nak', new Error('Invalid payload'));
      return true;
    }

    if (data.length == 0) {
      reply('nak', new Error('Missing payload header'));
      return true;
    }

    let {FOR, DO} = data[0];

    if (typeof FOR == 'undefined') {
      reply('nak', new Error('Invalid payload header'));
      return true;
    }

    if (!this._services.hasOwnProperty(FOR)) {
      reply('nak', new Error(format('No service named \'%s\'', FOR)));
      return true;
    }

    if (!this._services[FOR].hasOwnProperty(DO || 'default')) {
      reply('nak', new Error(
        format('No handler named \'%s:%s\'', FOR, DO || 'default'))
      );
      return true;
    }

    return false;
  }


  _defaults() {
    if (typeof this._config.listen == 'undefined') {
      this._config.listen = {
        host: '0.0.0.0',
        port: 65535
      };
      return;
    }
    if (isInt(this._config.listen)) {
      this._config.listen = {
        host: '0.0.0.0',
        port: this._config.listen
      };
      return;
    }
    if (typeof this._config.listen == 'string') {
      let parts = this._config.listen.split(':');
      if (parts.length > 1) {
        this._config.listen = {
          port: parseInt(parts.pop()),
          host: parts.join(':')
        };
        return;
      }
      this._config.listen = {
        host: this._config.listen,
        port: 65535
      };
    }
  }

}

module.exports = Network;
