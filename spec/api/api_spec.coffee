{ipso, mock} = require 'ipso'

describe 'Api', ipso (Api, should) -> 

    @timeout 10

    before -> 

        mock('config').with

            api: listen: port: 2999, hostname: 'test.local'

        mock('server').with

            listen:->
            close: ->
            on: ->
    

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



    context 'listen()', -> 

        it 'starts http listening at config.api.listen.port and hostname', 

            ipso (facto, http, server, config) -> 

                http.does 
                    createServer: -> 
                        return server.does 
                            listen: (port, hostname) -> 
                                port.should.equal 2999
                                hostname.should.equal 'test.local'
                                facto()

                Api.create( config ).listen ->
        

        it 'sets status to listening and callsback with local api instance',

            ipso (facto, http, server) ->

                http.does 
                    createServer: -> 
                        return server.does
                            listen: (args...) -> args.pop()() # callback is last arg
                        

                instance = Api.create api: listen: {}
                instance.listen (err, api) -> 

                    api.should.equal instance
                    api.status.value.should.equal 'listening'
                    api.status.at.should.be.an.instanceof Date
                    facto()



        it 'calls back error if error before listening callback'

            



    context 'close()', ->

        it 'can stop http', 

            ipso (facto, http, server) -> 

                http.does 
                    createServer: -> 
                        return server.does
                            listen: (args...) -> args.pop()()
                            close: -> facto()   

                instance = Api.create api: listen: {}
                instance.listen -> instance.close()

