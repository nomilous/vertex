const {createWord} = require('vertex-names');
const VertexLogger = require('vertex-logger');
const Network = require('./Network');

const {getIP} = require('./utils');
const Cluster = require('./Cluster');
const errors = require('./errors');

class Vertex {

  static create(config) {
    let vertex = new Vertex(config);
    return vertex.start();
  }


  constructor(config = {}) {
    this.name = null;
    this.log = null;
    this._net = null;
    this._config = config;

    if (process.env.LOG_LEVEL && !this._config.logLevel) {
      this._config.logLevel = process.env.LOG_LEVEL;
    }
  }


  start() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(this._createName.bind(this))
        .then(this._createLogger.bind(this))
        .then(() => {
          this.log.info('assigned name \'%s\'', this.name);
        })
        .then(this._listen.bind(this))
        .then(this._join.bind(this))
        .then(() => {
          createWord.finished();
          resolve(this);
        })
        .catch(error => {
          if (this.log) this.log.fatal('error starting', error);
          this.stop();
          reject(error);
        });

    });
  }


  stop() {
    this.log.debug('stopping');
    let stops = [];
    if (this._cluster) stops.push(this._cluster.stop());
    if (this._net) stops.push(this._net.stop());
    return Promise.all(stops)
      .then(() => {
        delete this._cluster;
        delete this._net;
        this.log.info('stopped');
      });
  }


  registerService(routeKey, instance) {

  }


  getAddress() {
    let address = this._net._server.address();
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


  _createName() {
    return new Promise(resolve => {
      this.name = this._config.name || createWord(9);
      resolve();
    });
  }


  _createLogger() {
    return new Promise(resolve => {
      this.log = new VertexLogger({
        parent: this.name,
        name: 'vertex',
        level: this._config.logLevel
      });
      resolve();
    });
  }


  _listen() {
    if (this._config.listen === null) return;
    return Network.listen(this);
  }

  _join() {
    if (typeof this._config.join !== 'object') return;
    return Cluster.join(this);
  }

}

Object.defineProperty(Vertex, 'Network', {value: Network, enumerable: true});
Object.defineProperty(Vertex, 'Cluster', {value: Cluster, enumerable: true});
Object.defineProperty(Vertex, 'errors', {value: errors, enumerable: true});

module.exports = Vertex;

