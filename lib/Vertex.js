const deepcopy = require('deepcopy');
const {format} = require('util');
const {EventEmitter} = require('events');
const {createWord} = require('vertex-names');
const VertexLogger = require('vertex-logger');

const none = require('./overrides');
const {getIP} = require('./utils');
const errors = require('./errors');
const constants = require('./constants');

const Server = require('./Server');
const Cluster = require('./Cluster');
const KeyStore = require('./KeyStore');
const Member = require('./Member');

class Vertex extends EventEmitter {

  static create(config) {
    let error, vertex = new Vertex(null, null, config);
    return vertex.$start()
      .catch(_error => {
        error = _error;
        if (vertex.log) vertex.log.error('failed to start', error);
        return vertex.$stop();
      })
      .catch(error => {
        if (vertex.log) vertex.log.error('failed to stop', error);
      })
      .then(() => {
        if (error) throw error;
        return vertex;
      });
  }


  constructor(vertex, name, config = {}) {
    super();
    Object.defineProperty(this, '_services', {value: []});
    Object.defineProperty(this, 'config', {value: deepcopy(config)});
    Object.defineProperty(this, 'name', {
      value: name || this.config.name || createWord(11, {finished: true}),
      enumerable: true
    });
    Object.defineProperty(this, 'stopping', {
      value: false,
      writable: true,
      enumerable: true
    });

    this.log = null;

    // always start server unless explicitly null
    if (this.config.server !== null) {
      this._services.push('server');
    }

    // start cluster second
    if (this.config.cluster) this._services.push('cluster');

    Object.keys(this.config).forEach(serviceName => {
      if (this.config[serviceName] == null) return;
      if (serviceName == 'name') return;
      if (serviceName == 'logLevel') return;
      if (serviceName == 'log') return;
      if (serviceName == 'services') return;
      if (serviceName == '$start') return;
      if (serviceName == '$stop') return;
      if (this._services.indexOf(serviceName) >= 0) return;
      this._services.push(serviceName);
    });

    if (process.env.LOG_LEVEL && !this.config.logLevel) {
      this.config.logLevel = process.env.LOG_LEVEL;
    }

    this.log = new VertexLogger({
      root: this.name,
      name: 'vertex',
      level: this.config.logLevel
    });

    this.log.info('assigned name %s', this.name);
  }


  $start() {
    return new Promise((resolve, reject) => {
      if (this._services.length == 0) return resolve();

      let starts = deepcopy(this._services);

      let next = (serviceName) => {
        let config, instance;

        if (typeof serviceName == 'undefined') {
          this.emit('started');
          return resolve();
        }

        this.log.debug('starting service %s', serviceName);

        config = deepcopy(this.config[serviceName] || {});

        try {
          if (config.module) {
            instance = new config.module(this, serviceName, config);
          } else if (serviceName == 'server') {
            instance = new Server(this, serviceName, config);
          } else if (serviceName == 'cluster') {
            instance = new Cluster(this, serviceName, config);
          } else {
            return reject(new errors.VertexConfigError(
              format('Missing config.class for service %s', serviceName)
            ));
          }
        } catch (error) {
          return reject(error);
        }

        this[serviceName] = instance;

        try {
          if (typeof instance.$handlers == 'object' && this.server) {
            this.server.registerService(serviceName, instance);
          }

          if (typeof instance.$start != 'function') {
            this.log.debug('started service %s', serviceName);
            return next(starts.shift());
          }

          Promise.resolve(instance.$start())
            .then(() => {
              this.log.debug('started service %s', serviceName);
              next(starts.shift());
            })
            .catch(reject);

        } catch (error) {
          return reject(error);
        }
      };

      next(starts.shift());
    });
  }


  $stop() {
    if (this.stopping) return Promise.resolve();
    if (this.stopped) return Promise.resolve();
    this.stopping = true;
    return new Promise(resolve => {
      if (this._services.length == 0) {
        this.log.debug('stopped');
        return resolve();
      }

      let stops = deepcopy(this._services);

      this.log.debug('stops', stops);

      // stop cluster last
      if (stops.indexOf('cluster') >= 0) {
        stops.splice(stops.indexOf('cluster'), 1);
        stops.push('cluster');
      }

      let next = (serviceName) => {

        if (typeof serviceName == 'undefined') {
          this.log.info('stopped');
          this.emit('stopped');
          Object.keys(this._services).forEach(name => {
            delete this._services[name];
          });
          this.stopped = true;
          return resolve();
        }

        this.log.debug('stopping service %s', serviceName);

        let instance = this[serviceName];

        if (!instance || typeof instance.$stop != 'function') {
          return next(stops.shift());
        }

        try {
          Promise.resolve(instance.$stop())
            .then(() => {
              this.log.debug('stopped service %s', serviceName);
              next(stops.shift());
            })
            .catch(error => {
              this.log.error('error stopping service %s', serviceName, error);
              next(stops.shift());
            });
        } catch (error) {
          this.log.error('error stopping service %s', serviceName, error);
          next(stops.shift());
        }

      };

      next(stops.shift());
    });
  }


  getAddress() {
    let address = this.server._server.address();
    if (address.address != '0.0.0.0') {
      // TODO: IPv6 ?
      return {
        host: address.address,
        port: address.port
      }
    }
    return {
      host: getIP(),
      port: address.port
    }
  }

}

Object.defineProperty(Vertex, 'Server', {value: Server, enumerable: true});
Object.defineProperty(Vertex, 'Cluster', {value: Cluster, enumerable: true});
Object.defineProperty(Vertex, 'KeyStore', {value: KeyStore, enumerable: true});
Object.defineProperty(Vertex, 'Member', {value: Member, enumerable: true});
Object.defineProperty(Vertex, 'errors', {value: errors, enumerable: true});
Object.defineProperty(Vertex, 'constants', {value: constants, enumerable: true});

module.exports = Vertex;

