VERSION    = 1 
engine     = require 'engine.io'
http       = require 'http'
{deferred} = require 'also'

module.exports.create = (config, log) ->

    local = 

        transport: undefined

        server: undefined

        clients: {}

        index: 

            uuid2socketid: {}


        status:
            value: 'pending'
            at: new Date


        timestamp: -> new Date

        listen: deferred (action, callback) -> 

            #
            # TODO: similar to api.listen - deduplicate
            #

            local.transport = transport = http.createServer()
            local.server    = server    = engine.attach transport


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



            transport.on 'error', (error) -> 

                if local.status.value is 'pending'

                    callback error if typeof callback is 'function'
                    action.reject error


            transport.listen config.listen.port, config.listen.hostname, -> 

                local.status.value = 'listening'
                local.status.at = new Date
                callback null, local if typeof callback is 'function'
                action.resolve local
                    

        handshake: (socket, data) -> 

            {secret, title, uuid, context} = data

            unless secret is config.secret
                socket.send VERSION + '{"event":"deny"}', -> socket.close()
                return

                #
                # TODO: remove local.client[socket_id]
                #


            try client = local.clients[socket.id]
            unless client?

                local.log.error 'unknown socket id', socket: socket

                socket.send VERSION + '{"event":"deny"}', -> socket.close()
                return 

                #
                # TODO: disconnect, remove local.client[socket_id]
                #


            if previousID = local.index.uuid2socketid[uuid]

                previousClient = local.clients[previousID]
                client.cache = previousClient.cache

                #
                # TODO: delete previous client reference
                #


            client.title   = title
            client.uuid    = uuid
            client.context = context

            client.status.value = 'authorized'
            client.status.at    = local.timestamp()

            local.index.uuid2socketid[uuid] = socket.id


            socket.send VERSION + '{"event":"accept"}'



        close: ->
