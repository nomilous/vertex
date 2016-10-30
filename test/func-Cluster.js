const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');

const Vertex = require('../');
const hooks = require('./lib/hooks');

describe.only(filename, () => {

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

  it('can connect new member to other than master', done => {

    let config = {
      name: 'node-10',
      server: {
        listen: '0.0.0.0:9999'
      },
      cluster: {
        name: 'xxx',
        join: {
          0: cluster.servers[  9  ].getAddress()
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
      name: 'node-10',
      server: {
        listen: '0.0.0.0:9999'
      },
      cluster: {
        name:      'wrong',
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
