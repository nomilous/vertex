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
      let store = servers[9].cluster._stores.createStore('test1');

      store.set('key1', 'value1')

        .then(result => {
          expect(result).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test1.data.key1
          })
        })

        .then(results => {
          expect(results).to.eql([
            { seq: 10, val: 'value1' },
            { seq: 10, val: 'value1' },
            { seq: 10, val: 'value1' },
            { seq: 10, val: 'value1' },
            { seq: 10, val: 'value1' },
            { seq: 10, val: 'value1' },
            { seq: 10, val: 'value1' },
            { seq: 10, val: 'value1' },
            { seq: 10, val: 'value1' },
            { seq: 10, val: 'value1' }
          ])
        })

        .then(done).catch(done);

    });

    it('can set value as undefined', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test2');

      store.set('key1')

        .then(result => {
          expect(result).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test2.data.key1
          })
        })

        .then(results => {
          expect(results).to.eql([
            { seq: 10 },
            { seq: 10 },
            { seq: 10 },
            { seq: 10 },
            { seq: 10 },
            { seq: 10 },
            { seq: 10 },
            { seq: 10 },
            { seq: 10 },
            { seq: 10 }
          ])
        })

        .then(done).catch(done);

    });

    it('can set value as null', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test3');

      store.set('key1', null)

        .then(result => {
          expect(result).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test3.data.key1
          })
        })

        .then(results => {
          expect(results).to.eql([
            { seq: 10, val: null },
            { seq: 10, val: null },
            { seq: 10, val: null },
            { seq: 10, val: null },
            { seq: 10, val: null },
            { seq: 10, val: null },
            { seq: 10, val: null },
            { seq: 10, val: null },
            { seq: 10, val: null },
            { seq: 10, val: null }
          ])
        })

        .then(done).catch(done);

    });

    it('can set value as boolean', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test4');

      store.set('key1', true)

        .then(result => {
          expect(result).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test4.data.key1
          })
        })

        .then(results => {
          expect(results).to.eql([
            { seq: 10, val: true },
            { seq: 10, val: true },
            { seq: 10, val: true },
            { seq: 10, val: true },
            { seq: 10, val: true },
            { seq: 10, val: true },
            { seq: 10, val: true },
            { seq: 10, val: true },
            { seq: 10, val: true },
            { seq: 10, val: true }
          ])
        })

        .then(done).catch(done);

    });

    it('can set value as array', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test4');

      store.set('key1', [1, 2, 3])

        .then(result => {
          expect(result).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test4.data.key1
          })
        })

        .then(results => {
          expect(results).to.eql([
            { seq: 10, val: [1, 2, 3] },
            { seq: 10, val: [1, 2, 3] },
            { seq: 10, val: [1, 2, 3] },
            { seq: 10, val: [1, 2, 3] },
            { seq: 10, val: [1, 2, 3] },
            { seq: 10, val: [1, 2, 3] },
            { seq: 10, val: [1, 2, 3] },
            { seq: 10, val: [1, 2, 3] },
            { seq: 10, val: [1, 2, 3] },
            { seq: 10, val: [1, 2, 3] }
          ])
        })

        .then(done).catch(done);

    });

    it('can set value as object', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test4');

      store.set('key1', {1: 23})

        .then(result => {
          expect(result).to.be(true);
          return servers.map(server => {
            return server.cluster._stores._stores.test4.data.key1
          })
        })

        .then(results => {
          expect(results).to.eql([
            { seq: 10, val: {1: 23} },
            { seq: 10, val: {1: 23} },
            { seq: 10, val: {1: 23} },
            { seq: 10, val: {1: 23} },
            { seq: 10, val: {1: 23} },
            { seq: 10, val: {1: 23} },
            { seq: 10, val: {1: 23} },
            { seq: 10, val: {1: 23} },
            { seq: 10, val: {1: 23} },
            { seq: 10, val: {1: 23} }
          ])
        })

        .then(done).catch(done);

    });

    it('can replace key', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test4');

      store.set('key1', 1)

        .then()

        .then(result => {
          expect(result).to.be(true);
          return store.set('key1', 2);
        })

        .then(() => {
          return servers.map(server => {
            return server.cluster._stores._stores.test4.data.key1
          });
        })

        .then(results => {
          expect(results).to.eql([
            { seq: 11, val: 2 },
            { seq: 11, val: 2 },
            { seq: 11, val: 2 },
            { seq: 11, val: 2 },
            { seq: 11, val: 2 },
            { seq: 11, val: 2 },
            { seq: 11, val: 2 },
            { seq: 11, val: 2 },
            { seq: 11, val: 2 },
            { seq: 11, val: 2 }
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
      let store3 = servers[3].cluster._stores.createStore('test1');
      let store5 = servers[5].cluster._stores.createStore('test1');
      let store9 = servers[9].cluster._stores.createStore('test1');

      store9.set('key1', 1)

        .then(result => {
          expect(result).to.equal(true);

          expect(store3.get('key1')).to.equal(1);
          expect(store5.get('key1')).to.equal(1);
          expect(store9.get('key1')).to.equal(1);
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
      let store3 = servers[3].cluster._stores.createStore('test1');
      let store5 = servers[5].cluster._stores.createStore('test1');
      let store9 = servers[9].cluster._stores.createStore('test1');

      store9.set('key1', 1)

        .then(result => {
          expect(result).to.equal(true);

          expect(store3.has('key1')).to.equal(true);
          expect(store5.has('key1')).to.equal(true);
          expect(store9.has('key1')).to.equal(true);

          expect(store3.has('key2')).to.equal(false);
          expect(store5.has('key2')).to.equal(false);
          expect(store9.has('key2')).to.equal(false);
        })

        .then(done).catch(done);

    });

  });



  context('del', () => {


  });

});
