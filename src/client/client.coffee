Client = require 'engine.io-client'

module.exports = (config) ->

    ###
    
    config.connect.uri - websocket uri
    config.connect.interval - retry interval for connect and reconnect

    TODO: node-bunyan logger

        config.log.streams
        config.log.serializers

    ###

    local = 

        socket: undefined

        log: 

            #
            # pending node-bunyan
            #

            info: (message, objects) -> 

                console.log TODO: 'log.info': 
                    message: message
                    objects: objects

        status:
            value: 'pending'
            at: new Date

        connect: ->

            return local.reconnect() if local.socket?

            local.socket = socket = new Client.Socket config.connect.uri

            socket.on 'error', (err) ->

                try

                    if err.description.code is 'ECONNREFUSED'

                        #
                        # engine.io socket error has nested error 
                        # at err.description carrying the ECONNREFUSED
                        # exception 
                        #

                        interval = (try config.connect.interval) || 1000

                        unless local.reconnecting?

                            local.reconnecting = setInterval local.reconnect, interval


            socket.on 'close', -> 

                interval = (try config.connect.interval) || 1000

                unless local.reconnecting?

                    local.reconnecting = setInterval local.reconnect, interval


        reconnecting: undefined
        reconnect: ->

            local.log.info 'reconnecting'


        close: ->
