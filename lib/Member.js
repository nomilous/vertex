const {VertexSocket} = require('vertex-transport');
const constants = require('./constants');

class Member {

  constructor(vertex, member, socket) {
    this.self = member.name == vertex.name;
    this.name = member.name;
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

    Object.defineProperty(this, '_ready', {
      get: () => {
        if (!usrSocket) return false;
        return !!sysSocket;
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

    if (this.self) return; // connect to self?

    if (socket) {
      this.log.debug(
        'join4 (usr) attempt -> %s:%s %s',
        member.address.host,
        member.address.port,
        member.name
      );
      VertexSocket.connect(member.address)
        .then(this._handleUsrConnect.bind(this))
        .catch(this._handleUsrConnectError.bind(this));
      return;
    }

    this.log.debug(
      'join3 (sys) attempt -> %s:%s %s',
      member.address.host,
      member.address.port,
      member.name
    );
    VertexSocket.connect(member.address)
      .then(this._handleSysConnect.bind(this))
      .catch(this._handleSysConnectError.bind(this));
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
  }


  _handleUsrConnect(socket) {
    socket.send([{
      FOR: constants.CLUSTER_ROUTE_CODE,
      DO: constants.CLUSTER_HANDLER_JOIN_4
    }, this._local])
      .then(result => {
        this.socket = socket;
        this._register(socket);
        this._updated(this);
      })
      .catch(error => {
        this._error = error;
        socket.close(1002, error.toString());
        this.log.error('join4 %s', error.toString());
        this._updated(this);
      });
  }


  _handleSysConnect(socket) {
    socket.send([{
      FOR: constants.CLUSTER_ROUTE_CODE,
      DO: constants.CLUSTER_HANDLER_JOIN_3
    }, this._local])
      .then(result => {
        this._sys = socket;
        this._register(socket);
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
    this._updated(this);
  }


  _handleSysConnectError(error) {
    this._error = error;
    this._updated(this);
  }

}

module.exports = Member;
