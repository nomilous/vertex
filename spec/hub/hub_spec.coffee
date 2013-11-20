{ipso, tag, mock} = require 'ipso'

describe 'Hub', ipso (should) ->

    before ipso (Hub) -> 

        mock('socket').with 

            id: 'SOCKET_ID'
            send: ->
            on: ->

        mock('server').with 

            listen: ->
            on: ->


        config = mock('config').with

            listen: port: 3001, hostname: 'test.local'
            secret: 'right'

        logger = mock 'logger'


        tag

            subject: Hub.create config, logger
            Engine:  require 'engine.io'


    context 'create()', -> 

        it 'creates a hub instance with status and client list', 

            ipso (Hub, config, logger) -> 

                instance = Hub.create config, logger
                instance.status.value.should.equal 'pending'
                instance.status.at.should.be.an.instanceof Date
                instance.clients.should.eql {}



    it 'defines listen() and close()', 

        ipso (subject) -> 

            subject.listen.should.be.an.instanceof Function
            subject.close.should.be.an.instanceof Function



    context 'listen()', -> 

        it 'starts http listening at config.listen.port and hostname can callsback with listening instance', 

            ipso (facto, Hub, http, server, config, logger) -> 

                http.does createServer: -> server.does listen: (port, hostname, callback) -> 

                    port.should.equal 3001
                    hostname.should.equal 'test.local'
                    callback()
                    

                instance = Hub.create config, logger
                instance.listen (err, hub) -> 

                    hub.status.value.should.equal 'listening'
                    hub.should.eql instance
                    facto()

                .then


        it 'resolves the promise on listening', 

            ipso (facto, Hub, http, server, config, logger) -> 

                http.does createServer: -> server.does listen: (args...) -> args.pop()()
                instance = Hub.create config, logger
                instance.listen().then (hub) -> 

                    hub.status.value.should.equal 'listening'
                    hub.should.eql instance
                    facto()


        it.only 'rejects the promise on server errors that preceed the first listen callback', 

            ipso (facto, Hub, http, server, config, logger) -> 

                http.does createServer: -> server.does on: (pub, sub) -> 
                    
                    if pub is 'error' then sub new Error 'listen EADDRINUSE'

                instance = Hub.create config, logger
                instance.listen().then (->), (error) -> 

                    error.message.should.equal 'listen EADDRINUSE'
                    facto()



        it 'starts engine.io listening', 

            ipso (subject, config, server, Engine) -> 

                Engine.does listen: (port) -> 

                    port.should.equal 3001
                    return server

                subject.listen()
                subject.server.is server

        context 'on connection', -> 

            beforeEach ipso (Engine, server, socket) -> 

                server.does on: (event, subscriber) -> 

                    if event is 'connection' 

                        #
                        # mock connecting socket
                        #

                        subscriber socket

                Engine.does listen: -> server


            it 'stores the socket in the clients collection keyed on socket.id', 

                ipso (subject, server, socket) -> 

                    subject.listen()
                    subject.clients['SOCKET_ID'].socket.is socket

            it 'assigns connected status', 

                ipso (subject, server, socket) -> 

                    subject.does timestamp: -> 'TIMESTAMP'

                    subject.listen()
                    subject.clients['SOCKET_ID'].status.should.eql 

                        value: 'connected'
                        at: 'TIMESTAMP'



    context 'handshake()', -> 

        before ipso (Engine, server, socket) -> 

            Engine.does listen: -> return server

            server.does on: (event, subscriber) -> 

                if event is 'connection' then subscriber socket

            socket.does on: (event, subscriber) =>

                if event is 'message' 

                    #
                    # mock inbound handshake
                    #

                    subscriber "1#{
                        JSON.stringify
                            event: 'handshake'
                            data: @data
                    }"

        beforeEach ipso (subject) -> 

            subject.clients = {}

            @data = 'HANDSHAKE_DATA'



        it 'is called with the socket and data on handshake event',

            ipso (facto, subject, socket) -> 

                subject.does handshake: (newSocket, data) -> 

                    newSocket.is socket
                    data.should.equal 'HANDSHAKE_DATA'
                    facto()

                subject.listen()


        it 'sends deny if the secret does not match', 

            ipso (facto, subject, socket) -> 

                socket.does send: (message) -> 

                    message.should.equal '1{"event":"deny"}'
                    facto()


                @data = secret: 'wrong'
                subject.listen()


        it 'sends accept if the secret does match',

            ipso (facto, subject, socket) -> 

                socket.does send: (message) -> 

                    message.should.equal '1{"event":"accept"}'
                    facto()

                @data = secret: 'right'
                subject.listen()


        it 'stores title, uuid and context in clients collection',

            ipso (subject, socket) -> 

                @data = 
                    title:   'Title'
                    uuid:    'UUID'
                    context: starting: context: 1
                    secret:  'right'

                subject.listen()

                client = subject.clients['SOCKET_ID']
                client.title.should.equal 'Title'
                client.uuid.should.equal  'UUID'
                client.context.should.eql  starting: context: 1

        it 'updates status to authorized',

            ipso (subject, socket) -> 

                subject.does timestamp: -> 'TIMESTAMP'

                @data = 
                    title:   'Title'
                    uuid:    'UUID'
                    context: starting: context: 1
                    secret:  'right'

                subject.listen()

                status = subject.clients['SOCKET_ID'].status
                status.value.should.equal 'authorized'
                status.at.should.equal 'TIMESTAMP'



        it 'keeps index uuid2socketid', 

            ipso (subject, socket) -> 

                @data = 
                    title:   'Title'
                    uuid:    'UUID'
                    context: starting: context: 1
                    secret:  'right'

                subject.listen()

                index = subject.index.uuid2socketid
                index['UUID'] = 'SOCKET_ID'


        it 'preserves per client cache across reconnect', 

            ipso (subject, socket) -> 

                subject.clients['PREVIOUS_SOCKET_ID'] = cache: key: 'value'
                subject.index.uuid2socketid['UUID'] = 'PREVIOUS_SOCKET_ID'

                @data = 
                    title:   'Title'
                    uuid:    'UUID'
                    context: starting: context: 1
                    secret:  'right'

                socket.with id: 'NEW_SOCKET_ID'
                subject.listen()

                client = subject.clients['NEW_SOCKET_ID']
                client.cache.should.eql key: 'value'


    context 'on message', ->



