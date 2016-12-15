[![npm](https://img.shields.io/npm/v/vertex.svg)](https://www.npmjs.com/package/vertex)
[![Build Status](https://travis-ci.org/nomilous/vertex.svg?branch=master)](https://travis-ci.org/nomilous/vertex)
[![Coverage Status](https://coveralls.io/repos/nomilous/vertex/badge.svg?branch=master&service=github)](https://coveralls.io/github/nomilous/vertex?branch=master)

# vertex

A distributed process framework.

`npm install vertex —save`

### create

```javascript
const Vertex = require('vertex');

Vertex.create( config )
  .then(vertex => {
    // ...
  })
  .catch(error => {
    // ...
  });
```

### config

```javascript
config = {
  name: 'phasnaedior',
  logLevel: 'info',
  repl: {
    history: os.homedir() + path.sep + '.vertex_repl_history'
  },
  server: {
    listen: '0.0.0.0:65535'
  },
  cluster: {
    name: 'nanfest',
    seed: false,
    sync: {
      timeout: 2000,
      limit: 42
    },
    join: {
      0: '10.0.0.40:65535',
      1: '10.0.0.41:65535',
      2: '10.0.0.42:65535',
      timeout: 1000
    },
    leave: {
      consensus: 1.0,
      expire: 5000
    },
    nominate: {
      expire: 2000
    }
  }
}
```

#### config.name

Should be unique within cluster. If unspecified a random name will be [generated](https://github.com/nomilous/vertex-names).

#### config.logLevel

Configure the [logger](https://github.com/nomilous/vertex-logger).

Notably:

```javascript
logLevel: (nfo) => {
  // called to assign level as each new logger in the tree initialises
  // console.log(nfo);
  if (nfo.??) return 'trace';
  return 'warn';
}
```

#### config.repl

If config.repl is specified and vertex stdout is a TTY then a repl is started. Only the first vertex in the process starts a repl. The `vertex` variable in the repl is the first started vertex in the process.

##### config.repl.history

File to and from which repl history is loaded. Set history to `null` for no history file.

#### config.server

Configure the server.

##### config.server.listen

Host and port to listen.

#### config.cluster

If the cluster section is specified the vertex will join a cluster of vertexes

##### config.cluster.name

Optional cluster name. If unspecified a random name will be generated. If specified it must much the name of the cluster being joined (to).

##### config.cluster.seed

Set true on the first node joining (seeding) the cluster.

##### config.cluster.sync

Upon joining the cluster the contents of the clusters key-storage is synchronised onto the new member.

###### config.cluster.sync.limit

Maximum key-store records per synchronisation data-frame.

###### config.cluster.sync.timeout

Timeout applied on send of each data-frame.

##### config.cluster.join

At least one host already present in the cluster should be specified. It is recommended that all cluster members use the same set of join hosts. At least one of the join hosts should be running at all times.

Join hosts are attempted one at a time. Upon success the remaining hosts are not tried.

###### config.cluster.join.timeout

Timeout on each attempt to join.

##### config.cluster.leave

When one member detects the departure of another member it deletes the member from the members key-store. This action requires consensus among the cluster members independantly also detecting the departure. If consensus is not reached the member(s) making the false deletion is shut down since it is no longer fully connected to the cluster (has lost link to member that others have not lost link to)

###### config.cluster.leave.consensus

Proportion of cluster members required for consensus. 1.0 is all members. 0.5 is half of the members.

###### config.cluster.leave.expire

Allotted discovery/accumulation time for the consensus to be reached.

##### config.cluster.nominate

When the cluster master is shut down a new master is selected by the cluster. Since all members share the fill list of cluster members with a common sequence number the master is selected from that list (the next member in the sequence). All remaining members nominate the next member in the sequence as master. And again if that member also goes down while the nomination is still in progress (expire).

###### config.cluster.nominate.expire

The nomination expire time.



