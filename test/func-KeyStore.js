const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');

const hooks = require('./lib/hooks');

describe.only(filename, function() {

  this.timeout(100000);

  let cluster = {
    size: 50, // Error: connect ENFILE...
    namebase: 'node-',
    wait: true,
    logLevel: (info) => {
      if (info.ancestors[0] == 'node-5') {
        return 'info';
        // if (info.name == 'keystore') return 'trace';
        // if (info.name == 'cluster') return 'debug';
      }
      return 'warn';
    }
  };

  hooks.startCluster(cluster);
  hooks.stopCluster(cluster);

  context('set', () => {

    it('can set value with key as string', done => {

      done();

    });

    it('can set value with key as number');

    it('can set value with key as boolean');

    it('can set value as undefine');

    it('can set value as null');

  });

  it('can replace with second set');

  it('can delete');

});
