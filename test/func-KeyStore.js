const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');

const hooks = require('./lib/hooks');

describe(filename, function () {

  context('set', () => {

    let cluster = {
      size: 10,
      namebase: 'node-',
      wait: true,
      logLevel: 'off',
      each: true
    };

    hooks.startCluster(cluster);
    hooks.stopCluster(cluster);

    it('replicates a new store (only on first set?)', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test');

      store.set('key', 'value')

        .then(result => {
          expect(result.ok).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test.data.key
          })
        })

        .then(results => {
          expect(results).to.eql([
            {seq: 10, val: 'value'},
            {seq: 10, val: 'value'},
            {seq: 10, val: 'value'},
            {seq: 10, val: 'value'},
            {seq: 10, val: 'value'},
            {seq: 10, val: 'value'},
            {seq: 10, val: 'value'},
            {seq: 10, val: 'value'},
            {seq: 10, val: 'value'},
            {seq: 10, val: 'value'}
          ])
        })

        .then(done).catch(done);

    });

    it('can set value as undefined', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test');

      store.set('key')

        .then(result => {
          expect(result.ok).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test.data.key
          })
        })

        .then(results => {
          expect(results).to.eql([
            {seq: 10},
            {seq: 10},
            {seq: 10},
            {seq: 10},
            {seq: 10},
            {seq: 10},
            {seq: 10},
            {seq: 10},
            {seq: 10},
            {seq: 10}
          ])
        })

        .then(done).catch(done);

    });

    it('can set value as null', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test');

      store.set('key', null)

        .then(result => {
          expect(result.ok).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test.data.key
          })
        })

        .then(results => {
          expect(results).to.eql([
            {seq: 10, val: null},
            {seq: 10, val: null},
            {seq: 10, val: null},
            {seq: 10, val: null},
            {seq: 10, val: null},
            {seq: 10, val: null},
            {seq: 10, val: null},
            {seq: 10, val: null},
            {seq: 10, val: null},
            {seq: 10, val: null}
          ])
        })

        .then(done).catch(done);

    });

    it('can set value as boolean', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test');

      store.set('key', true)

        .then(result => {
          expect(result.ok).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test.data.key
          })
        })

        .then(results => {
          expect(results).to.eql([
            {seq: 10, val: true},
            {seq: 10, val: true},
            {seq: 10, val: true},
            {seq: 10, val: true},
            {seq: 10, val: true},
            {seq: 10, val: true},
            {seq: 10, val: true},
            {seq: 10, val: true},
            {seq: 10, val: true},
            {seq: 10, val: true}
          ])
        })

        .then(done).catch(done);

    });

    it('can set value as array', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test');

      store.set('key', [1, 2, 3])

        .then(result => {
          expect(result.ok).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test.data.key
          })
        })

        .then(results => {
          expect(results).to.eql([
            {seq: 10, val: [1, 2, 3]},
            {seq: 10, val: [1, 2, 3]},
            {seq: 10, val: [1, 2, 3]},
            {seq: 10, val: [1, 2, 3]},
            {seq: 10, val: [1, 2, 3]},
            {seq: 10, val: [1, 2, 3]},
            {seq: 10, val: [1, 2, 3]},
            {seq: 10, val: [1, 2, 3]},
            {seq: 10, val: [1, 2, 3]},
            {seq: 10, val: [1, 2, 3]}
          ])
        })

        .then(done).catch(done);

    });

    it('can set value as object', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test');

      store.set('key', {1: 23})

        .then(result => {
          expect(result.ok).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test.data.key
          })
        })

        .then(results => {
          expect(results).to.eql([
            {seq: 10, val: {1: 23}},
            {seq: 10, val: {1: 23}},
            {seq: 10, val: {1: 23}},
            {seq: 10, val: {1: 23}},
            {seq: 10, val: {1: 23}},
            {seq: 10, val: {1: 23}},
            {seq: 10, val: {1: 23}},
            {seq: 10, val: {1: 23}},
            {seq: 10, val: {1: 23}},
            {seq: 10, val: {1: 23}}
          ])
        })

        .then(done).catch(done);

    });

    it('can replace key', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test');

      store.set('key', 1)

        .then()

        .then(result => {
          expect(result.ok).to.be(true);
          return store.set('key', 2);
        })

        .then(() => {
          return servers.map(server => {
            return server.cluster._stores._stores.test.data.key
          });
        })

        .then(results => {
          expect(results).to.eql([
            {seq: 11, val: 2},
            {seq: 11, val: 2},
            {seq: 11, val: 2},
            {seq: 11, val: 2},
            {seq: 11, val: 2},
            {seq: 11, val: 2},
            {seq: 11, val: 2},
            {seq: 11, val: 2},
            {seq: 11, val: 2},
            {seq: 11, val: 2}
          ])
        })

        .then(done).catch(done);

    });

  });

  context('get', () => {

    let cluster = {
      size: 10,
      namebase: 'node-',
      wait: true,
      logLevel: 'off',
      each: true
    };

    hooks.startCluster(cluster);
    hooks.stopCluster(cluster);

    it('can get value', done => {

      let {servers} = cluster;
      let store3 = servers[3].cluster._stores.createStore('test');
      let store5 = servers[5].cluster._stores.createStore('test');
      let store9 = servers[9].cluster._stores.createStore('test');

      store9.set('key', 1)

        .then(result => {
          expect(result.ok).to.be(true);

          expect(store3.get('key')).to.equal(1);
          expect(store5.get('key')).to.equal(1);
          expect(store9.get('key')).to.equal(1);
        })

        .then(done).catch(done);

    });

  });


  context('has', () => {

    let cluster = {
      size: 10,
      namebase: 'node-',
      wait: true,
      logLevel: 'off',
      each: true
    };

    hooks.startCluster(cluster);
    hooks.stopCluster(cluster);

    it('can has value', done => {

      let {servers} = cluster;
      let store3 = servers[3].cluster._stores.createStore('test');
      let store5 = servers[5].cluster._stores.createStore('test');
      let store9 = servers[9].cluster._stores.createStore('test');

      store9.set('key', 1)

        .then(result => {
          expect(result.ok).to.be(true);

          expect(store3.has('key')).to.equal(true);
          expect(store5.has('key')).to.equal(true);
          expect(store9.has('key')).to.equal(true);

          expect(store3.has('nokey')).to.equal(false);
          expect(store5.has('nokey')).to.equal(false);
          expect(store9.has('nokey')).to.equal(false);
        })

        .then(done).catch(done);

    });

  });


  context('del', () => {

    let cluster = {
      size: 10,
      namebase: 'node-',
      wait: true,
      logLevel: 'off',
      each: true
    };

    hooks.startCluster(cluster);
    hooks.stopCluster(cluster);

    it('can delete key', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test');

      store.set('key', 1)

        .then()

        .then(result => {
          expect(result.ok).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test.data.key
          });
        })

        .then(results => {
          expect(results).to.eql([
            {seq: 10, val: 1},
            {seq: 10, val: 1},
            {seq: 10, val: 1},
            {seq: 10, val: 1},
            {seq: 10, val: 1},
            {seq: 10, val: 1},
            {seq: 10, val: 1},
            {seq: 10, val: 1},
            {seq: 10, val: 1},
            {seq: 10, val: 1}
          ])
        })

        .then(() => {
          return store.del('key');
        })

        .then(result => {
          expect(result.ok).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test.data.key
          });
        })

        .then(results => {
          expect(results).to.eql([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
          ])
        })

        .then(done).catch(done);

    });

  });


  context('consensus option', () => {

    let cluster = {
      size: 10,
      namebase: 'node-',
      wait: true,
      logLevel: (nfo) => {
        // if (nfo.name == 'keystore' && nfo.ancestors[0] == 'node-0') {
        //   return 'trace';
        // }
        return 'off';
      },
      each: true
    };

    hooks.startCluster(cluster);
    hooks.stopCluster(cluster);

    context('set', () => {

      it('is not applied and returns false if unconfirmed', done => {

        let {servers} = cluster;
        let store9 = servers[9].cluster._stores.createStore('test');

        store9.set('key', 1, {consensus: .4, expire: 100})

          .then(result => {
            expect(result.ok).to.be(false);
          })

          .then(done).catch(done);

      });

      it('is not applied and returns false if unconfirmed to multiple', done => {

        let {servers} = cluster;
        let store9 = servers[9].cluster._stores.createStore('test');
        let store8 = servers[8].cluster._stores.createStore('test');
        let store7 = servers[7].cluster._stores.createStore('test');

        Promise.all([
          store9.set('key', 1, {consensus: .4, expire: 100}),
          store8.set('key', 1, {consensus: .4, expire: 100}),
          store7.set('key', 1, {consensus: .4, expire: 100})
        ])
          .then(results => {
            expect(results.map(r => r.ok)).to.eql([
              false, false, false
            ]);
          })

          .then(done).catch(done);

      });

      it('is applied and returns true if confirmed', done => {

        let {servers} = cluster;
        let store9 = servers[9].cluster._stores.createStore('test');
        let store8 = servers[8].cluster._stores.createStore('test');
        let store7 = servers[7].cluster._stores.createStore('test');
        let store6 = servers[6].cluster._stores.createStore('test');
        let store5 = servers[5].cluster._stores.createStore('test');

        Promise.all([
          store9.set('key', 1, {consensus: .4, expire: 100}),
          store8.set('key', 1, {consensus: .4, expire: 100}),
          store7.set('key', 1, {consensus: .4, expire: 100}),
          store6.set('key', 1, {consensus: .4, expire: 100})
        ])
          .then(results => {
            expect(results.map(r => r.ok)).to.eql([
              true, true, true, true
            ]);

            expect(store9.get('key')).to.be(1);
            expect(store8.get('key')).to.be(1);
            expect(store7.get('key')).to.be(1);
            expect(store6.get('key')).to.be(1);

            // an the set went out to others
            expect(store5.get('key')).to.be(1);
          })

          .then(done).catch(done);

      });

      it('returns false on differing value', done => {

        let {servers} = cluster;
        let store9 = servers[9].cluster._stores.createStore('test');
        let store8 = servers[8].cluster._stores.createStore('test');
        let store7 = servers[7].cluster._stores.createStore('test');
        let store6 = servers[6].cluster._stores.createStore('test');
        let store5 = servers[5].cluster._stores.createStore('test');

        Promise.all([
          store9.set('key', 1, {consensus: .4, expire: 100}),
          store8.set('key', 1, {consensus: .4, expire: 100}),
          store7.set('key', 1, {consensus: .4, expire: 100}),
          store6.set('key', 2, {consensus: .4, expire: 100})
        ])
          .then(results => {
            expect(results.map(r => r.ok)).to.eql([
              false, false, false, false
            ]);

            expect(store9.get('key')).to.be(undefined);
            expect(store8.get('key')).to.be(undefined);
            expect(store7.get('key')).to.be(undefined);
            expect(store6.get('key')).to.be(undefined);
            expect(store5.get('key')).to.be(undefined);
          })

          .then(done).catch(done);

      });

      it('returns false on differing object', done => {

        let {servers} = cluster;
        let store9 = servers[9].cluster._stores.createStore('test');
        let store8 = servers[8].cluster._stores.createStore('test');
        let store7 = servers[7].cluster._stores.createStore('test');
        let store6 = servers[6].cluster._stores.createStore('test');
        let store5 = servers[5].cluster._stores.createStore('test');

        Promise.all([
          store9.set('key', {x: 1}, {consensus: .4, expire: 100}),
          store8.set('key', {x: 1}, {consensus: .4, expire: 100}),
          store7.set('key', {x: 1}, {consensus: .4, expire: 100}),
          store6.set('key', {x: 2}, {consensus: .4, expire: 100})
        ])
          .then(results => {
            expect(results.map(r => r.ok)).to.eql([
              false, false, false, false
            ]);

            expect(store9.get('key')).to.be(undefined);
            expect(store8.get('key')).to.be(undefined);
            expect(store7.get('key')).to.be(undefined);
            expect(store6.get('key')).to.be(undefined);
            expect(store5.get('key')).to.be(undefined);
          })

          .then(done).catch(done);


      });

      it('disconnecting a member re-evaluates waiting consensuses', done => {

        let {servers} = cluster;
        let store1 = servers[1].cluster._stores.createStore('test');
        let store2 = servers[2].cluster._stores.createStore('test');
        let store3 = servers[3].cluster._stores.createStore('test');
        let store4 = servers[4].cluster._stores.createStore('test');
        let store5 = servers[5].cluster._stores.createStore('test');

        Promise.all([
          store1.set('key', 1, {consensus: .4, expire: 300}),
          store2.set('key', 1, {consensus: .4, expire: 300}),
          store4.set('key', 1, {consensus: .4, expire: 300})
          // insufficient to reach 4/10 consensus
        ])
          .then(results => {
            expect(results.map(r => r.ok)).to.eql([
              true, true, true
            ]);

            expect(store1.get('key')).to.be(1);
            expect(store2.get('key')).to.be(1);
            expect(store3.get('key')).to.be(1);
            expect(store4.get('key')).to.be(1);
            expect(store5.get('key')).to.be(1);
          })

          .then(() => {
            // it was cleaned up
            expect(servers[0].cluster._stores._consensus).to.eql({});
          })

          .then(done).catch(done);

        // stop 3 servers,
        // 3/7 > 4/10 (consensus reached)
        setTimeout(() => {
          Promise.all([
            servers.pop().$stop(),
            servers.pop().$stop(),
            servers.pop().$stop()
          ]).catch(done);
        }, 200);

      });

    });

    context('del', () => {

      it('is not applied and returns false if unconfirmed', done => {

        let {servers} = cluster;
        let store9 = servers[9].cluster._stores.createStore('test');
        let store8 = servers[8].cluster._stores.createStore('test');

        store9.set('key', 1)

          .then(result => {
            expect(result.ok).to.be(true);
            expect(store8.get('key')).to.be(1);
            return store9.del('key', {consensus: .4, expire: 100});
          })

          .then(result => {
            expect(result.ok).to.be(false);
            expect(store9.get('key')).to.be(1);
            expect(store8.get('key')).to.be(1);
          })

          .then(done).catch(done);

      });

      it('is applied and returns true if confirmed', done => {

        let {servers} = cluster;
        let store9 = servers[9].cluster._stores.createStore('test');
        let store8 = servers[8].cluster._stores.createStore('test');
        let store7 = servers[7].cluster._stores.createStore('test');
        let store6 = servers[6].cluster._stores.createStore('test');

        store9.set('key', 1)

          .then(result => {
            expect(result.ok).to.be(true);
            expect(store8.get('key')).to.be(1);
            return Promise.all([
              store9.del('key', {consensus: .4, expire: 100}),
              store8.del('key', {consensus: .4, expire: 100}),
              store7.del('key', {consensus: .4, expire: 100}),
              store6.del('key', {consensus: .4, expire: 100})
            ]);
          })

          .then(results => {
            expect(results.map(r => r.ok)).to.eql([true, true, true, true]);
            expect(store9.get('key')).to.be(undefined);
            expect(store8.get('key')).to.be(undefined);
            expect(store7.get('key')).to.be(undefined);
            expect(store6.get('key')).to.be(undefined);
          })

          .then(done).catch(done);

      });

    });

  });

  context('load', function () {

    // TODO: try with/without deepcopy

    this.timeout(10 * 1000);

    let setCount = 200;

    let setMany = function* (store) {
      for (let i = 0; i < setCount; i++) {
        yield store.set('key-' + i, {some: 'data'});
      }
    };

    [2, 4, 6, 8, 10, 12, 14, 16, 18, 20].forEach(clusterSize => {

      context('in cluster of ' + clusterSize, () => {

        let cluster = {
          size: clusterSize,
          namebase: 'node-',
          logLevel: 'off',
          wait: true,
          each: true
        };

        hooks.startCluster(cluster);
        hooks.stopCluster(cluster);

        it('sets ' + setCount + ' keys', done => {

          let {servers} = cluster;
          let store = servers[clusterSize - 1].cluster._stores.createStore('test');

          Promise.all(setMany(store))

            .then(results => {
              expect(results.length).to.be(setCount);
              expect(results.filter(r => !r.ok).length).to.be(0);
            })

            .then(done).catch(done);

        });

      });

    });

  });

});
