const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');

const Vertex = require('../');
const hooks = require('./lib/hooks');

describe(filename, () => {

  let logLevel = (nfo) => {
    return 'off';
  };

  context('starting cluster', () => {

    let vertex;

    afterEach('stop vertex', done => {
      if (!vertex) return done();
      vertex.$stop().then(done).catch(done);
      vertex = undefined;
    });

    it('does not start cluster if no config.cluster', done => {

      Vertex.create({logLevel: logLevel})

        .then(_vertex => {
          vertex = _vertex;
          expect(!vertex.cluster).to.equal(true);
          done();
        })
        .catch(done);

    });

    it('fails to start if no join list', done => {

      Vertex.create({
        logLevel: logLevel,
        cluster: {
          join: {}
        }
      })
        .then(_vertex => {
          vertex = _vertex;
        })
        .catch(error => {
          expect(error instanceof Vertex.errors.VertexJoinError).to.equal(true);
          expect(error.message).to.be('Missing join list');
          done();
        })
        .catch(done);

    });

    it('fails to join all not responding', done => {

      Vertex.create({
        logLevel: logLevel,
        cluster: {
          join: {
            0: '127.0.0.1:9999', // nothing here
            1: '127.0.0.1:8888', // nothing here
            2: '127.0.0.1:7777'  // nothing here
          }
        }
      })
        .then(_vertex => {
          vertex = _vertex;
        })
        .catch(error => {
          expect(error instanceof Vertex.errors.VertexJoinError).to.equal(true);
          expect(error.message).to.be('No available hosts');
          done();
        })
        .catch(done);
    });

    it('cannot join self', done => {

      Vertex.create({
        logLevel: logLevel,
        server: {
          listen: '127.0.0.1:9999',
        },
        cluster: {
          join: {
            0: '127.0.0.1:9999',
          }
        }
      })
        .then(_vertex => {
          vertex = _vertex;
        })
        .catch(error => {
          expect(error instanceof Vertex.errors.VertexJoinError).to.equal(true);
          expect(error.message).to.be('Cannot join only self');
          done();
        })
        .catch(done);

    });

    it('starts new cluster if seed', done => {

      Vertex.create({
        name: 'me',
        logLevel: logLevel,
        server: {
          listen: '127.0.0.1:9999'
        },
        cluster: {
          name: 'cluster1',
          seed: true,
          join: {
            0: '127.0.0.1:9999',
            1: '127.0.0.1:8888',
            3: '127.0.0.1:7777'
          }
        }
      })
        .then(_vertex => {
          vertex = _vertex;
          expect(vertex.name).to.be('me');
          expect(vertex.cluster.members.me.self).to.be(true);
          expect(vertex.cluster.name).to.be('cluster1');
          expect(vertex.cluster._master).to.equal(true);
          expect(vertex.cluster._ready).to.be(true);

          return vertex.cluster.getMaster()
        })

        .then(master => {
          expect(master).to.eql(vertex.cluster.members.me);
        })

        .then(done).catch(done);

    });

    it('assigns cluster name if unassigned', done => {

      Vertex.create({
        logLevel: logLevel,
        server: {
          listen: '127.0.0.1:9999',
        },
        cluster: {
          seed: true,
          join: {
            0: '127.0.0.1:9999',
            1: '127.0.0.1:8888',
            3: '127.0.0.1:7777'
          }
        }
      })
        .then(_vertex => {
          vertex = _vertex;
          expect(typeof vertex.cluster.name).to.equal('string');
          expect(vertex.cluster._master).to.equal(true);
          done();
        })
        .catch(done);

    });

  });


  context('joining cluster', () => {

    let cluster = {
      size: 10,
      clusterName: 'xxx',
      namebase: 'node-',
      wait: true,
      logLevel: (info) => {
        return 'off';
      },
      each: true
    };

    hooks.startCluster(cluster);
    hooks.stopCluster(cluster);

    it('started a cluster', done => {

      expect(cluster.servers.length).to.be(10);
      done();

    });

    it('can connect new member to master', done => {

      let config = {
        logLevel: logLevel,
        name: 'node-10',
        server: {
          listen: '0.0.0.0:9999'
        },
        cluster: {
          name: 'xxx',
          join: {
            0: cluster.servers[0].getAddress()
          }
        }
      };

      Vertex.create(config)

        .then(vertex => {
          cluster.servers.push(vertex);

          // resolves already fully connected
          expect(Object.keys(vertex.cluster.members).length).to.be(11);
        })

        .then(done).catch(done);

    });

    it('can connect new member to other than master', done => {

      let config = {
        logLevel: logLevel,
        name: 'node-10',
        server: {
          listen: '0.0.0.0:9999'
        },
        cluster: {
          name: 'xxx',
          join: {
            0: cluster.servers[9].getAddress()
          }
        }
      };

      Vertex.create(config)

        .then(vertex => {
          cluster.servers.push(vertex);
          expect(Object.keys(vertex.cluster.members).length).to.be(11);
        })

        .then(done).catch(done);

    });


    it('cannot join with wrong cluster name', done => {

      let config = {
        logLevel: logLevel,
        name: 'node-10',
        server: {
          listen: '0.0.0.0:9999'
        },
        cluster: {
          name: 'wrong',
          join: {
            0: cluster.servers[0].getAddress()
          }
        }
      };

      Vertex.create(config)

        .then(vertex => {
          cluster.servers.push(vertex);
        })

        .catch(error => {
          expect(error instanceof Vertex.errors.VertexJoinError).to.be(true);
          expect(error.message).to.be('Error: Expected cluster name \'xxx\' (or undefined)');
          done();
        })
        .catch(done);

    });

  });


  context('departing cluster', () => {

    it('can be done');

  })


});
