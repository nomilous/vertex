{ipso, mock, tag} = require 'ipso'

describe 'Client', ipso (should) -> 


    before ipso (done, Client) -> 

        socket   = mock 'socket'
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
        
        tag

            subject: Client mock 'config'
            EngineClient: require 'engine.io-client'

        .then done



    it '[temporary] check the mock setup', ipso (EngineClient, socket) -> 

        socket.with 
            property1: 'value1'
            property2: 'value2'

        socket.does
            function1: ->
            function2: ->


        testMockSocket = new EngineClient.Socket
        testMockSocket.property1.should.equal 'value1'
        testMockSocket.property2.should.equal 'value2'

        testMockSocket.function1()
        #testMockSocket.function2()




    it 'defines connect and close', ipso (subject) -> 

        subject.connect.should.be.an.instanceof Function
        subject.close.should.be.an.instanceof Function





    context 'connect()', -> 

        it 'connects the engine.io-client', 

            ipso (facto, subject, config, EngineClient) ->

                EngineClient.Socket = class

                    constructor: (uri) -> 

                        uri.should.equal 'ws://localhost:3001'
                        facto()

                config.with connect: uri: 'ws://localhost:3001'
                subject.connect()



