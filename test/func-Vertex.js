const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');

const Vertex = require('../');
const {Network} = Vertex;
const {VertexJoinError} = Vertex.errors;

describe(filename, () => {

  let vertex;

  afterEach('stop vertex', (done) => {
    if (!vertex) return done();
    vertex.$stop().then(done).catch(done);
  });

  it('starts a vertex with defaults', done => {

    Vertex.create()

      .then(_vertex => {
        vertex = _vertex;
        expect(typeof vertex.name).to.equal('string');
        expect(vertex._net instanceof Network).to.equal(true);
      })

      .then(done).catch(done)

  });

  it('can start a second time because it stopped properly', done => {
    // and freed the ports

    Vertex.create()

      .then(_vertex => {
        vertex = _vertex;
        console.log(vertex);
      })

      .then(done).catch(done);

  });

  it('does not start listening if listen is null', done => {

    Vertex.create({listen: null})

      .then(_vertex => {
        vertex = _vertex;
        expect(
          vertex._net === null ||
          (vertex._net._sys === null && vertex._net._usr === null)
        ).to.equal(true);
        done();
      })

      .catch(done);

  });

  it('creates a logger at the specified level', done => {

    Vertex.create({listen: null, logLevel: 'debug'})

      .then(_vertex => {
        vertex = _vertex;
        expect(vertex.log.level).to.equal('debug');
        done();
      })

      .catch(done);

  });


  context('cluster', () => {

    context('config', () => {

      xit('does not start cluster if no config.join', done => {

        Vertex.create()

          .then(_vertex => {
            vertex = _vertex;
            expect(!vertex._cluster).to.equal(true);
            done();
          })
          .catch(done);

      });

    });

    context('starting', () => {

      it('fails to start if no join list', done => {

        Vertex.create({
          join: {}
        })
          .then(_vertex => {
            vertex = _vertex;
          })
          .catch(error => {
            expect(error instanceof VertexJoinError).to.equal(true);
            expect(error.message).to.be('Missing join list');
            done();
          });

      });

    });

    context('join as first', () => {

      it('fails to join if not seed', done => {

        Vertex.create({
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
            expect(error instanceof VertexJoinError).to.equal(true);
            expect(error.message).to.be('No available hosts');
            done();
          })
          .catch(done);
      });

      it('cannot join self', done => {

        Vertex.create({
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
            expect(error instanceof VertexJoinError).to.equal(true);
            expect(error.message).to.be('Cannot join only self');
            done();
          })
          .catch(done);

      });

      it('starts new cluster if seed', done => {

        Vertex.create({
          logLevel: 'debug',
          server: {
            listen: '127.0.0.1:9999'
          },
          cluster: {
            // name: 'cluster1',
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
            console.log(vertex);
            console.log('\n\nRESUME\n\n');
            // expect(vertex._cluster.name).to.equal('cluster1');
            // expect(vertex._cluster._master).to.equal(true);
            done();
          })
          .catch(done);

      });

      it('assigns cluster name if unassigned', done => {

        Vertex.create({
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
            expect(typeof vertex._cluster.name).to.equal('string');
            expect(vertex._cluster._master).to.equal(true);
            done();
          })
          .catch(done);

      });

    });

    context('join one', () => {

      let remote;

      beforeEach('start remote vertex', (done) => {
        Vertex.create({
          logLevel: 'debug',
          server: {
            listen: 9999
          },
          cluster: {
            name: 'cluster-name',
            seed: true,
            join: {
              0: 'localhost:9999',
              1: 'localhost:7777'
            }
          }
        })
          .then(vertex => {
            remote = vertex;
            done();
          })
          .catch(done);
      });

      afterEach('stop remote vertex', (done) => {
        if (!remote) return done();
        remote.$stop().then(done).catch(done);
      });

      it('cannot join cluster with wrong name', done => {

        Vertex.create({
          logLevel: 'debug',
          cluster: {
            name: 'wrong-name',
            join: {
              0: 'localhost:9999'
            }
          }
        })

          .then(_vertex => {
            vertex = _vertex;
          })

          .catch(error => {
            expect(error.message).to.equal('Error: Expected cluster name \'cluster-name\' (or undefined)');
            done();
          })
          .catch(done);

      });

      xit('receives membership log from master and creates member instances', done => {

        Vertex.create({
          logLevel: 'debug',
          cluster: {
            join: {
              0: 'localhost:9999'
            }
          }
        })

          .then(_vertex => {
            vertex = _vertex;
            expect(Object.keys(vertex._cluster._members).length).to.equal(2);
            done();
          })

          .catch(done);

      });

    });

    context('join many', () => {

      it('waits for all connections');

      it('closes all sockets');

    });


    context('join many with departure', () => {

      it('waits for all connections');

    });

  });


  context('services', () => {

    context('register', () => {

      it('can');

    });

  });

});
