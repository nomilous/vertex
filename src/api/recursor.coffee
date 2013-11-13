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

                if nextKey = path.pop()

                    return callback( null, 

                        statusCode: 404

                    ) unless object = object[ nextKey ]


                else return callback null, 
                        
                    statusCode: 200
                    body: object


            catch error

                #
                # TODO: stop this from calling back multiple times on
                #       recurse with continuous error
                # 
                #

                callback error
