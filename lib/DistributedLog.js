const {format} = require('util');
const {EventEmitter} = require('events');

const {VertexConfigError, VertexDistributionError} = require('./errors');

class DistributedLog {

  constructor(cluster) {
    Object.defineProperty(this, '_cluster', {value: cluster});
    Object.defineProperty(this, '_logs', {value: {}});
  }


  createLog(name) {

    if (this._logs[name]) {
      throw new VertexConfigError(format('Log \'%s\' already exists', name));
    }

    this._logs[name] = {
      next: 0, // TODO: handle wrap
      data: {}
    };

    let log = this._logs[name];

    Object.defineProperty(log, 'actions', {value: new EventEmitter});

    log.actions.add = (object) => {
      // TODO: not if not master
      return new Promise((resolve, reject) => {
        if (typeof object._log !== 'undefined') {
          return reject(new VertexDistributionError('Object already in log'));
        }

        let seq = log.next++;
        object._log = seq;
        log.data[seq] = object;
        log.actions.emit('add', object);
        resolve(object);
      });
    };

    log.actions.remove = (object) => {
      // TODO: not if not master
      // TODO: allow remote to reject
      //   (eg: member already exists with different address)
      //   (or have validation step locally loginstance.validate)
      return new Promise((resolve, reject) => {

        resolve();
      });
    };

    return log.actions;

  }

  syncOut() {
    return this._logs;
  }

  syncIn(remoteLogs) {
    // TODO: full sync remove + add (in order, only emit on change)
    Object.keys(remoteLogs).forEach(name => {
      if (!this._logs[name]) {
        this.createLog(name);
      }
      let log = this._logs[name];
      log.next = remoteLogs[name].next;
      Object.keys(remoteLogs[name].data).forEach(key => {
        if (log.data[key]) return;
        log.data[key] = remoteLogs[name].data[key];
        log.actions.emit('add', log.data[key]);
      });
    });
  }

}

module.exports = DistributedLog;
