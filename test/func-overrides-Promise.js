const {basename} = require('path');
const filename = basename(__filename);
const expect = require('expect.js');

require('../');

describe(filename, () => {

  it('rejects with error on not array', done => {

    Promise.every(1)
      .catch(error => {
        expect(error.name).to.equal('TypeError');
        done();
      })
      .catch(done);

  });

  it('resolves with empty array on empty array', done => {

    Promise.every([])
      .then(result => {
        expect(result).to.eql([]);
        done();
      })
      .catch(done);

  });

  it('resolves with promise results and values', done => {

    let array = [
      1,
      'string',
      new Promise(resolve => {resolve('promised')})
    ];

    Promise.every(array)
      .then(result => {
        expect(result).to.eql([1, 'string', 'promised']);
        done();
      })
      .catch(done);

  });

  it('resolves with rejections', done => {

    let array = [
      new Promise((resolve, reject) => {reject(new Error(1))}),
      new Promise((resolve, reject) => {resolve(2)}),
      new Promise((resolve, reject) => {reject(new Error(3))})
    ];

    Promise.every(array)
      .then(([error1, result2, error3]) => {
        expect(error1.name).to.equal('Error');
        expect(result2).to.equal(2);
        expect(error3.name).to.equal('Error');
        done();
      })
      .catch(done);

  });

});
