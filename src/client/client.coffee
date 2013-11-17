Client = require 'engine.io-client'

module.exports = (config) ->

    ###
    
    * `config.connect.uri` - websocket uri
    * `config.connect.interval` - retry interval for connect and reconnect
        * does not back off exponentially

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

                if err.description? and err.description.code is 'ECONNREFUSED'

                    #
                    # engine.io socket error has nested error 
                    # at err.description carrying the ECONNREFUSED
                    # exception 
                    #

                    local.reconnect()



            socket.on 'close', -> 

                local.reconnect()




        reconnecting: undefined
        reconnect: ->

            return if local.reconnecting?

            interval = (try config.connect.interval) || 1000
            local.reconnecting = setInterval (->

                local.log.info 'reconnecting'

            ), interval

            


        close: ->
