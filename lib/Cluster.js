const deepcopy = require('deepcopy');
const {EventEmitter} = require('events');
const {VertexSocket} = require('vertex-transport');
const {createWord} = require('vertex-names');
const {format} = require('util');

const KeyStore = require('./KeyStore');
const Member = require('./Member');
const {isInt, isntSelf} = require('./utils');
const {VertexError, VertexConfigError, VertexJoinError} = require('./errors');
const constants = require('./constants');

class Cluster extends EventEmitter {

  constructor(vertex, name, config = {}) {
    super();

    Object.defineProperty(this, 'config', {value: deepcopy(config)});
    Object.defineProperty(this, '_vertex', {value: vertex});

    this._defaults();

    this.name = config.name || null;
    this.log = vertex.log.createLogger({name: 'cluster'});

    this.$handlers = {};
    this.$routeCode = constants.CLUSTER_ROUTE_CODE;
    this.$restricted = false;

    this.members = {};

    Object.defineProperty(this, '_masterName', {value: null, writable: true});
    Object.defineProperty(this, '_master', {
      get: () => this._masterName == this._vertex.name
    });

    Object.defineProperty(this, '_waitingMaster', {value: []});
    Object.defineProperty(this, '_stores', {value: new KeyStore(this)});
    Object.defineProperty(this, '_memberStore', {value: this._stores.createStore('members')});
    Object.defineProperty(this, '_members', {value: {}});
    Object.defineProperty(this, '_waitingReady', {value: null, writable: true});
    Object.defineProperty(this, '_ready', {
      get: () => this.getMemberCount(true) == this.getMemberCount(false) && this._stores._ready,
      enumerable: false
    });

    Object.defineProperty(this, '_noConnect', {value: true, writable: true});
    Object.defineProperty(this, '_onMemberSetListener', {value: this._onMemberSet.bind(this)});
    Object.defineProperty(this, '_onMemberDelListener', {value: this._onMemberDel.bind(this)});
    this._memberStore.on('set', this._onMemberSetListener);
    this._memberStore.on('del', this._onMemberDelListener);

    this._createHandlers();
  }


  $start() {
    return new Promise((resolve, reject) => {
      this._joinCluster()
        .then(() => {
          this._waitingReady = (error) => {
            if (error) return reject(error);
            this.log.info('done sync at %d members', Object.keys(this.members).length);
            resolve();
          }
        })
        .catch(reject);
    });
  }


  $stop() {
    this._masterName = null;
    Object.keys(this.$handlers).forEach(key => delete this.$handlers[key]);
    this._memberStore.removeListener('set', this._onMemberSetListener);
    this._memberStore.removeListener('del', this._onMemberDelListener);
    this._stores.stop();

    Object.keys(this._members).forEach(name => {
      this._members[name].stop();
      delete this._members[name];
      delete this.members[name];
    });

    // let stops = [];
    // return Promise.all(stops)
    //   .then(() => {
    //     this.log.debug('stopped');
    //   })
  }


  getMaster() {
    return new Promise((resolve, reject) => {
      if (!this._masterName) return reject(new Error('TODO: WAIT FOR MASTER on ' + this._vertex.name)); // TODO...
      if (!this.members[this._masterName]) return reject(new Error('TODO: WAIT FOR MASTER on ' + this._vertex.name)); // TODO...
      resolve(this.members[this._masterName]);
    });
  }

  getMemberCount(active = true) {
    if (active) {
      return Object.keys(this.members).length;
    }
    return Object.keys(this._members).length;
  }


  _createHandlers() {
    this.$handlers[constants.CLUSTER_HANDLER_JOIN_1] = this._onJoin1.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_JOIN_2] = this._onJoin2.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_JOIN_3] = this._onJoin3.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_JOIN_4] = this._onJoin4.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_JOIN_5] = this._onJoin5.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_SYNC_1] = this._onSync1.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_STORE_1] = this._onStore1.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_STORE_2] = this._onStore2.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_STORE_3] = this._onStore3.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_STORE_4] = this._onStore4.bind(this);
  }


  _memberUpdated(member) {
    this.log.debug('updated %s to ready:%s', member.name, member._active);

    if (member._active) {
      if (!this.members[member.name]) {
        this.members[member.name] = member;
        this.log.info('add member %s', member.name);
        this.emit('member/add', member.name, member);
      }
    } else {
      if (this.members[member.name]) {
        delete this.members[member.name];
        this.log.debug('quarantine member %s', member.name);
        this.emit('member/remove', member.name, member);
        this._deleteMember(member);
      }
    }
    this._startedMaybe();
  }


  _deleteMember(member) {
    let error;
    // attempt delete member from whole cluster
    // - if no consensus is reached that the member is gone then
    //   this vertex is assumed malfunctioning and stopped!
    // - if the member is self, the same
    if (this._vertex.stopping) return;

    this.log.debug('delete member attempt', member.name);

    if (member.name == this._masterName) {
      console.log('TODO: master stopped');
      return;
    }

    if (member.self) {
      error = new VertexError('Lost socket to self');
      this.log.fatal('lost socket to self', error);
      this._vertex.$stop().then(() => {
        // this._vertex.emit('error', error);
      });
      this._vertex.emit('error', error);
      return;
    }

    let handleResult = result => {
      if (result.ok) {
        this.log.debug('delete member %s result', member.name, result.ok);
        return;
      }

      this.log.fatal('delete member %s denied', member.name);
      this._vertex.$stop().then(() => {
        // this._vertex.emit('error', error);
      });
      this._vertex.emit('error', error);
    };

    let consensus = this.config.depart.consensus;
    let expire = this.config.depart.expire;

    let retries = 0;
    let handleError = error => {
      // perhaps also lost master, retry with new one
      if (retries < 1) {
        this.log.warn('delete member %s error', member.name, error);
        this._memberStore.del(member.name, {consensus: consensus, expire: expire})
          .then(handleResult)
          .catch(handleError);
      } else {
        this.log.fatal('delete member %s error', member.name, error);
        this._vertex.$stop().then(() => {
          // this._vertex.emit('error', error);
        });
        this._vertex.emit('error', error);
      }
      retries++;
    };

    this._memberStore.del(member.name, {consensus: consensus, expire: expire})
      .then(handleResult)
      .catch(handleError);

  }


  _startedMaybe() {
    // TODO: member.error(s)
    if (this._ready) {
      if (this._waitingReady) {
        this._waitingReady();
        this._waitingReady = null;
      }
    }
  }


  _onMemberSet(name, member) {
    if (name == this._vertex.name) {
      // Members are emitted in the order they were created (store seq),
      // ignore members that existed before me,
      // they join to me, not me to them, the sockets go both ways
      this._noConnect = false;
    }

    if (this._members[member.name]) {
      this._members[member.name]._addMemberRecord(member);
      return;
    }
    this._members[member.name] = new Member(this._vertex, member);
  }


  _onMemberDel(name) {
    let member = this._members[name];
    if (member) member.stop();
    delete this._members[name];
    delete this.members[name];
    this.log.info('deleted member', name);
  }


  _joinCluster() {
    return new Promise((resolve, reject) => {
      let attempts = Object.keys(this.config.join)
        .filter(isInt)
        .map(key => this.config.join[key])
        .filter(isntSelf(
          this._vertex.server._server.address()
        ));

      if (attempts.length == 0) {
        return reject(new VertexJoinError('Cannot join only self'))
      }

      let socket, address;

      let onJoin2Reply = ({join2}) => {
        if (join2 instanceof Error) {
          this.log.error('join2 error from %s:%d', address.address, address.port);
          this.log.error('join2 %s', join2.toString());
          socket.close();
          if (attempts[++i]) return next(i);
          reject(new VertexJoinError(join2.toString()));
          return;
        }

        this.log.trace('join2 reply', join2);
        socket.close(1001, 'join2 ok');
        resolve();

        // now the cluster knows about this new node
        // all members will join3 to me
      };

      let onJoin2Error = error => {
        this.log.error('join2 error from %s:%d', address.address, address.port);
        this.log.error('join2 %s', error.toString());
        socket.close();
        if (attempts[++i]) return next(i);
        reject(new VertexJoinError(error.toString()));
      };

      let onJoin1Reply = ({join1}) => {
        this.log.trace('join1 reply', join1);

        if (join1 instanceof Error) {
          this.log.error('join1 error from %s:%d', address.address, address.port);
          this.log.error('join1 %s', join1.toString());
          socket.close();
          if (attempts[++i]) return next(i);
          reject(new VertexJoinError(join1.toString()));
          return;
        }

        this._masterName = join1.name;
        this.name = join1.cluster;
        this.log.info('joining %s/%s', this.name, this._masterName);

        if (join1.self) {
          // join1 was to master already
          return socket.send(this._join2Payload(), this.config.join.timeout)
            .then(onJoin2Reply)
            .catch(onJoin2Error);
        }

        socket.close();
        VertexSocket.connect(join1.address)
          .then(_socket => {
            socket = _socket;
            return socket.send(this._join2Payload(), this.config.join.timeout)
          })
          .then(onJoin2Reply)
          .catch(onJoin2Error);
      };

      let onJoin1Error = error => {
        this.log.error('join1 error from %s:%d', address.address, address.port);
        this.log.error('join1 %s', error.toString());
        socket.close();
        if (attempts[++i]) return next(i);
        reject(new VertexJoinError(error.toString()));
      };

      let onSocketConnect = _socket => {
        socket = _socket;
        address = socket.remoteAddress();
        socket.send(this._join1Payload(), this.config.join.timeout)
          .then(onJoin1Reply)
          .catch(onJoin1Error);
      };

      let onSocketError = error => {
        this.log.warn('join1 %s', error.toString());
        if (attempts[++i]) return next(i);
        if (this.config.seed) {
          return this._seed(resolve, reject);
        }
        reject(new VertexJoinError('No available hosts'));
      };

      let i = 0;

      let next = () => {
        this.log.debug('join1 attempt -> %s:%d', attempts[i].host, attempts[i].port);
        VertexSocket.connect(attempts[i])
          .then(onSocketConnect)
          .catch(onSocketError)
          .catch(reject);
      };

      next();
    });
  }


  _onJoin1(session, data, meta, reply) {
    this.log.trace('received join1', data);

    if (data.name && data.name !== this.name) {
      return reply('nak', new Error(
        format('Expected cluster name \'%s\' (or undefined)', this.name)
      ));
    }

    reply('join1', this.getMaster().then(member => {
      return {
        cluster: this.name,
        self: member.self,
        name: member.name,
        address: member.address
      }
    }));
  }


  _onJoin2(session, data, meta, reply) {
    this.log.trace('received join2', data);
    if (!this._master) {
      // TODO: was master at join1, (!!but not any more)
      // wait for election and reply with join1 (new master)
      return reply('nak', new Error('Not master'));
    }

    reply('join2', new Promise((resolve, reject) => {
      this._memberStore.set(data.name, data)
        .then(result => resolve())
        .catch(reject)
    }));
  }


  _onJoin3(session, data, meta, reply) {
    this.log.trace('received join3', data);
    var address = session.socket.remoteAddress();
    let member = this._members[data.name];

    this.log.debug(
      'join3 (sys) attempt <- %s:%d %s',
      address.address,
      address.port,
      data.name
    );

    if (member) {
      member._addSysSocket(session.socket);
      return;
    }

    this._members[data.name] = new Member(this._vertex, data, session.socket);
  }


  _onJoin4(session, data, meta, reply) {
    this.log.trace('received join4', data);
    var address = session.socket.remoteAddress();
    this.log.debug(
      'join4 (usr) attempt <- %s:%d %s',
      address.address,
      address.port,
      data.name
    );
  }

  _onJoin5(session, data, meta, reply) {
    this.log.trace('received join5', data);
    let member = this._members[data.name];
    var address = session.socket.remoteAddress();
    this.log.debug(
      'join5 (usr) attempt <- %s:%d %s',
      address.address,
      address.port,
      data.name
    );
    member._joined = true;
    if (member.socket) {
      member._updated(member);
      return;
    }
    member._addUsrSocket(session.socket);
  }


  _onSync1(session, data, meta, reply) {
    this.log.trace('received sync1', data);
    session.local.syncBytes = session.local.syncBytes || 0;
    session.local.syncBytes += meta.len;
    this._stores._syncIn(data, session.local);
  }


  _onStore1(session, update, meta, reply) {
    this.log.trace('received store1', update);
    // let {store, act, key, value} = update;
    reply('store1', this._stores._updateDistribute(update));
  }


  _onStore2(session, update, meta, reply) {
    this.log.trace('received store2', update);
    // let {seq, store, act, key, value} = update;
    reply('store2', this._stores._doUpdatePending(update));
  }


  _onStore3(session, seq, meta, reply) {
    this.log.trace('received store3', seq);
    reply('store3', this._stores._doCancelPending(seq));
  }


  _onStore4(session, seq, meta, reply) {
    this.log.trace('received store4', seq);
    reply('store4', this._stores._doApplyPending(seq));
  }


  _seed(resolve, reject) {
    this._masterName = this._vertex.name;
    this._randomName = false;
    if (!this.name) {
      this.name = createWord(7, {finished: true});
      this._randomName = true;
    }
    this.log.info('seeding cluster %s', this.name);

    this._memberStore.set(this._vertex.name, {
      name: this._vertex.name,
      address: this._vertex.getAddress()
    })
      .then(resolve)
      .catch(reject);
  }


  _payloadHeader(action) {
    return {FOR: this.$routeCode, DO: action};
  }


  _join1Payload() {
    return [
      this._payloadHeader(constants.CLUSTER_HANDLER_JOIN_1), {
        name: this.name
      }
    ]
  }


  _join2Payload() {
    return [
      this._payloadHeader(constants.CLUSTER_HANDLER_JOIN_2), {
        name: this._vertex.name,
        address: this._vertex.getAddress()
      }
    ]
  }


  _defaults() {
    if (!this._vertex.server) {
      throw new VertexConfigError('Cluster requires server');
    }

    if (typeof this.config.join != 'object') {
      throw new VertexConfigError('Cluster requires config.join');
    }

    if (typeof this.config.join.timeout == 'undefined') {
      this.config.join.timeout = 1000;
    }

    if (typeof this.config.depart != 'object') {
      this.config.depart = {};
    }

    if (this.config.depart.consensus != 'number') {
      this.config.depart.consensus = 1.0;
    }

    if (this.config.depart.consensus < 0) {
      throw new VertexConfigError('Invalid depart.consensus (less than 0)');
    }

    if (this.config.depart.consensus > 1) {
      throw new VertexConfigError('Invalid depart.consensus (more then 1.0)');
    }

    if (typeof this.config.depart.expire != 'number') {
      this.config.depart.expire = 5000;
    }

    if (this.config.depart.expire <= 0) {
      throw new VertexConfigError('Invalid depart.expire (not more then 0)');
    }

    let countJoins = 0;
    Object.keys(this.config.join)
      .filter(isInt)
      .forEach(key => {
        countJoins++;
        let value = this.config.join[key];
        if (isInt(value)) {
          this.config.join[key] = {
            host: '127.0.0.1',
            port: parseInt(value)
          };
          return;
        }
        if (typeof value == 'object') {
          this.config.join[key] = {
            host: value.host || '127.0.0.1',
            port: value.port || 65535
          };
          return;
        }
        let parts = value.split(':');
        if (parts.length > 1) {
          this.config.join[key] = {
            port: parseInt(parts.pop()),
            host: parts.join(':')
          };
          return;
        }
        this.config.join[key] = {
          port: 65535,
          host: parts.join(':')
        };
      });
    if (countJoins == 0) {
      throw new VertexJoinError('Missing join list');
    }
  }

}

module.exports = Cluster;
