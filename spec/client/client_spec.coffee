{ipso, mock, tag} = require 'ipso'

describe 'Client', ipso (should) -> 


    before ipso (done, Client) -> 

        socket   = mock 'socket'
        
        tag

            subject: Client mock('config').with 
                connect: 
                    uri: 'ws://localhost:3001'
                    interval: 10
            EngineClient: require 'engine.io-client'

        .then done


    beforeEach ipso (subject, socket, EngineClient) ->

        EngineClient = require 'engine.io-client'
        EngineClient.Socket = class

            #
            # stub the engine.io-client.Socket class to "construct" the mock socket
            # ---------------------------------------------------------------------
            # 
            # * this stubs the entire Socket class
            # * it may prove rather cumbersome (perhaps does should do prototype expectations after all)
            # 

            constructor: -> @[prop] = socket[prop] for prop of socket
            on: ->

        subject.socket = undefined



    it 'defines connect and close', ipso (subject) -> 

        subject.connect.should.be.an.instanceof Function
        subject.close.should.be.an.instanceof Function



    it 'defines status', ipso (subject) -> should.exist subject.status



    context 'connect()', -> 

        it 'connects the engine.io-client socket', 

            ipso (facto, subject, config, EngineClient) ->

                EngineClient.Socket = class

                    constructor: (uri) -> 

                        uri.should.equal 'ws://localhost:3001'
                        facto()

                    on: ->

                subject.connect()


        it 'calls reconnect if the socket was already connected', 

            ipso (subject, config, EngineClient) ->

                count = 0
                EngineClient.Socket = class
                    constructor: -> @seq = ++count
                    on: ->

                subject.connect()
                subject.socket.seq.should.equal 1

                subject.does reconnect: -> 
                subject.connect()
                subject.socket.seq.should.equal 1


        it 'enters a reconnect loop if the first connect fails', 

            ipso (facto, subject, config, socket) ->

                socket.does on: (event, handler) -> 

                    #
                    # mock connection error
                    #

                    if event is 'error' then process.nextTick -> 

                        handler description: code: 'ECONNREFUSED'

                subject.does reconnect: -> facto()
                subject.connect()



