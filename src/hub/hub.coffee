engine = require 'engine.io'

module.exports = (config) ->

    local = 

        server: undefined

        timestamp: -> new Date

        clients: {}

        listen: -> 

            local.server = server = engine.listen config.listen.port


            server.on 'connection', (socket) -> 

                local.clients[socket.id] = 

                    status: 
                        value: 'connecting'
                        at: local.timestamp()
                    socket: socket



        close: ->
