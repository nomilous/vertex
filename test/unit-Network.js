const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');

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
          host: '0.0.0.0',
          port: 65535
        }
      });
      done();

    });

    it('generates from only port', done => {

      mockVertex._config.listen = 9999;

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          host: '0.0.0.0',
          port: 9999

        }
      });
      done();

    });

    it('generates from only host', done => {

      mockVertex._config.listen = '0.0.0.1';

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          host: '0.0.0.1',
          port: 65535
        }
      });
      done();

    });

    it('generates from only host:port', done => {

      mockVertex._config.listen = '0.0.0.1:9999';

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          host: '0.0.0.1',
          port: 9999
        }
      });
      done();

    });

    it('generates from device port', done => {

      mockVertex._config.listen = 'eth0:8888';

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          host: 'eth0',
          port: 8888
        },
      });
      done();

    });

    it('uses as supplied', done => {

      mockVertex._config.listen = {
        host: '0.0.0.0',
        port: 9999
      };

      let net = new Network(mockVertex);
      expect(net._config).to.eql({
        listen: {
          host: '0.0.0.0',
          port: 9999
        }
      });
      done();

    });

  });

  context('services', () => {

    context('registering', () => {

      it('prevents duplicate routeKeys')

    });

    context('routing', () => {

      it('does not allow access to system services from user socket');

      it('does not allow access to user services from system socket');

      it('routes inbound socket payloads by routeKey');

    });


  });


});
