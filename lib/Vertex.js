const {createWord} = require('vertex-names');
const VertexLogger = require('vertex-logger');
const Network = require('./Network');


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
        .then(() => {
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
    this.log.info('stopping');
    let stops = [];
    if (this._net) stops.push(this._net.stop());
    return Promise.all(stops)
      .then(() => {
        this.log.info('stopped');
      });
  }

  _createName() {
    return new Promise(resolve => {
      this.name = this._config.name || createWord(9, {finish: true});
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
    return Network.attach(this);
  }

}

module.exports = Vertex;

Object.defineProperty(Vertex, 'Network', {value: Network});
