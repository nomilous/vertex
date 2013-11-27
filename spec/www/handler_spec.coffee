{ipso, mock, tag} = require 'ipso'

describe 'Handler.create()', ipso (Handler) -> 

    @timeout 100

    before ipso -> 

        mock 'logger'
        mock 'request'
        mock 'response'

        Handler.create mock 'config'
        tag handler: Handler._test()


    beforeEach ipso (request, response) ->

        request.with

            #
            # default mock request calls end event (almost) immediately
            #

            on: (event, handler) -> 

                if event is 'end' then process.nextTick handler

        response.with

            writeHead: ->
            write: ->
            end: ->


    it 'uses config.root for route configuration', ipso (done) -> 

        config = {}
        Object.defineProperty config, 'root', get: -> done()    # ipso: consider 
                                                                #    
                                                                #   mock.has(list)  for thing.property      (assignment expectation)
                                                                #   mock.gets(list) for thing.property = '' (access expectation)
                                                                #          
                                                                #         that fail if not setted or getted
                                                                # (a lot more complex from a usecase perspective than function expections)
                                                                # 
        Handler.create config


    it 'defines a handle function', ipso (done) -> 

        handler = Handler.create {}
        handler.handle.should.be.an.instanceof Function
        done()

    it 'creates a Recursor with the config tree and logger', 

        ipso (Recursor, config, logger) -> 

            Recursor.does create: (conf, log) -> conf.is config; log.is logger
            Handler.create config, logger


    it 'creates a Cache with the config tree and logger', 

        ipso (Cache, config, logger) -> 

            Cache.does create: (conf, log) -> conf.is config; log.is logger
            Handler.create config, logger


    context 'handle()', -> 

        it 'responds 404 to / if config.api.allowRoot is unspecified', ipso (done) -> 

            {handle} = Handler.create
                root: tree: of: 'things'

            handle req = url: '/', res = 
                writeHead: (statusCode) -> 
                    statusCode.should.equal 404
                    done()
                end: -> 


        it 'responds to /engine.io.js with the client side script', 

            ipso (facto, handler, config, request, response) -> 

                handler.handle( 

                    request.with 

                        url: '/engine.io.js'
                        method: 'GET'

                    response.does

                        end: (body) -> 

                            body.should.match /engine\.io/
                            facto()

                ) 
        

        it 'calls responder() with request details and response object', 

            ipso (facto, handler, config, request, response) -> 

                handler.does responder: (opts, res) ->

                    res.is response
                    opts.should.eql 

                        headers: 
                            head: 'ers'
                        method: 'GET'
                        path: '/path/objects'
                        query: 
                            key1: 'value1'
                            key2: 'value2'
                        body: ''

                    facto()


                handler.handle( 

                    request.with 

                        url: '/path/objects?key1=value1&key2=value2'
                        method: 'GET'
                        headers: head: 'ers'

                    response

                )

        it 'reads the request body stream and passes it to responder()', 

            ipso (facto, handler, config, request, response) -> 

                config.with www: allowRoot: true
                
                stream = mock('stream').does

                    #error: ->

                    data: (subscriber) -> 

                        #
                        # body arrives in 2 parts
                        #

                        setTimeout (  -> subscriber '{"0":' ),  5
                        setTimeout (  -> subscriber '"o"}'  ),  10

                    end: (subscriber) -> setTimeout subscriber, 15


                request.with

                    url: '/'
                    headers: 
                        'content-type': 'application/json'

                request.does 

                    on: (event, subscriber) -> stream[event] subscriber

                handler.does 

                    responder: ({body}) -> 

                        body.should.eql "0":"o"
                        facto()

                handler.handle request, response
                


        xit 'configurable option to get the stream into a $www function instead'



    context 'responder()', ipso (also) -> 

        before ipso (done) -> 

            Handler.create 
                www:
                    allowRoot: true
                    root: modules: {}

            tag( handler1: Handler._test() )

            .then done


        it 'calls prepare() and process() in sequence with opts', ipso (facto, handler) -> 

            handler.does 

                _prepare: (opts) -> opts.prepped = true
                process: (opts) -> 

                    opts.prepped.should.equal true
                    opts.is insertedOpts
                    facto()

            handler.responder insertedOpts = mock 'opts'


        it 'responds with the processed results as json', ipso (facto, handler, response, also) -> 

            handler.does 
                process: also.deferred ({resolve}, opts) -> 
                    resolve 
                        body: 
                            test: 'value'


            handler.responder {}, response.does

                writeHead: (statusCode, headers) -> 

                    statusCode.should.equal 200
                    headers.should.eql
                        'Content-Type': 'application/json'
                        'Content-Length': 16

                write: (body) -> body.should.equal '{"test":"value"}'
                end: -> facto()


