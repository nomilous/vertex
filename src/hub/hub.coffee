VERSION = 1 
engine  = require 'engine.io'

module.exports = (config) ->

    local = 

        server: undefined

        clients: {}

        timestamp: -> new Date

        log: 

            error: (message, objects) -> 

                console.log todo: 'log.error': message: message, objects: objects

        listen: -> 

            local.server = server = engine.listen config.listen.port

            server.on 'connection', (socket) -> 

                local.clients[socket.id] = 

                    status: 
                        value: 'connected'
                        at: local.timestamp()
                    socket: socket

                socket.on 'message', (payload) -> 

                    version =       payload[0]
                    {event, data} = JSON.parse payload[1..]
                    local[event] socket, data
                    

        handshake: (socket, data) -> 

            {secret, title, uuid, context} = data

            unless secret is config.secret
                return socket.send VERSION + '{"event":"reject"}'

                #
                # TODO: disconnect, remove local.client[socket_id]
                #


            try client = local.clients[socket.id]
            unless client?
                local.log.error 'unknown socket id', socket: socket
                return socket.send VERSION + '{"event":"reject"}'

                #
                # TODO: disconnect, remove local.client[socket_id]
                #



            client.title   = title
            client.uuid    = uuid
            client.context = context

            client.status.value = 'authorized'
            client.status.at    = local.timestamp()


            socket.send VERSION + '{"event":"accept"}'



        close: ->
