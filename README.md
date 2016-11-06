**using node ^6.0.0**

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

...