{ipso, mock} = require 'ipso'

describe 'Api', ipso (Api, should) -> 

    @timeout 100

    before -> 

        mock('config').with

            api: listen: port: 2999, hostname: 'test.local'

        mock('server').with

            listen:->
            close: ->
            on: ->

        mock('logger')

        mock('handler').with

            handle:->
    

    it 'uses config.api for listen configuration', (done) -> 

        #
        # TODO: ipso: how exactly to formulate a property expectation that is not confusing?
        #             is it worth it?
        # 

        config = {}
        Object.defineProperty config, 'api', get: -> done()
        Api.create( config ).listen()



    context 'create()', ->

        it 'creates an api server instance with handler and status', 

            ipso (config, Handler) -> 

                instance = Api.create config
                instance.handler.should.equal Handler._test().handle
                instance.status.value.should.equal 'pending'
                instance.status.at.should.be.an.instanceof Date


        it 'passes the config and logger to the handler factory', 

            ipso (config, logger, Handler, handler) -> 

                Handler.does create: (conf, log) -> 

                    config.is conf
                    logger.is log
                    return handler

                instance = Api.create config, logger



    context 'listen()', -> 

        it 'starts http listening at config.api.listen.port and hostname', 

            ipso (facto, http, server, config, logger) -> 

                http.does 
                    createServer: -> 
                        return server.does 
                            listen: (port, hostname) -> 
                                port.should.equal 2999
                                hostname.should.equal 'test.local'
                                facto()

                Api.create( config, logger ).listen ->
        

        it 'sets status to listening and callsback with local api instance',

            ipso (facto, http, server, config, logger) ->

                http.does 
                    createServer: -> 
                        return server.does
                            listen: (args...) -> args.pop()() # callback is last arg
                        

                instance = Api.create config, logger
                instance.listen (err, api) -> 

                    api.should.equal instance
                    api.status.value.should.equal 'listening'
                    api.status.at.should.be.an.instanceof Date
                    facto()



        it 'callsback error if error before listening',

            ipso (facto, http, server, config, logger) -> 

                http.does 
                    createServer: -> 
                        return server.does
                            on: (pub, sub) -> 
                                if pub is 'error' then sub new Error 'listen EADDRINUSE'

                instance = Api.create config, logger
                instance.listen (err, api) -> 

                    err.message.should.equal 'listen EADDRINUSE'
                    facto()


                # 
                # chop the promise chain, to prevent ipso from failing on 
                # the carried rejection 
                # 

                .then


        it 'returns a promise', 

            ipso (http, server, config, logger) -> 

                http.does createServer: -> server
                instance = Api.create config, logger
                instance.listen().then.should.be.an.instanceof Function


        it 'resolves the promise on listen callback with the api instance',

            ipso (facto, http, server, config, logger) -> 

                http.does createServer: -> server.does listen: (args...) -> args.pop()()
                instance = Api.create config, logger
                instance.listen().then (api) -> 

                    api.should.equal Api._test()
                    facto()


        it 'rejects the promise on server errors that preceed the first listen callback', 

            ipso (facto, http, server, config, logger) -> 

                http.does 
                    createServer: -> 
                        return server.does
                            on: (pub, sub) -> 
                                if pub is 'error' then sub new Error 'listen EADDRINUSE'

                instance = Api.create config, logger
                instance.listen().then (->), (error) -> 

                    error.message.should.equal 'listen EADDRINUSE'
                    facto()




    context 'close()', ->

        it 'can stop http', 

            ipso (facto, http, server, config, logger) -> 

                http.does 
                    createServer: -> 
                        return server.does
                            listen: (args...) -> args.pop()()
                            close: -> facto()   

                instance = Api.create config, logger
                instance.listen -> instance.close()

