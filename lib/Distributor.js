// const {format} = require('util');
const {EventEmitter} = require('events');
const {VertexSocketClosedError} = require('vertex-transport').errors;

// const {VertexConfigError, VertexDistributionError} = require('./errors');
const constants = require('./constants');


class Distributor {

  constructor(cluster) {
    Object.defineProperty(this, '_cluster', {value: cluster});
    Object.defineProperty(this, '_sequence', {value: {}});
    Object.defineProperty(this, '_pending', {value: {}});
    Object.defineProperty(this, '_stores', {value: {}});
    Object.defineProperty(this, '_next', {value: 0, writable: true});
    Object.defineProperty(this, '_ready', {value: false, writable: true});
  }


  createStore(name) {
    if (this._stores[name]) {
      return this._stores[name].actions;
    }

    let store = this._stores[name] = {
      name: name,
      data: {}
    };

    Object.defineProperty(store, 'actions', {value: new EventEmitter});

    store.actions.set = (key, value) => {
      let type = typeof key;
      if (type != 'string' && type != 'boolean' && type != 'number') {
        return Promise.reject(new TypeError('Bad key type.'));
      }
      return this._doSet(store, key, value);
    };

    store.actions.del = (key) => {
      // TODO: not if not master
      // TODO: allow remote to reject
      //   (eg: member already exists with different address)
      //   (or have validation step locally loginstance.validate)
      // TODO: _next++
      return new Promise((resolve, reject) => {

        resolve();
      });
    };

    return store.actions;

  }


  _doSet(store, key, value) {
    if (!this._ready &&
      this._cluster._master &&
      Object.keys(this._cluster.members).length == 0) {
      return this._doSetSeed(store, key, value)
    }
    return new Promise((resolve, reject) => {
      console.log('SET in %s:', store.name, key, value);
      this._cluster.getMaster()
        .then(master => {
          return master._sys.send([{
            FOR: constants.CLUSTER_ROUTE_CODE,
            DO: constants.CLUSTER_HANDLER_STORE_1
          }, {
            store: store.name,
            act: 'set',
            key: key,
            value: value
          }]);
        })
        .then(({store1}) => {
          resolve(store1)
        })
        .catch(reject);
    });
  }


  _doSetSeed(store, key, value) {
    return new Promise(resolve => {
      console.log('SET SEED in %s:', store.name, key, value);
      let seq = this._next++;

      this._sequence[seq] = {
        store: store.name,
        key: key
      };

      store.data[key] = {
        seq: seq,
        val: value
      };

      resolve(true);

      // emit last in case of throw in listener
      store.actions.emit('set', key, value);
    });
  }


  _doUpdateDistribute(update) {
    // let {store, act, key, value} = update;
    update.seq = this._next++;
    console.log('NEXT', update.seq);
    let message = [
      {
        // send pending update
        FOR: constants.CLUSTER_ROUTE_CODE,
        DO: constants.CLUSTER_HANDLER_STORE_2,
      },
      update
    ];

    let cancelled;

    // don't add new target midway through store1,2,3 steps
    // (new members won't have pending update from store2 to apply in store3)
    let targets = Object.keys(this._cluster.members).map(key => {
      return this._cluster.members[key];
    });

    return Promise.every(
      targets.map(target => {
        return target.socket.send(message)
      })
    )
      .then(results => {
        for (let i = 0; i < results.length; i++) {
          // throw new TypeError('Fake a distribution error');
          if (results[i].store2) continue;
          if (results[i] instanceof Error) {
            if (results[i] instanceof VertexSocketClosedError) {
              // socket closed while awaiting ACK (no longer member)
              delete targets[i];
              continue;
            }
            throw results[i];
          }
          let error = new VertexDistributionError('Unexpected store2 result');
          error.result = results[i];
          throw error;
        }
      })
      .catch(error => {
        cancelled = error;
        let cancel = [
          {
            // cancel pending update (unsuccessfully distributed)
            FOR: constants.CLUSTER_ROUTE_CODE,
            DO: constants.CLUSTER_HANDLER_STORE_3
          }, update.seq
        ];
        Promise.every(
          targets.map(target => {
            return target.socket.send(cancel)
          })
        ).then(() => {
          // ignoring cancel results
        });
      })
      .then(() => {
        if (cancelled) return;
        let apply = [
          {
            // apply update at all
            FOR: constants.CLUSTER_ROUTE_CODE,
            DO: constants.CLUSTER_HANDLER_STORE_4
          }, update.seq
        ];
        Promise.every(
          targets.map(target => {
            return target.socket.send(apply)
          })
        ).then(() => {
          // ignoring apply results
          // - may never arrive if user-land remote store.on('set, del')
          //   listeners throw uncaught
        });
      })
      .then(() => {
        if (cancelled) throw cancelled;
        return true;
      });
  }


  _doUpdatePending(update) {
    this._next = Math.max(update.seq + 1, this._next);
    this._pending[update.seq] = update;
    return true;
  }

  _doCancelPending(seq) {
    delete this._pending[seq];
    return true;
  }


  _doApplyPending(seq) {
    let {store, act, key, value} = this._pending[seq];
    let theStore = this.createStore(store);
    let existing = this._stores[store].data[key];

    if (act != 'set') return console.log('TODO: store.del');

    delete this._pending[seq];

    if (existing) {
      delete this._sequence[existing.seq];
    }

    this._sequence[seq] = {
      store: store,
      key: key
    };

    this._stores[store].data[key] = {
      seq: seq,
      val: value
    };

    theStore.emit(act, key, value);


    console.log(this._stores[store]);
  }


  _syncOut(next = 0, limit = 100) {

    let fragment = {data: {}};
    let sequence = Object.keys(this._sequence);
    let last = false;
    let i;

    for (i = next; i < next + limit; i++) {
      if (i > sequence[sequence.length - 1]) {
        last = true;
        break;
      }
      if (!this._sequence[i]) {
        continue;
      }
      let {store, key} = this._sequence[i];

      fragment.data[i] = {
        store: store,
        key: key,
        value: this._stores[store].data[key]
      }
    }

    fragment.next = i;
    fragment.last = last;
    return fragment;
  }


  _syncIn(fragment) {
    Object.keys(fragment.data).forEach(seq => {
      let {store, key, value} = fragment.data[seq];
      let duplicate = false;

      // value is {seq: n, val: v}

      this.createStore(store);

      // ignore if already got seq, (delete occurred behind sync cursor)
      if (this._sequence[seq]) duplicate = true;

      this._sequence[seq] = {
        store: store,
        key: key
      };

      this._stores[store].data[key] = value;

      if (!duplicate) {
        this._stores[store].actions.emit('set', key, value.val);
      }
    });
  }

}

module.exports = Distributor;
