should   = require 'should'
ipso     = require 'ipso'
Server   = require '../../lib/api/server'

describe 'server', -> 


    it 'uses config.api', (done) -> 

        config = {}
        Object.defineProperty config, 'api', get: -> done()
        Server( config ).listen()


    it 'can starts http listening at config.api.listen.port and hostname', ipso (facto, http) -> 

        http.does 
            createServer: ->
                listen: (port, hostname) -> 
                    port.should.equal 2999
                    hostname.should.equal 'test.local'
                    facto()

        Server 
            api: 
                listen: 
                    hostname: process.env.API_HOSTNAME
                    port: process.env.API_PORT
                    
        .listen()


    it 'can stop http', ipso (facto, http) ->

        http.does 
            createServer: ->
                listen: (args...) -> args.pop()() # callback is last arg
                close: -> facto()


        instance = Server api: listen: {}
        instance.listen -> instance.close()
        
