{deferred} = require 'also'
 
module.exports.create = (config, log) ->

    config ||= {}
    config.api ||= {}
    config.api.root ||= {}

    return local = 

        process: deferred (action, opts) -> 

            path = opts.path.split( '/' ).filter (p) -> p.length > 0

            local.recurse opts, path, config.www.root, (error, result) -> 

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

                        #
                        # TODO: recursor may have walked into fuction result subtree
                        #       the $www "config" from that may be necessary in the
                        #       handler receiving this callback
                        #


                #if path[0]? and object[path[0]]?
                if path[0]? and object[path[0]]? and path[0] isnt '$www'

                                                                #
                                                                # TODO: consider the usefulness of 
                                                                #       exposting /path/to/function/$www
                                                                #       (config container)
                                                                # 
                                                                #       for now it is not exposed
                                                                #


                    #
                    # recurse if the next node in the path is a property of object
                    #

                    run()


                else if typeof object is 'function'

                    unless object.$www

                        return callback null, statusCode: 404

                    opts.rest = path
                    opts.www  = object.$www

                    object opts, (error, result) -> 

                        #
                        # TODO: error
                        # TODO: www function controls content type
                        # 

                        if result.body? or result.statusCode?

                            return callback null,

                                statusCode: result.statusCode || 200
                                headers: result.headers
                                body: result.body || ''
                                www: object.$www

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
