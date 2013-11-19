http    = require 'http'
Handler = require './handler'

module.exports.create = (config, log) ->

    local = 

        server: undefined

        handler: Handler.create( config, log ).handle

        status:
            value: 'pending'
            at: new Date


        listen: (callback) ->

            return unless try listenArgs = config.api.listen

            port      = parseInt listenArgs.port
            hostname  = listenArgs.hostname



            local.server = server = http.createServer (req, res) -> 

                local.handler req, res


            server.on 'error', (error) -> 

                if local.status.value is 'pending'

                    callback error, local

                #
                # TODO: any possible errors here that happen after successful bind?
                #       (or not fatal to the server)
                #
           
            
            server.listen port, hostname, ->

                local.status.value = 'listening'
                local.status.at = new Date
                callback null, local


        close: (callback) ->

            #
            # TODO: percolate closeability to the top
            #

            try local.server.close callback

