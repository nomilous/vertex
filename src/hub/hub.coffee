engine = require 'engine.io'

module.exports = (config) ->

    local = 

        server: undefined

        clients: {}

        listen: -> 

            local.server = server = engine.listen config.listen.port


            server.on 'connection', (socket) -> 

                local.clients[socket.id] = socket: socket



        close: ->
