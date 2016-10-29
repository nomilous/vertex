const {VertexSocket} = require('vertex-transport');
const constants = require('./constants');

class Member {

  constructor(vertex, member, socket) {
    this.self = member.name == vertex.name;
    this.name = member.name;
    this.address = member.address;
    this.log = vertex.cluster.log;

    var usrSocket;
    Object.defineProperty(this, 'socket', {
      get: () => {
        return usrSocket;
      },
      set: (socket) => {
        usrSocket = socket;
      },
      enumerable: true
    });

    Object.defineProperty(this, '_active', {
      get: () => {
        // TODO: false if not connected
        if (this._stopped) return false;
        if (!usrSocket) return false;
        if (!sysSocket) return false;
        if (!this._recorded) return false;
        if (this._error) return false;
        return true;
      }
    });

    var sysSocket = socket;
    Object.defineProperty(this, '_sys', {
      get: () => {
        return sysSocket;
      },
      set: (socket) => {
        sysSocket = socket;
      }
    });

    Object.defineProperty(this, '_stopped', {
      value: false,
      writable: true
    });

    Object.defineProperty(this, '_updated', {
      value: vertex.cluster._memberUpdated.bind(vertex.cluster)
    });

    Object.defineProperty(this, '_syncStores', {
      value: vertex.cluster._syncStores.bind(vertex.cluster)
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

    // if (this.self) return; // connect to self?

    if (socket) return this._usrConnect();
    this._sysConnect();
  }


  stop() {
    this._stopped = true;
    this._updated(this);
  }


  _addMemberRecord(member) {
    this._recorded = true;
    this._updated(this);
  }


  _addUsrSocket(socket) {
    if (this.socket) this.log.error('multiple usr sockets');
    this.socket = socket;
    this._updated(this);
  }


  _addSysSocket(socket) {
    if (this._sys) this.log.error('multiple sys sockets');
    this._sys = socket;
    this._updated(this);
    if (this.self) this._usrConnect();
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
      .then( ({join4}) => {
        this.socket = socket;
        this._register(socket, 'to');
        this._updated(this);
        return join4.master;
      })
      .catch(error => {
        this._error = error;
        socket.close(1002, error.toString());
        this.log.error('join4 %s', error.toString());
        this._updated(this);
      })
      .then(master => {
        if (this._error) return;
        if (master) return this._syncStores(this);
      })
      .catch(error => {
        this._error = error;
        this.log.error('sync %s', error.toString());
        this._updated(this);
      });
  }


  _doSysConnect(socket) {
    socket.send([{
      FOR: constants.CLUSTER_ROUTE_CODE,
      DO: constants.CLUSTER_HANDLER_JOIN_3
    }, this._local])
      .then(result => {
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
