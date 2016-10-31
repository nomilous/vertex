const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');
const VertexLogger = require('vertex-logger');

const Vertex = require('../');
const {KeyStore, Member} = Vertex;

describe(filename, () => {

  let mockVertex, mockCluster, addMemberHandler;

  beforeEach(() => {
    mockCluster = {
      log: new VertexLogger({name: 'cluster', root: 'test-node', level: 'off'}),
      config: {},
      members: {},
      _noConnect: true,
      on: (event, handler) => {
        if (event == 'member/add') addMemberHandler = handler;
      },
      _memberUpdated: () => {
      }
    };
  });

  beforeEach(() => {
    mockVertex = {
      cluster: mockCluster,
      server: {
        _onConnection: () => {
        }
      },
      getAddress: () => {
      }
    }
  });

  context('starting', () => {

    it('assigns default config', done => {

      let store = new KeyStore(mockCluster);
      expect(store.config).to.eql({
        timeout: 2000,
        limit: 42
      });
      done();

    });

    it('synchronises to new members if master', done => {

      mockCluster._master = true;
      let store = new KeyStore(mockCluster);
      let member = new Member(mockVertex, {name: 'member1'});

      member.self = false;
      member.socket = {
        send: (fragment) => {
          expect(fragment).to.eql([
            {
              FOR: Vertex.constants.CLUSTER_ROUTE_CODE,
              DO: Vertex.constants.CLUSTER_HANDLER_SYNC_1
            }, {
              data: {},
              next: 0,
              last: true
            }
          ]);
          done();
        }
      };

      addMemberHandler(member.name, member);

    });

  });


  context('seeding', () => {

    let store;

    beforeEach(() => {
      mockCluster._master = true;
      store = new KeyStore(mockCluster);
    });

    it('creates a store', done => {

      let test = store.createStore('test');
      expect(store._stores).to.eql({
        test: {
          name: 'test',
          data: {}
        }
      });
      done();

    });

    it('can set a value', done => {

      let test = store.createStore('test');

      test.set('x', 1);

      expect(store._sequence).to.eql({
        0: {
          store: 'test',
          key: 'x'
        }
      });
      expect(store._stores).to.eql({
        test: {
          name: 'test',
          data: {
            x: {
              seq: 0,
              val: 1
            }
          }
        }
      });

      expect(test.get('x')).to.be(1);
      expect(test.has('x')).to.be(true);

      done();

    });

    it('allows for the seeding of only one value (?)', done => {

      // this is for the master to write it's own membership record before there is a cluster
      // all other changes must wait for replicate-ability even if there is only the master in the cluster

      let test = store.createStore('test');
      test.set('x', 1);
      test.set('y', 2);

      expect(store._sequence).to.eql({
        0: {
          store: 'test',
          key: 'x'
        }
      });
      expect(store._stores).to.eql({
        test: {
          name: 'test',
          data: {
            x: {
              seq: 0,
              val: 1
            }
          }
        }
      });

      expect(test.get('x')).to.be(1);
      expect(test.has('x')).to.be(true);

      done();


    })

  });


  context('operational', () => {

    let store, wasSent = [];

    beforeEach(() => {

      mockCluster.getMaster = () => {
        return Promise.resolve({
          // instanceof Member with _sys socket
          _sys: {
            send: (update) => {
              wasSent.push(update);
              return Promise.resolve({store1: true});
            }
          }
        });
      };

      store = new KeyStore(mockCluster);
      store._ready = true;
    });

    it('can delete a key', done => {

      // delete happens-at/is-replicate-via  master
      // (this only tests that the request is made)

      let test = store.createStore('test');

      test.set('x', 1)

        .then(result => {
          expect(result).to.be(true);
          return test.del('x', {options: true});
        })

        .then((result) => {
          expect(result).to.be(true);
        })

        .then(() => {
          expect(wasSent).to.eql([
            [
              {
                FOR: Vertex.constants.CLUSTER_ROUTE_CODE,
                DO: Vertex.constants.CLUSTER_HANDLER_STORE_1
              },
              {
                store: 'test',
                act: 'set',
                key: 'x',
                value: 1
              }
            ],
            [
              {
                FOR: Vertex.constants.CLUSTER_ROUTE_CODE,
                DO: Vertex.constants.CLUSTER_HANDLER_STORE_1
              },
              {
                store: 'test',
                act: 'del',
                key: 'x',
                opts: {options: true}
              }
            ]
          ]);
        })

        .then(done).catch(done);

    });

  });

});
