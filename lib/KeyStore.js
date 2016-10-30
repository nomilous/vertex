// const {format} = require('util');
const {EventEmitter} = require('events');
const {VertexSocketClosedError} = require('vertex-transport').errors;

// const {VertexConfigError, VertexDistributionError} = require('./errors');
const Member = require('./member');
const constants = require('./constants');

class KeyStore {

  constructor(cluster) {
    this.log = cluster.log.createLogger({name: 'keystore'});
    Object.defineProperty(this, '_cluster', {value: cluster});
    Object.defineProperty(this, '_sequence', {value: {}});
    Object.defineProperty(this, '_pending', {value: {}});

    // keystore changes are serialized
    // - keys can only be updated one at a time
    // - the "time" includes full distribution to all members
    // - key updates also wait behind sync to joining member
    //   so that updates in _pending are not skipped in sync
    //   TODO: can perhaps instead also sync pending, gets tricky...
    Object.defineProperty(this, '_queue', {value: []});
    Object.defineProperty(this, '_locked', {value: false, writable: true});

    Object.defineProperty(this, '_stores', {value: {}});
    Object.defineProperty(this, '_next', {value: 0, writable: true});
    Object.defineProperty(this, '_ready', {value: false, writable: true});
    Object.defineProperty(this, 'config', {
      value: {
        timeout: cluster.config.sync && cluster.config.sync.timeout
          ? cluster.config.sync.timeout
          : 2000,
        limit: cluster.config.sync && cluster.config.sync.limit
          ? cluster.config.sync.limit
          : 42 // TODO: how big can ws payload get, adapt?
      }
    });

    Object.defineProperty(this, '_onMemberAddListener', {value: this._onMemberAdd.bind(this)});
    this._cluster.on('member/add', this._onMemberAddListener);
  }


  stop() {
    this._cluster.removeListener('member/add', this._onMemberAddListener);
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


  _onMemberAdd(name, member) {
    if (member.self) return;
    if (!this._cluster._master) return;

    // new member sync is prioritised so that sync always happens before updates start
    // arriving at the new member, to preserve key emit order at new member,
    // TODO: preserving order can be achieved at new member by pending incoming while syncing
    this._queue.unshift(member);
    if (this._locked) return;
    this._dequeue();
  }


  _updateDistribute(update) {
    this._queue.push(update);
    if (this._locked) return;
    this._dequeue();
  }


  _dequeue() {
    this._locked = true;
    this.log.trace('dequeue at length', this._queue.length); // TODO: metrics/statsd

    let thing = this._queue.shift();
    if (!thing) {
      this._locked = false;
      return;
    }

    if (thing.isMember) {
      return this._doSyncToMember(thing);
    }

    return this._doUpdateDistribute(thing);
  }


  _doSyncToMember(member) {
    this.log.debug('start sync to %s', member.name);

    let sendFragment = (next) => {
      let fragment = this._syncOut(next, this.config.limit);
      member.socket.send([
        {
          FOR: constants.CLUSTER_ROUTE_CODE,
          DO: constants.CLUSTER_HANDLER_SYNC_1
        },
        fragment
      ], this.config.timeout)
        .then(result => {
          if (fragment.last) {
            this.log.debug('finished sync to %s', member.name);
            process.nextTick(() => { // TODO: setImmediate better?
              this._dequeue();
            });
            return;
          }
          sendFragment(fragment.next);
        })
        .catch(error => {
          this.log.error('error in sync to %s', name, error);
          process.nextTick(() => { // TODO: setImmediate better?
            this._dequeue();
          });
        })
    };

    sendFragment(0);
  }


  _doUpdateDistribute(update) {
    // let {store, act, key, value} = update;
    update.seq = this._next++;
    let message = [
      {
        // send pending update
        FOR: constants.CLUSTER_ROUTE_CODE,
        DO: constants.CLUSTER_HANDLER_STORE_2,
      },
      update
    ];

    let cancelled, targetNames = [];

    // don't add new target midway through store1,2,3 steps
    // (new members won't have pending update from store2 to apply in store3)
    let targets = Object.keys(this._cluster.members).map(key => {
      targetNames.push(key); // only for logging, optimize somehow
      return this._cluster.members[key];
    }).filter(member => {
      // not master
      return member.name != this._cluster._masterName;
    });

    this.log.trace('distributing update', update, '- to', targetNames);

    // master does locally
    if (this._cluster._master) {
      this._doUpdatePending(update)
    }

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
        if (this._cluster._master) {
          this._doCancelPending(update.seq);
        }
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
        if (this._cluster._master) {
          this._doApplyPending(update.seq);
        }
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
          //   listeners throws uncaught
        });
      })
      .then(() => {
        process.nextTick(() => { // TODO: setImmediate better?
          this._dequeue();
        });
        if (cancelled) throw cancelled;
        return true;
      });
  }


  _doSet(store, key, value) {
    if (!this._ready &&
      this._cluster._master &&
      Object.keys(this._cluster.members).length == 0) {
      return this._doSetSeed(store, key, value)
    }
    return new Promise((resolve, reject) => {
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

      this._ready = true;

      // emit last in case of throw in listener
      store.actions.emit('set', key, value);
    });
  }


  _doUpdatePending(update) {
    this.log.trace('received update', update);
    this._next = Math.max(update.seq + 1, this._next);
    this._pending[update.seq] = update;
    return true;
  }


  _doCancelPending(seq) {
    this.log.trace('cancel update', seq);
    delete this._pending[seq];
    return true;
  }


  _doApplyPending(seq) {
    this.log.trace('apply update', seq);
    let item = this._pending[seq];
    delete this._pending[seq];
    this._apply(seq, item);
  }


  _apply(seq, item) {
    let {store, act, key, value} = item;
    let theStore = this.createStore(store);
    let existing = this._stores[store].data[key];

    if (act != 'set') return console.log('TODO: store.del');

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
  }


  _syncOut(next = 0, limit = 1) {
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


  _syncIn(fragment, local) {
    this._ready = false;
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

    if (fragment.last) this._finishSync(local);
  }


  _finishSync(local) {
    this.log.trace('synchronised', this._stores);
    this.log.info('done sync at %d bytes', local.syncBytes);
    delete local.syncBytes;
    this._ready = true;
    this._cluster._startedMaybe();
  }

}

module.exports = KeyStore;
