const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');
const {platform} = require('os');

const Vertex = require('../');
const {Network} = Vertex;

describe(filename, () => {

  let vertex;

  afterEach('stop vertex', (done) => {
    if (!vertex) return done();
    vertex.stop().then(done).catch(done);
  });

  it('starts a vertex with defaults', done => {

    Vertex.create()

      .then(_vertex => {
        vertex = _vertex;
        expect(typeof vertex.name).to.equal('string');
        expect(vertex._net instanceof Network).to.equal(true);
      })

      .then(done).catch(done)

  });

  it('can start a second time because it stopped properly', done => {
    // and freed the ports

    Vertex.create()

      .then(_vertex => {
        vertex = _vertex;
      })

      .then(done).catch(done);

  });

});
