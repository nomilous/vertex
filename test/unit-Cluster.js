const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');

const {Cluster, errors} = require('../');
const {VertexJoinError} = errors;
const VertexLogger = require('vertex-logger');

describe(filename, () => {

  let mockVertex;

  beforeEach(() => {
    mockVertex = {
      server: {
        registerService: () => {}
      },
      log: new VertexLogger()
    }
  });

  context('default config', () => {

    it('throws if no join list', done => {

      let config = {
        join: {
          xxx: 'nothing'
        }
      }

      try {
        let cluster = new Cluster(mockVertex, 'cluster', config);
      } catch (e) {
        expect(e instanceof VertexJoinError).to.equal(true);
        expect(e.message).to.equal('Missing join list');
        done();
      }

    });

    it('fleshes out join list', done => {

      let config = {
        join: {
          0: '10.0.0.1',
          1: '10.0.0.2:12345',
          2: '9876',
          3: {
            host: '10.0.0.3'
          }
        }
      };

      let cluster = new Cluster(mockVertex, 'cluster', config);
      expect(cluster.config.join).to.eql({
        0: {
          host: '10.0.0.1',
          port: 65535
        },
        1: {
          host: '10.0.0.2',
          port: 12345
        },
        2: {
          host: '127.0.0.1',
          port: 9876
        },
        3: {
          host: '10.0.0.3',
          port: 65535
        },
        timeout: 1000
      });
      done();

    });

    it('supports IPv6 (does vertex-transport?)');

    it('assigns name is specified', done => {

      let config = {
        name: 'cluster1',
        join: {
          'xxx': 'nothing',
          1: '10.0.0.1:3',
        }
      };

      let cluster = new Cluster(mockVertex, 'cluster', config);
      expect(cluster.name).to.equal('cluster1');
      done();

    });

  });

});
