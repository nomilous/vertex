const deepcopy = require('deepcopy');
const equal = require('deep-equal');
const {EventEmitter} = require('events');
const {VertexSocketClosedError} = require('vertex-transport').errors;

const {VertexConfigError, VertexReplicationError} = require('./errors');
const Member = require('./Member');
const constants = require('./constants');

class KeyStore {

  constructor(cluster) {
    this.log = cluster.log.createLogger({name: 'keystore'});
    Object.defineProperty(this, '_cluster', {value: cluster});
    Object.defineProperty(this, '_sequence', {value: {}});
    Object.defineProperty(this, '_pending', {value: {}});

    // keystore changes are serialized
    // - changes are queued and updated one at a time
    // - the "time" includes full replication to all members
    // - syncs to joining members step to the front of the queue
    //   and all updates wait for that too
    //   (so that updates in _pending are not skipped in sync)
    //   TODO: can perhaps instead also sync pending, gets tricky...
    Object.defineProperty(this, '_queue', {value: []});
    Object.defineProperty(this, '_locked', {value: false, writable: true});

    Object.defineProperty(this, '_consensus', {value: {}});
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
    Object.defineProperty(this, '_onMemberRemoveListener', {value: this._onMemberRemove.bind(this)});
    this._cluster.on('member/add', this._onMemberAddListener);
    this._cluster.on('member/remove', this._onMemberRemoveListener);
  }


  stop() {
    this._cluster.removeListener('member/add', this._onMemberAddListener);
    this._cluster.removeListener('member/remove', this._onMemberRemoveListener);
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

    // opts:
    // {consensus: 0.4, expire: 1000} // set only occurs if > 0.4 ratio of members also set within expire
    // {random: 2, expire: 1000} // NOT IMPLEMENTED - returns true to random 2 of the n members that also set within expire
    store.actions.set = (key, value, opts) => {
      let type = typeof key;
      if (type != 'string' && type != 'boolean' && type != 'number') {
        return Promise.reject(new TypeError('Bad key type.'));
      }
      return this._doAction(store, 'set', key, value, opts);
    };

    store.actions.get = (key) => {
      // straight get without promise... (yes - locked in - to local store)
      return store.data[key] ? deepcopy(store.data[key].val) : undefined;
    };

    store.actions.has = (key) => {
      return !!store.data[key];
    };

    store.actions.del = (key, opts) => {
      let type = typeof key;
      if (type != 'string' && type != 'boolean' && type != 'number') {
        return Promise.reject(new TypeError('Bad key type.'));
      }
      return this._doAction(store, 'del', key, undefined, opts);
    };

    return store.actions;
  }


  _onMemberAdd(name, member) {
    if (member.self) return;
    if (!this._cluster._master) return;

    // queue sync to new member
    // - new member sync is prioritised so that sync always happens before updates start
    //   arriving at the new member, to preserve key emit order at new member,
    //   TODO: preserving order can be achieved at new member by pending incoming while syncing
    this._queue.unshift(member);
    if (this._locked) return;
    this._dequeue();
  }


  _onMemberRemove(name, member) {
    if (member.self) return;
    if (!this._cluster._master) return;

    this._reEvalConsensus();
  }


  _updateDistribute(update) {
    return new Promise((resolve, reject) => {
      if (update.opts && update.opts.consensus) {
        return this._handleConsensus(update, resolve, reject);
      }

      this._queue.push({
        update: update,
        resolve: resolve,
        reject: reject
      });
      if (this._locked) return;
      this._dequeue();
    });
  }


  _handleConsensus(update, resolve, reject) {
    this.log.trace('consensus update', update);
    let {store, act, key, value, opts} = update;
    let {consensus, expire} = opts;

    if (typeof expire != 'number') {
      return reject(new VertexConfigError('Consensus without expire'));
    }

    if (typeof consensus != 'number') {
      return reject(new VertexConfigError('Invalid 0 < consensus <= 1'));
    }

    if (consensus > 1) {
      return reject(new VertexConfigError('Invalid 0 < consensus <= 1'));
    }

    if (consensus == 0) {
      // not a consensus
      this._queue.push({
        update: update,
        resolve: resolve,
        reject: reject
      });
      if (this._locked) return;
      this._dequeue();
      return;
    }

    // TODO: prevent simultaneous consensus on set and del on same key?
    // TODO: consensus on set with differing value?
    // TODO: remove "vote" of departing member

    let cStore = this._consensus[store] = this._consensus[store] || {};
    let cKey = cStore[key] = cStore[key] || {};

    if (cKey[act]) {
      cKey[act].count++;
      cKey[act].resolves.push(resolve);
      cKey[act].rejects.push(reject);

      if (act == 'set') {
        if (!equal(value, cKey[act].update.value)) {
          cKey[act].fail();
          return;
        }
      }

      cKey[act].evaluate();
      return;
    }

    let evaluate = () => {
      if (cKey[act].count / this._cluster.getMemberCount() < cKey[act].consensus) {
        return;
      }

      let resolves = cKey[act].resolves;
      let resolveAll = (result) => {
        resolves.map(resolve => {
          resolve(result);
        });
      };

      let rejects = cKey[act].rejects;
      let rejectAll = (error) => {
        rejects.map(reject => {
          reject(error);
        });
      };

      // Distributes original (first) update
      let original = cKey[act].update;

      clearTimeout(cKey[act].expire);
      delete cKey[act];

      if (Object.keys(cKey).length == 0) {
        delete cStore[key];
      }

      if (Object.keys(cStore).length == 0) {
        delete this._consensus[store];
      }

      this._queue.push({ // TODO: to front of queue?
        update: original,
        resolve: resolveAll,
        reject: rejectAll
      });

      if (this._locked) return;
      this._dequeue();
    };

    let fail = () => {
      cKey[act].resolves.map(resolve => {
        resolve(false);
      });

      clearTimeout(cKey[act].expire);
      delete cKey[act];

      if (Object.keys(cKey).length == 0) {
        delete cStore[key];
      }

      if (Object.keys(cStore).length == 0) {
        delete this._consensus[store];
      }
    };

    cKey[act] = {
      count: 1,
      consensus: consensus,
      evaluate: evaluate,
      fail: fail,
      update: update,
      resolves: [resolve],
      rejects: [reject]
    };

    // don't leave these in update payload
    delete opts.consensus;
    delete opts.expire;

    cKey[act].expire = setTimeout(fail, expire);

  }


  _reEvalConsensus() {
    Object.keys(this._consensus).forEach(key => {
      let store = this._consensus[key];
      Object.keys(store).forEach(key => {
        let keyName = store[key];
        Object.keys(keyName).forEach(key => {
          let action = keyName[key];
          action.evaluate();
        });
      });
    });
  }


  _dequeue() {
    this._locked = true;
    this.log.trace('dequeue at length', this._queue.length); // TODO: metrics/statsd

    let thing = this._queue.shift();
    if (!thing) {
      this._locked = false;
      return;
    }

    if (thing instanceof Member) {
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


  _doUpdateDistribute(queued) {
    let {update, resolve, reject} = queued;
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
          let error = new VertexReplicationError('Unexpected store2 result');
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
            // cancel pending update (unsuccessfully replicated)
            FOR: constants.CLUSTER_ROUTE_CODE,
            DO: constants.CLUSTER_HANDLER_STORE_3
          }, update.seq
        ];

        // Promise.every( // TODO: to not wait for all cancel acks?
        return Promise.every(
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

        // Promise.every( // TODO: to not wait for all apply acks? (do load tests to see cost)
        return Promise.every(
          targets.map(target => {
            return target.socket.send(apply)
          })
        ).then(() => {
          // ignoring apply results, completion is sufficient
        });
      })
      .then(() => {
        process.nextTick(() => { // TODO: setImmediate better?
          this._dequeue();
        });
        if (cancelled) return reject(cancelled);
        resolve(true);
      });
  }


  _doAction(store, action, key, value, opts) {
    if (!this._ready &&
      this._cluster._master &&
      action == 'set' &&
      Object.keys(this._cluster.members).length == 0) {
      return this._doSetSeed(store, key, value)
    }

    return new Promise((resolve, reject) => {
      this._cluster.getMaster()
        .then(master => {
          let update = {
            store: store.name,
            act: action,
            key: key,
          };
          if (typeof value != 'undefined') {
            update.value = value;
          }
          if (typeof opts != 'undefined') {
            update.opts = opts;
          }
          return master._sys.send([{
            FOR: constants.CLUSTER_ROUTE_CODE,
            DO: constants.CLUSTER_HANDLER_STORE_1
          }, update]);
        })
        .then(({store1}) => {
          if (store1 instanceof Error) {
            return reject(store1);
          }
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

      // ready immediately after first seed value: the master's membership record
      this._ready = true;

      resolve(true);

      // emit last in case of throw in listener
      store.actions.emit('set', key, value);
    });
  }


  _doUpdatePending(update) {
    this.log.trace('received update', update);
    this._next = Math.max(update.seq + 1, this._next); // TODO: still needed? (now that serialised)
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

    if (act == 'del') {
      if (!existing) return;
      delete this._sequence[existing.seq];
      delete this._stores[store].data[key];
      theStore.emit(act, key);
      return;
    }

    if (act == 'set') {
      if (existing) {
        delete this._sequence[existing.seq];
      }

      this._sequence[seq] = {
        store: store,
        key: key
      };

      this._stores[store].data[key] = {
        seq: seq
      };

      if (typeof value != 'undefined') {
        this._stores[store].data[key].val = value;
      }

      theStore.emit(act, key, deepcopy(value));
      return;
    }

    this.log.warn('unknown action', act);
  }


  _syncOut(next = 0, limit = 42) {
    let fragment = {data: {}};
    let sequence = Object.keys(this._sequence);
    let last = false;
    let i;

    for (i = next; i < next + limit; i++) {    // TODO: fix to count actual values, not places of values
      // (which may have been deleted)
      if (i > sequence[sequence.length - 1] || sequence.length == 0) {
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

      if (typeof value != 'undefined') {
        this._stores[store].data[key] = value;
      }

      if (!duplicate) {
        this._stores[store].actions.emit('set', key, deepcopy(value.val));
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
