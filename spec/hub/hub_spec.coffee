{ipso, tag, mock} = require 'ipso'

describe 'Hub', ipso (should) ->

    before ipso (done, Hub) -> 

        mock('socket').with 

            id: 'SOCKET_ID'
            send: ->
            on: ->

        mock('server').with on: ->

        tag

            subject: Hub mock('config').with

                listen: port: 3001

            Engine: require 'engine.io'

        .then done


    it 'defines listen() and close()', 

        ipso (subject) -> 

            subject.listen.should.be.an.instanceof Function
            subject.close.should.be.an.instanceof Function



    context 'listen()', -> 

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

            it 'assigns connecting status', 

                ipso (subject, server, socket) -> 

                    subject.does timestamp: -> 'TIMESTAMP'

                    subject.listen()
                    subject.clients['SOCKET_ID'].status.should.eql 

                        value: 'connecting'
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

        beforeEach -> @data = 'HANDSHAKE_DATA'


        it 'is called with the socket and data on handshake event',

            ipso (facto, subject, socket) -> 

                subject.does handshake: (newSocket, data) -> 

                    newSocket.is socket
                    data.should.equal 'HANDSHAKE_DATA'
                    facto()

                subject.listen()


        it 'sends reject if the secret does not match', 

            ipso (facto, subject, socket) -> 

                socket.does send: (message) -> 

                    message.should.equal '1{"event":"reject"}'
                    facto()


                @data = secret: 'wrong'
                subject.listen()

