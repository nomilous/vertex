
#
# TODO: move version "agreement" into handshake
#       enable per uuid secret, probably via userdefined config.authenticate()
# 


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


                log.debug
                    socket: socket
                    'hub connection'


                local.clients[socket.id] = 

                    status: 
                        value: 'connected'
                        at: local.timestamp()
                    socket: socket



                socket.on 'message', (payload) -> 

                    {event, data} = JSON.parse payload
                    local[event] socket, data


                socket.on 'close', -> local.disconnect socket


            transport.on 'error', (error) -> 

                if local.status.value is 'pending'

                    callback error if typeof callback is 'function'
                    action.reject error
                    return

                #
                # transport errors after connect?
                #

                log.error 
                    err: error
                    'transport error'


            transport.listen config.listen.port, config.listen.hostname, -> 

                local.status.value = 'listening'
                local.status.at = new Date
                callback null, local if typeof callback is 'function'
                action.resolve local


        handshake: (socket, data) -> 

            {secret, title, uuid, context} = data

            unless secret is config.secret

                log.debug
                    client: title: title, uuid: uuid
                    socket: socket
                    'hub deny'

                socket.send '{"event":"deny"}', -> socket.close()
                return

                #
                # TODO: remove local.client[socket_id]
                #


            action = 'join'

            try client = local.clients[socket.id]
            unless client?

                log.error
                    socket: socket
                    'hub unknown socket id'

                socket.send '{"event":"deny"}', -> socket.close()
                return 

                #
                # TODO: disconnect, remove local.client[socket_id]
                #


            if previousID = local.index.uuid2socketid[uuid]

                action = 'resume'

                previousClient = local.clients[previousID]
                client.cache = previousClient.cache

                #
                # TODO: delete previous client reference
                #    
                #    ##undecided1
                #    * pending decision: allow more than one connection per uuid
                #    * currenly allowed, and this 'resume' will occur on all
                #      subsequent / concurrent connections (not ideal)
                #


            client.title   = title
            client.uuid    = uuid
            client.context = context

            client.status.value = 'accepted'
            client.status.at    = local.timestamp()

            local.index.uuid2socketid[uuid] = socket.id

            log.debug
                client: title: title, uuid: uuid
                socket: socket
                'hub accept'

            socket.send '{"event":"accept"}'

            peers = {}
            for otherUUID of local.index.uuid2socketid

                continue if otherUUID is uuid
                socketID = local.index.uuid2socketid[otherUUID]
                peer = local.clients[socketID]

                peers[otherUUID] = 

                    title: peer.title
                    context: peer.context


            socket.send JSON.stringify

                #
                # de-bloat protocol later
                #

                event: 'peer'
                action: 'list'
                list: peers


            local.broadcast socket,

                event: 'peer'
                action: action
                uuid: client.uuid
                title: client.title
                context: client.context


        disconnect: (socket) -> 



            client = local.clients[socket.id]

            unless client?

                log.debug
                    socket: socket
                    'unknown socket disconnected'

                return

            log.debug
                client: 
                    title: client.title
                    uuid: client.uuid
                socket: socket
                'disconnected'

            client.status.value = 'disconnected'
            client.status.at    = local.timestamp()


            #
            # TODO: reap (after time)
            #

            
            local.broadcast socket, 

                event: 'peer'
                action: 'depart'
                uuid: client.uuid

                #
                # BUG: for as long as multiple hub connection with same uuid
                #      are allowed (##undecided1) -- this depart is a problem
                #      because it informs all clients of the first departure
                #      despite possible subsequent concurrent connections 
                #      with the sme uuid still being present
                # 
                #


        #
        # TODO: * distribute peer list for broadcast reference
        #           * peer arrives / peer departs (on explicit depart / on timeout if connect lost)
        #           * include context assocaited to uuid
        #       * broadcast contains to origin uuid
        #       
        #

        broadcast: (socket, data) ->

            clients = local.clients
            origin  = clients[socket.id]

            #
            # TODO: - broadcast should contain origin uuid
            #       - possibly too expensive (payload size), alternative?
            #

            #
            # hac: stick the uuid in if missing 
            #      need a more structured approach
            #

            data.uuid = origin.uuid unless data.uuid?
            payload   = JSON.stringify data

            for id of clients

                continue if id is socket.id
                client = clients[id]
                continue unless client.status.value is 'accepted'
                client.socket.send payload



        close: ->
