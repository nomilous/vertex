**using node ^6.0.0**

[![npm](https://img.shields.io/npm/v/vertex.svg)](https://www.npmjs.com/package/vertex)
[![Build Status](https://travis-ci.org/nomilous/vertex.svg?branch=master)](https://travis-ci.org/nomilous/vertex)
[![Coverage Status](https://coveralls.io/repos/nomilous/vertex/badge.svg?branch=master&service=github)](https://coveralls.io/github/nomilous/vertex?branch=master)


vertex
======

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
  name: 'uniquename',
  listen: {
    system: '0.0.0.0:65535',
    user: '0.0.0.0:49152'
  }
}
```

##### config.name

Should be unique within cluster. If unspecified a random name will be [generted](https://github.com/nomilous/vertex-names).

