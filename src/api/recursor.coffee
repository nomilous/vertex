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

                run = ->

                    if nextKey = path.shift()

                        unless object = object[ nextKey ]

                            return callback null, statusCode: 404


                        local.recurse opts, path, object, callback

                    else return callback null, 
                            
                        statusCode: 200
                        body: object


                if typeof object is 'function'

                    object opts, (error, result) -> 

                        object = result
                        run()

                else run()


            catch error

                #
                # TODO: stop this from calling back multiple times on
                #       recurse with continuous error
                # 
                #

                callback error
