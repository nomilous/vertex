http    = require 'http'
Handler = require './handler'
{deferred} = require 'also'

lastInstance = undefined
module.exports._test  = -> lastInstance
module.exports.create = (config, log) ->

    lastInstance = local = 

        server: undefined

        handler: Handler.create( config, log ).handle

        status:
            value: 'pending'
            at: new Date


        listen: deferred (action, callback) ->

            #
            # TODO: similar to hub.listen - deduplicate
            #

            return unless try listenArgs = config.www.listen

            port      = parseInt listenArgs.port
            hostname  = listenArgs.hostname



            local.server = server = http.createServer (req, res) -> 

                local.handler req, res


            server.on 'error', (error) -> 

                if local.status.value is 'pending'

                    callback error if typeof callback is 'function'
                    action.reject error

                #
                # TODO: any possible errors here that happen after successful bind?
                #       (or not fatal to the server)
                #
           
            
            server.listen port, hostname, ->

                local.status.value = 'listening'
                local.status.at = new Date
                callback null, local if typeof callback is 'function'
                action.resolve local


        close: (callback) ->

            #
            # TODO: percolate closeability to the top
            #

            try local.server.close callback

