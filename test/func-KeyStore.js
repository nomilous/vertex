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


    it('can replace key', done => {

      let {servers} = cluster;
      let store = servers[9].cluster._stores.createStore('test4');

      store.set('key1', true)

        .then()

        .then(result => {
          expect(result).to.be(true);
          return store.set('key1', false);
        })

        .then(() => {
          return servers.map(server => {
            return server.cluster._stores._stores.test4.data.key1
          });
        })

        .then(results => {
          expect(results).to.eql([
            { seq: 11, val: false },
            { seq: 11, val: false },
            { seq: 11, val: false },
            { seq: 11, val: false },
            { seq: 11, val: false },
            { seq: 11, val: false },
            { seq: 11, val: false },
            { seq: 11, val: false },
            { seq: 11, val: false },
            { seq: 11, val: false }
          ])
        })

        .then(done).catch(done);

    });



  });

  context('get', () => {


  });

  context('delete', () => {


  });

});
