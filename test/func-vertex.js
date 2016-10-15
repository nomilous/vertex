var path = require('path');
var filename = path.basename(__filename);
var should = require('should');

var Vertex = require('../');

describe(filename, function () {

  it('can create a vertex', function (done) {

    Vertex.create()

      .then(function(vertex) {
        vertex.should.eql({});
      })

      .then(done).catch(done);

  });

});
