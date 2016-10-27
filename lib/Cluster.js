const deepcopy = require('deepcopy');
const {VertexSocket} = require('vertex-transport');
const {createWord} = require('vertex-names');
const {format} = require('util');

const DistributedLogs = require('./DistributedLogs');
const Member = require('./Member');
const {isInt, isntSelf} = require('./utils');
const {VertexConfigError, VertexJoinError} = require('./errors');
const constants = require('./constants');

class Cluster {

  constructor(vertex, name, config = {}) {

    Object.defineProperty(this, 'config', {value: deepcopy(config)});
    Object.defineProperty(this, '_vertex', {value: vertex});

    this._defaults();

    this.name = config.name || null;
    this.log = vertex.log.createLogger({name: 'cluster'});

    this.$handlers = {};
    this.$routeCode = constants.CLUSTER_ROUTE_CODE;
    this.$restricted = false;

    this._master = false;
    this._logs = new DistributedLogs(this);
    this._memberLog = this._logs.createLog('members');
    this._members = {};

    Object.defineProperty(this, '_onMemberAddListener', {value: this._onMemberAdd.bind(this)});
    Object.defineProperty(this, '_onMemberRemoveListener', {value: this._onMemberRemove.bind(this)});
    this._memberLog.on('add', this._onMemberAddListener);
    this._memberLog.on('remove', this._onMemberRemoveListener);

    this._createHandlers();
  }


  $start() {
    return this._joinCluster();
  }


  $stop() {
    this.log.error('TODO: stop cluster');

    return;

    this._master = false;
    // TODO: broadcast departure? Does oneTick on kill allow time?

    Object.keys(this.$handlers).forEach(key => delete this.$handlers[key]);
    this._memberLog.removeListener('add', this._onMemberAddListener);
    this._memberLog.removeListener('remove', this._onMemberRemoveListener);

    let stops = [];
    return Promise.all(stops)
      .then(() => {
        this.log.debug('stopped');
      })
  }


  _createHandlers() {
    this.$handlers[constants.CLUSTER_HANDLER_JOIN_1] = this._onJoin1.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_JOIN_2] = this._onJoin2.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_JOIN_3] = this._onJoin3.bind(this);
    this.$handlers[constants.CLUSTER_HANDLER_JOIN_4] = this._onJoin4.bind(this);
  }


  _onJoin1(session, data, meta, reply) {
    if (data.name && data.name !== this.name) {
      return reply('nak', new Error(
        format('Expected cluster name \'%s\' (or undefined)', this.name)
      ));
    }

    if (this._master) {
      return reply('join1', {
        me: true
      });
    }

    reply('nak', new Error('TODO: join to another master'));
    // me = false
  }


  _onJoin2(session, data, meta, reply) {
    if (!this._master) {
      // TODO: was master at join1,
      // not any more,
      // wait for election and reply with join1 (new master)
      return reply('nak', new Error('Not master'));
    }

    reply('join2', new Promise((resolve, reject) => {
      this._memberLog.add(data)
        .then(result => {
          // TODO: sync in multiple payloads
          // resolve(this._logs.syncOut());
          resolve();
        })
        .catch(reject)
    }));
  }


  _onJoin3(session, data, meta, reply) {
    var address = session.socket.remoteAddress();

    this.log.debug(
      'join3 (sys) attempt <- %s:%d %s',
      address.address,
      address.port,
      data.name
    );

    if (this._members[data.name]) {
      this._members[data.name]._addSysSocket(session.socket);
      return;
    }

    this._members[data.name] = new Member(this._vertex, data, session.socket);
  }


  _onJoin4(session, data, meta, reply) {
    var address = session.socket.remoteAddress();

    this.log.debug(
      'join4 (usr) attempt <- %s:%d %s',
      address.address,
      address.port,
      data.name
    );

    if (!this._members[data.name]) {
      return reply('nak', new Error('Missing member record'));
    }

    this._members[data.name]._addUsrSocket(session.socket);
  }


  _memberUpdated(member) {
    this.log.warn('updated %s to ready:%s', member.name, member._ready);
    // console.log(member);
  }


  _onMemberAdd(member) {
    if (this._members[member.name]) {
      this._members[member.name]._addMemberRecord(member);
      return;
    }
    this._members[member.name] = new Member(this._vertex, member);
  }


  _onMemberRemove(member) {
    console.log('REMOVE', member);
  }


  _joinCluster() {
    return new Promise((resolve, reject) => {
      let attempts = Object.keys(this.config.join)
        .filter(isInt)
        .map(key => {
          return this.config.join[key]
        })
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

        // now the cluster knows about this new node
        // all members will join3 to me
        socket.close(1001, 'join2 ok');
        resolve();
      };

      let onJoin2Error = error => {
        this.log.error('join2 error from %s:%d', address.address, address.port);
        this.log.error('join2 %s', error.toString());
        socket.close();
        if (attempts[++i]) return next(i);
        reject(new VertexJoinError(error.toString()));
      };

      let onJoin1Reply = ({join1}) => {
        // join1 was to master already
        if (join1.me) {
          this._vertex.server._onConnection(socket);
          socket.send(this._join2Payload())
            .then(onJoin2Reply)
            .catch(onJoin2Error);

        }
        // TODO: switch to master
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
        socket.send(this._join1Payload())
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


  _seed(resolve, reject) {
    this._master = true;
    this._randomName = false;
    if (!this.name) {
      this.name = createWord(7, {finish: true});
      this._randomName = true;
    }
    this.log.info('seeding cluster \'%s\'', this.name);

    this._memberLog.add({
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
