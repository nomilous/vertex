VERSION = 1
Client  = require 'engine.io-client'
{v4}    = require 'node-uuid'


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

        title:   if config.title?   then config.title   else 'Untitled' 
        uuid:    if config.uuid?    then config.uuid    else  v4()
        context: if config.context? then config.context else  {}
        secret:  if config.secret?  then config.secret  else ''


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

                if local.status.value is 'pending' then local.reconnect 'connecting'
                

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

                #
                # TODO: verify that this close event always happens 
                #       after the deny message for cases where the
                #       remote side sent the deny and then closed() in
                #       the send callback of that denial
                # 
                #
 
                return if local.status.value is 'denied'

                local.log.info  'disconnected'
                local.reconnect 'reconnecting'
                


            socket.on 'open', ->

                if local.reconnecting?
                    
                    local.status.value = 'reconnected'
                    local.status.at = new Date

                    clearInterval local.reconnecting
                    local.reconnecting = undefined

                    local.log.info 'reconnected'


                else 

                    clearInterval local.connecting
                    local.connecting = undefined

                    local.status.value = 'connected'
                    local.status.at = new Date

                    local.log.info 'connected'


                socket.send "#{VERSION}#{JSON.stringify

                    #
                    # handshake
                    #

                    event:   'handshake'
                    data:
                        title:   local.title
                        uuid:    local.uuid
                        context: local.context
                        secret:  local.secret

                }"

            socket.on 'message', (payload) -> 

                version =       payload[0]
                {event, data} = JSON.parse payload[1..]
                local[event] socket, data


        accept: (socket, data) ->

            local.status.value = 'accepted'
            local.status.at = new Date
            local.log.info 'accepted'


        deny: (socket, data) ->

            local.status.value = 'denied'
            local.status.at = new Date
            local.log.info 'denied'



        connecting:   undefined
        reconnecting: undefined
        reconnect: (type) ->

            return if local.reconnecting?
            return if local.connecting?

            interval = (try config.connect.interval) || 1000
            local[type] = setInterval (->

                local.log.info type
                local.socket.open()

            ), interval

            


        close: ->
