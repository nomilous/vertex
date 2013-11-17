engine = require 'engine.io'

module.exports = (config) ->

    local = 

        server: undefined

        listen: -> 

            local.server = server = engine.listen config.listen.port


            server.on 'connection', (socket) -> 

                console.log connected: socket.id



        close: ->
