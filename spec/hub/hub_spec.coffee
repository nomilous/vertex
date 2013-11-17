{ipso, tag, mock} = require 'ipso'

describe 'Hub', ipso (should) ->

    before ipso (done, Hub) -> 

        mock('socket').with id: 'SOCKET_ID'

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

            beforeEach ipso (Engine, server) -> Engine.does listen: -> server


            it 'stores the socket in the clients collection keyed on socket.id', 

                ipso (subject, server, socket) -> 

                    server.does on: (event, subscriber) -> 

                        if event is 'connection' 

                            #
                            # mock connecting socket
                            #

                            subscriber socket

                    subject.listen()
                    subject.clients['SOCKET_ID'].socket.is socket

