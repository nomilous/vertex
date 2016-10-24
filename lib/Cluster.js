const deepcopy = require('deepcopy');
const {VertexSocket} = require('vertex-transport');
const {createWord} = require('vertex-names');
const {format} = require('util');

const DistributedLog = require('./DistributedLog');
const Member = require('./Member');
const {isInt, isntSelf} = require('./utils');
const {VertexStartError, VertexJoinError} = require('./errors');

class Cluster {

  static join(vertex) {
    let cluster = vertex._cluster = new Cluster(vertex);

    return Promise.resolve()
      .then(cluster.start.bind(cluster))
      .then(() => {

      })

  }

  constructor(vertex) {
    Object.defineProperty(this, '_vertex', {value: vertex});
    this.name = vertex._config.join.name || null;
    this.log = vertex.log.createLogger({name: 'cluster'});
    this.handlers = {};

    this._master = false;
    this._logs = new DistributedLog(this);
    this._memberList = this._logs.createLog('members');
    this._members = {};

    this._onMemberAddListener = this._onMemberAdd.bind(this);
    this._onMemberRemoveListener = this._onMemberRemove.bind(this);
    this._memberList.on('add', this._onMemberAddListener);
    this._memberList.on('remove', this._onMemberRemoveListener);

    this._config = {join: deepcopy(vertex._config.join)};
    this._defaults();
    this._createHandlers();
    this._vertex._net.registerService('cluster', this);
  }


  start() {
    return this._join1();
  }


  stop() {
    this.log.debug('stopping');

    this._master = false;
    // TODO: broadcast departure? Does oneTick on kill allow time?

    Object.keys(this.handlers).forEach(key => delete this.handlers[key]);
    this._memberList.removeListener('add', this._onMemberAddListener);
    this._memberList.removeListener('remove', this._onMemberRemoveListener);

    let stops = [];
    // if (this._sys) stops.push(this._sys.close());
    // if (this._usr) stops.push(this._usr.close());
    return Promise.all(stops)
      .then(() => {
        this.log.debug('stopped');
      })
  }

  _createHandlers() {
    this.handlers.join1 = (session, data, meta, reply) => {

      if (data.name && data.name !== this.name) {
        return reply('nak', new Error(format('Expected cluster name \'%s\' (or undefined)', this.name)));
      }

      if (this._master) {
        return reply('join1', {
          me: true
        });
      }

      reply('nak', new Error('TODO: join to another master'));
      // me = false
    };

    this.handlers.join2 = (session, data, meta, reply) => {

      if (!this._master) {
        // TODO: was master at join1,
        // not any more,
        // wait for election and reply with join1 (new master)
        return reply('nak', new Error('Not master'));
      }

      reply('join2', new Promise((resolve, reject) => {
        this._memberList.add(data)
          .then(result => {
            // TODO: sync in multiple payloads
            resolve(this._logs.syncOut());
          })
          .catch(reject)
      }));
    };
  }


  _onMemberAdd(member) {
    if (this._members[member.name]) {
      this._members[member.name].record(member);
      return;
    }
    this._members[member.name] = new Member(member, this._vertex);
  }


  _onMemberRemove(member) {
    console.log('REMOVE', member);
  }


  _join1() {
    return new Promise((resolve, reject) => {

      // try join1 to one at a time

      let attempts = Object.keys(this._config.join)
        .filter(isInt)
        .map(key => {
          return this._config.join[key]
        })
        .filter(isntSelf(
          this._vertex._net._server.address()
        ));

      if (attempts.length == 0) {
        return reject(new VertexJoinError('Cannot join only self'))
      }

      let socket, address;

      let onJoin2Reply = ({data}) => {
        if (data.join2 instanceof Error) {
          this.log.error('join2 error from %s:%d', address.address, address.port);
          this.log.error('join2 %s', data.join2.toString());
          socket.close();
          if (attempts[++i]) return next(i);
          reject(new VertexJoinError(data.join2.toString()));
          return;
        }

        // TODO: sync in multiple payloads
        this._logs.syncIn(data.join2);
        resolve();
      };

      let onJoin2Error = error => {
        this.log.error('join2 error from %s:%d', address.address, address.port);
        this.log.error('join2 %s', error.toString());
        socket.close();
        if (attempts[++i]) return next(i);
        reject(new VertexJoinError(error.toString()));
      };

      let onJoin1Reply = ({data}) => {
        // join1 was to master already
        if (data.join1.me) {
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
        if (this._config.join.seed) {
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
      this.name = createWord(7);
      this._randomName = true;
    }
    this.log.info('seeding cluster \'%s\'', this.name);

    this._memberList.add({
      name: this._vertex.name,
      address: this._vertex.getAddress()
    })
      .then(resolve)
      .catch(reject);
  }


  _payloadHeader(action) {
    return {FOR: 'cluster', DO: action};
  }


  _join1Payload() {
    return [
      this._payloadHeader('join1'), {
        name: this.name
      }
    ]
  }


  _join2Payload() {
    return [
      this._payloadHeader('join2'), {
        name: this._vertex.name,
        address: this._vertex.getAddress()
      }
    ]
  }


  _defaults() {
    if (!this._vertex._net) {
      throw new VertexStartError('Cluster requires config.listen');
    }
    let countJoins = 0;
    Object.keys(this._config.join)
      .filter(isInt)
      .forEach(key => {
        countJoins++;
        let value = this._config.join[key];
        if (isInt(value)) {
          this._config.join[key] = {
            host: '127.0.0.1',
            port: parseInt(value)
          };
          return;
        }
        if (typeof value == 'object') {
          this._config.join[key] = {
            host: value.host || '127.0.0.1',
            port: value.port || 65535
          };
          return;
        }
        let parts = value.split(':');
        if (parts.length > 1) {
          this._config.join[key] = {
            port: parseInt(parts.pop()),
            host: parts.join(':')
          };
          return;
        }
        this._config.join[key] = {
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
