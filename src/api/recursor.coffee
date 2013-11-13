{deferred} = require 'also'
 
module.exports.create = (config) ->

    return local = 

        process: deferred (action, opts) -> 

            path = opts.path.split( '/' ).filter (p) -> p.length > 0

            local.recurse opts, path, null, (error, result) -> 

                action.resolve result

        recurse: (opts, path, result, callback) -> 

            callback null, body: config.root


