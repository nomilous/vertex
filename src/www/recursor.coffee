{deferred} = require 'also'
 
module.exports.create = (config, log) ->

    config ||= {}
    config.api ||= {}
    config.api.root ||= {}

    return local = 

        process: deferred (action, opts) -> 

            path = opts.path.split( '/' ).filter (p) -> p.length > 0

            local.recurse opts, path, config.www.root, (error, result, api) -> 

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

                    unless object.$api

                        return callback null, statusCode: 404

                    opts.rest = path
                    opts.api  = object.$api

                    object opts, (error, result) -> 

                        #
                        # TODO: error
                        # TODO: api function controls content type
                        # 

                        if result.body? or result.statusCode?

                            return callback null,

                                statusCode: result.statusCode || 200
                                body: result.body || ''

                                object.$api

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
