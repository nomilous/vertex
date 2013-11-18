{ipso, mock} = require 'ipso'

describe 'Api.create()', ipso (Api, should) -> 

    @timeout 10

    it 'uses config.http for listen configuration', (done) -> 

        config = {}
        Object.defineProperty config, 'http', get: -> done()
        Api.create( config ).listen()



    it 'starts http listening at config.http.listen.port and hostname', 

        ipso (facto, http) -> 

            http.does 
                createServer: ->
                    listen: (port, hostname) -> 
                        port.should.equal 2999
                        hostname.should.equal 'test.local'
                        facto()

            Api.create 
                http: 
                    listen: 
                        hostname: process.env.API_HOSTNAME
                        port: process.env.API_PORT
                        
            .listen()
        


    it 'calls back with the listening server instance', 

        ipso (facto, http) ->

            http.does 
                createServer: ->
                    listen: (args...) -> args.pop()() # callback is last arg
                    

            instance = Api.create http: listen: {}
            instance.listen (err, api) -> 

                api.should.equal instance
                facto()


    it 'can stop http', 

        ipso (facto, http) -> 

            http.does 
                createServer: -> 
                    return mock('server').does
                        listen: (args...) -> args.pop()()
                        close: -> facto()   

            instance = Api.create http: listen: {}
            instance.listen -> instance.close()
