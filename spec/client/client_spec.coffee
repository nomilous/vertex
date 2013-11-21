{ipso, mock, tag} = require 'ipso'

describe 'Client', ipso (should) -> 


    before ipso (Client, bunyan) -> 

        logger = mock('logger').with 

            info: -> 
            debug: -> 

        bunyan.does createLogger: -> logger

        socket = mock('socket').with 

            on: ->
            open: ->
            send: ->

        config = mock('config').with

            title: 'Title'
            uuid: 'UUID'
            secret: 'secret'
            context: some: 'things'
            connect: 
                uri: 'ws://localhost:3001'
                interval: 1000
        
        tag

            subject: Client.create config
            EngineClient: require 'engine.io-client'


    beforeEach ipso (subject, socket, EngineClient) ->

        #
        # reset subject properties asif before first connect
        #

        subject.socket = undefined
        clearInterval subject.reconnecting
        subject.reconnecting = undefined
        subject.status = 
            value: 'pending'
            at: new Date

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

    it 'creates a logger',

        ipso (Client, config, Logger, logger) -> 

            Logger.does create: (config) ->

                config.log.level.should.equal 'fatal'
                return logger


            instance = Client.create config.with log: level: 'fatal'
            logger.is instance.log


    it 'defines connect and close', 

        ipso (subject) -> 

            subject.connect.should.be.an.instanceof Function
            subject.close.should.be.an.instanceof Function



    it 'defines status', 

        ipso (subject) -> 

            should.exist subject.status


    

    it 'can specify title, uuid and context', 

        ipso (subject) -> 

            subject.title.should.equal 'Title'
            subject.uuid.should.equal  'UUID'
            subject.context.should.eql some: 'things'



    it 'defaults uuid and title', 

        ipso (Client) -> 

            instance = Client.create {}
            instance.uuid.should.match /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
            instance.title.should.equal 'Untitled'



    context 'connect()', -> 

        it 'connects the engine.io-client socket', 

            ipso (facto, subject, EngineClient) ->

                EngineClient.Socket = class

                    constructor: (uri) -> 

                        uri.should.equal 'ws://localhost:3001'
                        facto()

                    on: ->

                subject.connect()


        it 'calls reconnect if the socket was already connected', 

            ipso (subject, EngineClient) ->

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

            ipso (facto, subject, socket) ->

                subject.does reconnect: -> facto()

                socket.does on: (event, subscriber) -> 

                    if event is 'error' 

                        #
                        # mock connection error by calling the error subscriber
                        #

                        errorCallback = subscriber
                        process.nextTick -> errorCallback description: code: 'ECONNREFUSED'

                subject.connect()


        it 'enters a reconnect loop if the socket is closed', 

            ipso (facto, subject, socket) ->

                subject.does reconnect: -> facto()

                socket.does on: (event, subscriber) -> 

                    if event is 'close'

                        closeCallback = subscriber
                        process.nextTick -> closeCallback()

                
                subject.connect()



        it 'clears the reconnecting and connecting intervals on open', 

            ipso (facto, subject, socket) -> 

                socket.does 

                    on: (event, subscriber) -> 

                        if event is 'error' 

                            errorCallback = subscriber
                            setTimeout (-> 
                                errorCallback description: code: 'ECONNREFUSED'
                            ), 10

                        if event is 'open'

                            connectionCallback = subscriber
                            setTimeout (-> 

                                connectionCallback()
                                should.not.exist subject.reconnecting
                                should.not.exist subject.connecting
                                facto()

                            ), 20


                subject.connect()


        it 'calls the socket to open in reconnect()', 

            ipso (facto, subject, socket) -> 

                socket.does open: -> facto()
                subject.socket = socket
                subject.reconnect()


        it 'sets status to connecting on open', 

            ipso (subject, socket) ->

                socket.does on: (event, subscriber) ->

                    if event is 'open' then subscriber()

                subject.connect()
                subject.status.value.should.equal 'connected'


        it 'sends the handshake on open',

            ipso (subject, socket) -> 

                socket.does 

                    on: (event, subscriber) ->  if event is 'open' then subscriber()
                    send: (payload) -> payload.should.equal "1#{JSON.stringify 

                        event: 'handshake'
                        data:
                            title:  'Title'
                            uuid:   'UUID'
                            context: some: 'things'
                            secret: 'secret'

                    }"

                subject.connect()



