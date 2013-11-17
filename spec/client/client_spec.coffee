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

            subject: Client mock('config').with 
                connect: 
                    uri: 'ws://localhost:3001'
            EngineClient: require 'engine.io-client'

        .then done



    it 'defines connect and close', ipso (subject) -> 

        subject.connect.should.be.an.instanceof Function
        subject.close.should.be.an.instanceof Function



    context 'connect()', -> 

        it 'connects the engine.io-client socket', 

            ipso (facto, subject, config, EngineClient) ->

                EngineClient.Socket = class

                    constructor: (uri) -> 

                        uri.should.equal 'ws://localhost:3001'
                        facto()

                subject.connect()


        it 'connects the socket only once', 

            ipso (subject, config, EngineClient) ->

                count = 0
                EngineClient.Socket = class
                    constructor: -> @seq = ++count

                delete subject.socket

                
                subject.connect()
                subject.socket.seq.should.equal 1

                subject.connect()
                subject.socket.seq.should.equal 1

