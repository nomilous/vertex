var Promise = require('bluebird');

module.exports.create = function () {
  return new Promise(function (resolve, reject) {
    resolve({});
  });
};
