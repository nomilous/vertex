engine = require 'engine.io'

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

                socket.on 'message', (data) -> 

                    version = data[0]
                    console.log 
                        protocol_version: version
                        payload: JSON.parse data[1..]




        close: ->
