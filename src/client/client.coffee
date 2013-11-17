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

                if local.status.value is 'pending' then local.reconnect()
                

                # if err.description? and err.description.code is 'ECONNREFUSED'

                #     #
                #     # engine.io socket error has nested error 
                #     # at err.description carrying the ECONNREFUSED
                #     # exception 
                #     #

                #     local.reconnect()

                #
                # TODO: any cases where 'error' happens instead of 'close'?
                #       (it will result in no reconnect loop and no connection)
                #



            socket.on 'close', -> 

                local.reconnect()


            socket.on 'open', ->

                if local.reconnecting?
                
                    clearInterval local.reconnecting
                    local.reconnecting = undefined

                local.status.value = 'connecting'
                local.status.at = new Date

                local.log.info 'connected'



        reconnecting: undefined
        reconnect: ->

            return if local.reconnecting?

            interval = (try config.connect.interval) || 1000
            local.reconnecting = setInterval (->

                local.log.info 'reconnecting'
                local.socket.open()

            ), interval

            


        close: ->
