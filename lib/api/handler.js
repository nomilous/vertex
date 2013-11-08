// Generated by CoffeeScript 1.6.3
var deferred, lastInstance, parse, pipeline, _ref;

parse = require('querystring').parse;

_ref = require('also'), pipeline = _ref.pipeline, deferred = _ref.deferred;

lastInstance = void 0;

module.exports._test = function() {
  return lastInstance;
};

module.exports.create = function(config) {
  var api, local;
  lastInstance = local = {
    root: config.root || {},
    prep: deferred(function(action, opts) {
      return action.resolve();
    }),
    process: deferred(function(action, opts) {
      var body;
      body = JSON.stringify(config.root);
      return action.resolve({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length
        },
        body: body
      });
    }),
    responder: function(opts, res) {
      return local.prep(opts).then(local.process(opts).then(function(result) {
        res.writeHead(result.statusCode, result.headers);
        res.write(result.body);
        return res.end();
      }, function(error) {
        res.writeHead(error.statusCode || 500, error.headers || {});
        return res.end(error.body || error.toString());
      }, function(notify) {}));
    },
    handle: function(req, res) {
      var m, path, query, _ref1;
      path = req.url;
      try {
        _ref1 = req.url.match(/^(.*?)\?(.*)/), m = _ref1[0], path = _ref1[1], query = _ref1[2];
      } catch (_error) {}
      if (path === '/' && !config.allowRoot) {
        res.writeHead(404);
        return res.end();
      }
      return local.responder({
        headers: req.headers,
        path: path,
        query: query != null ? parse(query) : {}
      }, res);
    }
  };
  return api = {
    handle: local.handle
  };
};