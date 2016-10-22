const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');
const {platform} = require('os');

const {Network} = require('../');
const VertexLogger = require('vertex-logger');

describe(filename, () => {

  let mockVertex;

  beforeEach(() => {
    mockVertex = {
      _config: {},
      log: new VertexLogger()
    }
  });

  context('default config', () => {

    it('generates from scratch', done => {

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          system: {
            host: '0.0.0.0',
            port: 65535
          },
          user: {
            host: '0.0.0.0',
            port: 49152
          }
        }
      });
      done();

    });

    it('generates from only ports', done => {

      mockVertex._config.listen = {
        system: 9999,
        user: 8888
      };

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          system: {
            host: '0.0.0.0',
            port: 9999
          },
          user: {
            host: '0.0.0.0',
            port: 8888
          }
        }
      });
      done();

    });

    it('generates from only hosts', done => {

      mockVertex._config.listen = {
        system: '0.0.0.1',
        user: '0.0.0.1'
      };

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          system: {
            host: '0.0.0.1',
            port: 65535
          },
          user: {
            host: '0.0.0.1',
            port: 49152
          }
        }
      });
      done();

    });

    it('generates from only host:port', done => {

      mockVertex._config.listen = {
        system: '0.0.0.1:9999',
        user: '0.0.0.2'
      };

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          system: {
            host: '0.0.0.1',
            port: 9999
          },
          user: {
            host: '0.0.0.2',
            port: 49152
          }
        }
      });
      done();

    });

    it('generates from only host:port or device port', done => {

      mockVertex._config.listen = {
        system: '0.0.0.0:9999',
        user: 'eth0:8888'
      };

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          system: {
            host: '0.0.0.0',
            port: 9999
          },
          user: {
            host: 'eth0',
            port: 8888
          }
        }
      });
      done();

    });

    it('uses as supplied', done => {

      mockVertex._config.listen = {
        system: {
          host: '0.0.0.0',
          port: 9999
        },
        user: {
          host: 'eth0',
          port: 8888
        }
      };

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          system: {
            host: '0.0.0.0',
            port: 9999
          },
          user: {
            host: 'eth0',
            port: 8888
          }
        }
      });
      done();

    });

  });



});
