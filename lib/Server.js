const deepcopy = require('deepcopy');
const {format} = require('util');

const {VertexServer} = require('vertex-transport');

const {VertexConfigError} = require('./errors');
const {isInt} = require('./utils');

class Server {

  constructor(vertex, name, config = {}) {
    this.log = vertex.log.createLogger({name: name});
    this._services = {};
    this._sessions = {};

    Object.defineProperty(this, 'config', {value: deepcopy(config)});
    Object.defineProperty(this, '_vertex', {value: vertex});
    Object.defineProperty(this, '_onErrorListener', {value: this._onError.bind(this)});
    Object.defineProperty(this, '_onConnectionListener', {value: this._onConnection.bind(this)});

    let nextSession = 0;
    Object.defineProperty(this, '_nextSession', {
      get: () => {
        // TODO: wrap
        return nextSession++;
      }
    });

    this._defaults();
  }


  $start() {
    return VertexServer.listen(this.config.listen)
      .then(server => {
        this._server = server;
        let address = this._server.address();

        this._server.on('error', this._onErrorListener);
        this._server.on('connection', this._onConnectionListener);
        this.log.info('listening %s:%d', address.address, address.port);
      });
  }


  $stop() {
    // TODO: consider vertex.on('stopped') to clear sessions
    Object.keys(this._sessions).forEach(id => {
      this._sessions[id].socket.close();
      delete this._sessions[id];
    });

    // TODO: un-register services


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
      })
  }


  registerService(serviceName, instance) {
    if (!(instance.$handlers instanceof Object)) {
      throw new VertexConfigError(format(
        'Service \'%s\' missing $handlers',
        instance.constructor.name
      ));
    }

    // if (typeof instance.$routeCode == 'undefined') {
    //   throw new VertexConfigError(format(
    //     'Service \'%s\' missing $routeCode',
    //     instance.constructor.name
    //   ));
    // }

    let routeCode = instance.$routeCode;
    if (typeof routeCode != 'string' && typeof routeCode != 'number') {
      routeCode = serviceName;
    }

    if (this._services.hasOwnProperty(instance.$routeCode)) {
      throw new VertexConfigError(format(
        'Service \'%s\' wants routeCode \'%s\' already used by \'%s\'',
        instance.constructor.name,
        instance.$routeCode,
        this._services[instance.$routeCode].constructor.name
      ));
    }

    this._services[routeCode] = instance;
  }


  _onError(error) {
    this.log.warn('server error', error);
  }


  _onConnection(socket) {
    let address = socket.remoteAddress();
    this.log.debug('connected %s:%s', address.address, address.port);

    let session = this._createSession(socket);

    let onError = (error) => {
      this.log.warn('socket error', error);
    };

    let onClose = (code, message) => {
      if (code >= 1002) {
        this.log.error(
          'socket %s:%d closed %s %s',
          address.address, address.port,
          code, message
        );
      } else {
        this.log.debug(
          'socket %s:%d closed %s %s',
          address.address, address.port,
          code, message
        );
      }
      delete this._sessions[session.id];
      socket.removeListener('error', onError);
      socket.removeListener('close', onClose);
      socket.removeListener('data', onData);
    };

    let onData = (data, meta, reply) => {
      if (this._invalidPayload(data, reply)) return;
      let {FOR, DO} = data[0];
      let restricted = this._services[FOR].$restricted;
      let handler = this._services[FOR].$handlers[DO || 'default'];

      if (typeof restricted != 'boolean') restricted = true;

      if (typeof handler != 'function' && !Buffer.isBuffer(handler)) {
        // must be data, send in reply
        return reply(DO || 'default', handler);
      }

      if (!session.contexts[FOR]) this._createSessionContext(session, FOR, restricted);
      // TODO: too tight?

      handler(session.contexts[FOR], data[1], meta, reply);
    };

    socket.on('error', onError);
    socket.on('close', onClose);
    socket.on('data', onData);
  }


  _createSession(socket) {
    let id = this._nextSession;
    let session = {id: id}; // does not correspond to remote session id
    this._sessions[id] = session;
    session.contexts = {};
    Object.defineProperty(session, 'socket', {
      get: () => {
        return socket;
      },
      enumerable: true
    });
    return session;
  }

  _createSessionContext(session, handler, restricted) {
    if (restricted) {
      session.contexts[handler] = {
        local: {},
        socket: {
          send: (data, timeout) => {
            return session.socket.send(data, timeout);
          }
        }
      };
      return;
    }
    session.contexts[handler] = {local: {}};
    Object.defineProperty(session.contexts[handler], 'socket', {
      get: () => {
        return session.socket;
      },
      enumerable: true
    });
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
      reply('nak', new Error(format('No service with $routeCode \'%s\'', FOR)));
      return true;
    }

    if (!this._services[FOR].$handlers.hasOwnProperty(DO || 'default')) {
      reply('nak', new Error(format(
        'No handler for \'%s:%s\' in \'%s\'',
        FOR, DO || 'default',
        this._services[FOR].constructor.name
      )));
      return true;
    }

    return false;
  }


  _defaults() {
    if (typeof this.config.listen == 'undefined') {
      this.config.listen = {
        host: '0.0.0.0',
        port: 65535
      };
      return;
    }
    if (isInt(this.config.listen)) {
      this.config.listen = {
        host: '0.0.0.0',
        port: this.config.listen
      };
      return;
    }
    if (typeof this.config.listen == 'string') {
      let parts = this.config.listen.split(':');
      if (parts.length > 1) {
        this.config.listen = {
          port: parseInt(parts.pop()),
          host: parts.join(':')
        };
        return;
      }
      this.config.listen = {
        host: this.config.listen,
        port: 65535
      };
    }
  }


}

module.exports = Server;
