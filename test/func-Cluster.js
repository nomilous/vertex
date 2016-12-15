const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');

const Vertex = require('../');
const hooks = require('./lib/hooks');

// process.on('unhandledRejection', (reason, promise) => {
//   console.log('REASON', reason);
// });

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

    it('fails to join if incompatible version');

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


  context('departing cluster member', () => {

    let cluster = {
      size: 10,
      namebase: 'node-',
      wait: true,
      logLevel: (nfo) => {
        if (nfo.ancestors[0] == 'node-9') return 'off';
        return 'off';
      },
      each: true,
      leave: {
        expire: 100
      }
    };

    hooks.startCluster(cluster);
    hooks.stopCluster(cluster);

    it('stops the vertex on lost socket to self', done => {

      let {servers} = cluster;
      let server = servers.pop();
      let member = server.cluster.members[server.name];

      let error;
      server.on('error', _error => error = _error);

      server.on('stopped', () => {
        expect(error.name).to.be('VertexError');
        expect(error.message).to.be('Lost socket to self');
        done();
      });

      member.socket.close();

    });

    it('stops the vertex on lost socket where cluster disagrees', done => {

      let {servers} = cluster;
      let server = servers.pop();

      server.on('stopped', () => {
        setTimeout(() => {
          expect(
            Object.keys(servers[0].cluster._members).sort()
          ).to.eql([
            'node-0',
            'node-1',
            'node-2',
            'node-3',
            'node-4',
            // node-5 also shut down on stray socket close
            'node-6',
            'node-7',
            'node-8'
          ]);
          done();
        }, 200);
      });

      let member = server.cluster.members['node-5'];
      member.socket.close();
      // other members of the cluster are still connected to 5,
      // so this member gets shut down

    });


    it('deletes the member on cluster consensus on lost socket', done => {

      let {servers} = cluster;
      let server = servers.pop();

      // close socket to all members on this vertex
      Object.keys(server.cluster.members).reverse().forEach(name => {
        let member = server.cluster.members[name];
        if (member.name == 'node-0') return;
        if (member.self) return;


        // intervening on socket directly generates lots of errors
        member.socket.close();

      });
      server.cluster.members['node-0'].socket.close();

      setTimeout(() => {
        expect(
          servers.map(server => server.cluster._members['node-9'])
        ).to.eql([
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined
        ]);

        server.$stop().then(done).catch(done);

      }, 200);

    });

    it('removes a stopped vertex from the cluster', done => {

      let {servers} = cluster;
      let server = servers.pop();

      server.$stop()

        .then(() => {

          setTimeout(() => {
            expect(
              servers.map(server => server.cluster._members['node-9'])
            ).to.eql([
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined
            ]);

            done();

          }, 200);

        })

        .catch(done);

    });

    it('departed member can only rejoin after its departure is replicated (bug?)');

  });


  context('departing cluster master', () => {

    let cluster = {
      size: 10,
      namebase: 'node-',
      wait: true,
      logLevel: (nfo) => {
        if (nfo.ancestors[0] == 'node-0' && nfo.name == 'cluster') return 'off';
        return 'off';
      },
      each: true,
      leave: {
        expire: 500
      },
      nominate: {
        expire: 500
      }
    };

    hooks.startCluster(cluster);
    hooks.stopCluster(cluster);

    it('a new master is elected from next in sequence', done => {

      let {servers} = cluster;
      let master = servers.shift();

      let stop9 = servers.pop();
      let stop8 = servers.pop();
      let stop7 = servers.pop();

      process.nextTick(() => {
        stop9.$stop(); // test other members leave while master handover is in progress
        stop8.$stop();
        stop7.$stop();
      });

      master.$stop()

        .then(() => new Promise(resolve => setTimeout(resolve, 300)))

        .then(() => {
          expect(servers.map(server => server.cluster._masterName)).to.eql([
            'node-1',
            'node-1',
            'node-1',
            'node-1',
            'node-1',
            'node-1'
          ]);
        })

        .then(done).catch(done);

    });

    it('a new master is elected from next-next-next in sequence', done => {

      let {servers} = cluster;
      let master = servers.shift();

      let stop1 = servers.shift();
      let stop2 = servers.shift();
      let stop3 = servers.shift();

      process.nextTick(() => {
        stop2.$stop();
        setTimeout(() => {
          stop1.$stop();
          stop3.$stop();
        }, 20);
      });

      master.$stop()

        .then(() => new Promise(resolve => setTimeout(resolve, 300)))

        .then(() => {
          expect(servers.map(server => server.cluster._masterName)).to.eql([
            'node-4',
            'node-4',
            'node-4',
            'node-4',
            'node-4',
            'node-4'
          ]);
        })

        .then(done).catch(done);

    });


  });


});
