[![npm](https://img.shields.io/npm/v/vertex.svg)](https://www.npmjs.com/package/vertex)
[![Build Status](https://travis-ci.org/nomilous/vertex.svg?branch=master)](https://travis-ci.org/nomilous/vertex)
[![Coverage Status](https://coveralls.io/repos/nomilous/vertex/badge.svg?branch=master&service=github)](https://coveralls.io/github/nomilous/vertex?branch=master)

vertex
======

A distributed process framework.

`npm install vertex —save`

```javascript
var Vertex = require('vertex');

Vertex.create()
  .then(function (vertex) {
    // ...
  })
  .catch(function (error) {
    // ...
  });
```

