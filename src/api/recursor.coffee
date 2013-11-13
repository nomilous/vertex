{deferred} = require 'also'
 
module.exports.create = (config) ->

    return local = 

        process: deferred (action, opts) -> 

            path = opts.path.split( '/' ).filter (p) -> p.length > 0

            local.recurse opts, path, config.root, (error, result) -> 

                return action.reject error if error?

                action.resolve result

        recurse: (opts, path, object, callback) -> 

            try


                return callback( null, 

                    statusCode: 404
                    
                ) unless object = object[ path.pop() ]


                #callback null, body: config.root


            catch error

                callback error


            

