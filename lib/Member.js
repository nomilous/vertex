const {VertexSocket} = require('vertex-transport');
const constants = require('./constants');

class Member {

  constructor(vertex, member, socket) {
    Object.defineProperty(this, 'self', {
      value: member.name == vertex.name,
      enumerable: true
    });

    Object.defineProperty(this, 'name', {
      value: member.name,
      enumerable: true
    });

    this.address = member.address;
    this.log = vertex.cluster.log.createLogger({name: member.name});
    this.log.trace('create member %s', this.name);

    var usrSocket;
    Object.defineProperty(this, 'socket', {
      get: () => usrSocket,
      set: (socket) => {
        usrSocket = socket;
        Object.defineProperty(usrSocket, 'member', {
          value: this,
          enumerable: true,
          writable: false
        });

        Object.defineProperty(usrSocket, 'user', {
          value: true,
          enumerable: true
        });
      },
      enumerable: true
    });

    Object.defineProperty(this, '_active', {
      get: () => {
        // TODO: false if not connected
        if (!this._joined) return false;
        if (this._stopped) return false;
        if (!usrSocket) return false;
        if (!sysSocket) return false;
        if (!this._recorded) return false;
        if (this._error) return false;
        return true;
      }
    });

    var sysSocket;
    Object.defineProperty(this, '_sys', {
      get: () => sysSocket,
      set: (socket) => {
        sysSocket = socket;
        Object.defineProperty(sysSocket, 'member', {
          value: this,
          enumerable: true,
          writable: false
        });

        Object.defineProperty(sysSocket, 'user', {
          value: false,
          enumerable: true
        });
      }
    });

    let joined = false;
    Object.defineProperty(this, '_stopped', {
      get: () => joined,
      set: (value) => {
        joined = value;
        this._updated(this);
      }
    });

    Object.defineProperty(this, '_joined', {
      value: false,
      writable: true
    });

    // Object.defineProperty(this, '_partialClosed', {
    //   get: () => {
    //     if (!this._sys) return false;
    //     if (!this.socket) return false;
    //     if (this.socket.closed) return !this._sys.closed;
    //     if (this._sys.closed) return !this.socket.closed;
    //     return false;
    //   }
    // });

    Object.defineProperty(this, '_updated', {
      value: vertex.cluster._memberUpdated.bind(vertex.cluster)
    });

    Object.defineProperty(this, '_register', {
      value: vertex.server._onConnection.bind(vertex.server)
    });

    Object.defineProperty(this, '_error', {
      value: null,
      writable: true
    });

    Object.defineProperty(this, '_recorded', {
      value: !socket, // got member from distributed log
      writable: true
    });

    Object.defineProperty(this, '_local', {
      value: {
        name: vertex.name,
        address: vertex.getAddress()
      }
    });

    if (socket) {
      this._sys = socket;
      return this._usrConnect();
    }

    if (vertex.cluster._noConnect) return;
    this._sysConnect();
  }


  stop() {
    this._stopped = true;

    if (this.socket && !this.socket.closed) {
      this.socket.close();
    }

    if (this._sys) {
      if(!this._sys.closed) {
        this._sys.close();
      }
    }

    this._updated(this);
  }


  quarantine() {
    this._stopped = true;
    this._updated(this);
  }

  _addMemberRecord(member, meta) {
    this._recorded = true;

    Object.defineProperty(this, '_seq', {
      value: meta.seq,
      enumerable: true
    });

    this._updated(this);
  }


  _addUsrSocket(socket) {
    if (this.socket) {
      return this.log.error('multiple usr sockets');
    }
    this.socket = socket;
    this._updated(this);
  }


  _addSysSocket(socket) {
    if (this._sys) {
      return this.log.error('multiple sys sockets');
    }
    this._sys = socket;
    this._usrConnect();
  }


  _usrConnect() {
    this.log.debug(
      'join4 (usr) attempt -> %s:%s %s',
      this.address.host,
      this.address.port,
      this.name
    );
    VertexSocket.connect(this.address)
      .then(this._doUsrConnect.bind(this))
      .catch(this._handleUsrConnectError.bind(this));
  }


  _sysConnect() {
    this.log.debug(
      'join3 (sys) attempt -> %s:%s %s',
      this.address.host,
      this.address.port,
      this.name
    );
    VertexSocket.connect(this.address)
      .then(this._doSysConnect.bind(this))
      .catch(this._handleSysConnectError.bind(this));
  }


  _doUsrConnect(socket) {
    socket.send([{
      FOR: constants.CLUSTER_ROUTE_CODE,
      DO: constants.CLUSTER_HANDLER_JOIN_4
    }, this._local])
      .then(result => {
        this.log.debug('join4 reply from %s', this.name);
        this.socket = socket;
        this._register(socket, 'to');
        return socket.send([{
          FOR: constants.CLUSTER_ROUTE_CODE,
          DO: constants.CLUSTER_HANDLER_JOIN_5
        }, {
          name: this._local.name
        }]);
      })
      .then(result => {
        this.log.debug('join5 reply from %s', this.name);
        this._joined = true;
        this._updated(this);
      })
      .catch(error => {
        this._error = error;
        socket.close(1002, error.toString());
        this.log.error('join4 %s', error.toString());
        this._updated(this);
      });
  }


  _doSysConnect(socket) {
    socket.send([{
      FOR: constants.CLUSTER_ROUTE_CODE,
      DO: constants.CLUSTER_HANDLER_JOIN_3
    }, this._local])
      .then(result => {
        this.log.debug('join3 reply from %s', this.name);
        this._sys = socket;
        this._register(socket, 'to');
        this._updated(this);
      })
      .catch(error => {
        this._error = error;
        socket.close(1002, error.toString());
        this.log.error('join3 %s', error.toString());
        this._updated(this);
      });
  }


  _handleUsrConnectError(error) {
    this._error = error;
    this.log.warn('error connecting user socket', error);
    this._updated(this);
  }


  _handleSysConnectError(error) {
    this._error = error;
    this.log.warn('error connecting system socket', error);
    this._updated(this);
  }

}

module.exports = Member;
