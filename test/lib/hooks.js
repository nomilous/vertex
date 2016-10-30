const Vertex = require('../../');

module.exports = class Hooks {

  static startCluster(cluster) {
    let start = (done) => {
      let configs = [];

      cluster.servers = [];
      cluster.size = cluster.size || 10;
      for (let i = 0; i < cluster.size; i++) {
        configs.push(Hooks.createConfig(i, cluster));
      }

      Vertex.create(configs.shift())
        .then(master => {
          cluster.servers.push(master);
        })
        .then(() => {
          return Promise.all(configs.map(config => {
            return Vertex.create(config);
          }));
        })
        .then(servers => {
          cluster.servers = cluster.servers.concat(servers);
          if (cluster.wait) {
            return new Promise(resolve => {
              let servers = cluster.servers;
              let size = cluster.size;
              let interval = setInterval(() => {
                let all = true;
                for (let i = 0; i < size; i++) {
                  let members = Object.keys(servers[i].cluster.members).length;
                  if (members != size) all = false;
                }
                if (all) {
                  clearInterval(interval);
                  resolve();
                }
              }, 10);
            })
          }
        })
        .then(done)
        .catch(done);
    };

    if (cluster.each) return beforeEach('start cluster', start);
    before('start cluster', start);
  }

  static stopCluster(cluster) {
    let stop = (done) => {
      if (!cluster.servers) {
        return done();
      }
      Promise.all(cluster.servers.map(server => {
        return server.$stop();
      }))
        .then(() => {done()})
        .catch(done);
    }

    if (cluster.each) return afterEach('stop cluster', stop);
    after('stop cluster', stop);
  }

  static createConfig(i, cluster) {
    let config = {
      logLevel: cluster.logLevel,
      server: {
        listen: 65000 + i
      },
      cluster: {
        seed: i == 0,
        sync: {
          // timeout: 200,
          // limit: 10
        },
        join: {
          0: '127.0.0.1:65000',
          1: '127.0.0.1:65001'
        }
      }
    };
    if (cluster.namebase) {
      config.name = cluster.namebase + i;
    }
    return config;
  }

};
