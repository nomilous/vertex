VERSION = 1 
engine  = require 'engine.io'

module.exports = (config) ->

    local = 

        server: undefined

        clients: {}

        timestamp: -> new Date

        listen: -> 

            local.server = server = engine.listen config.listen.port

            server.on 'connection', (socket) -> 

                local.clients[socket.id] = 

                    status: 
                        value: 'connecting'
                        at: local.timestamp()
                    socket: socket

                socket.on 'message', (payload) -> 

                    version =       payload[0]
                    {event, data} = JSON.parse payload[1..]
                    local[event] socket, data
                    

        handshake: (socket, data) -> 

            

            {secret} = data

            unless secret is config.secret

                socket.send VERSION + '{"event":"reject"}'

            





        close: ->
