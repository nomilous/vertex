const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');

const Vertex = require('../');
const {Server} = Vertex;
const {VertexJoinError} = Vertex.errors;

describe(filename, () => {

  let vertex, logLevel = (nfo) => {
    return 'off';
  };

  afterEach('stop vertex', (done) => {
    if (!vertex) return done();
    vertex.$stop().then(done).catch(done);
    vertex = undefined;
  });

  it('starts a vertex with defaults', done => {

    Vertex.create({logLevel: logLevel})

      .then(_vertex => {
        vertex = _vertex;
        expect(vertex instanceof Vertex).to.equal(true);
        expect(vertex.server instanceof Server).to.equal(true);
        expect(typeof vertex.name).to.equal('string');
      })

      .then(done).catch(done)

  });

  it('can start a second time because it stopped properly', done => {
    // and freed the ports

    Vertex.create({logLevel: logLevel})

      .then(_vertex => {
        vertex = _vertex;
      })

      .then(done).catch(done);

  });

  it('does not start server if server is null', done => {

    Vertex.create({logLevel: logLevel, server: null})

      .then(_vertex => {
        vertex = _vertex;
        expect(!vertex.server).to.equal(true);
        done();
      })

      .catch(done);

  });

  it('creates a logger at the specified level', done => {

    Vertex.create({server: null, logLevel: 'error'})

      .then(_vertex => {
        vertex = _vertex;
        expect(vertex.log.level).to.equal('error');
        done();
      })

      .catch(done);

  });


  context('services', () => {

    context('register', () => {

      it('can');

    });

  });

});
