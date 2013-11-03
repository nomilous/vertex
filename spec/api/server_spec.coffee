should   = require 'should'
ipso     = require 'ipso'
Server   = require '../../lib/api/server'

describe 'server', -> 


    it 'uses config.http', (done) -> 

        config = {}
        Object.defineProperty config, 'http', get: -> done()
        Server( config ).listen()



    it 'can starts http listening at config.http.listen.port and hostname', ipso (facto, http) -> 

        http.does 
            createServer: ->
                listen: (port, hostname) -> 
                    port.should.equal 2999
                    hostname.should.equal 'test.local'
                    facto()

        Server 
            http: 
                listen: 
                    hostname: process.env.API_HOSTNAME
                    port: process.env.API_PORT
                    
        .listen()


    it 'calls back with the listening address', ipso (facto, http) ->

        http.does 
            createServer: ->
                listen: (args...) -> args.pop()() # callback is last arg
                address: -> 'mock address'

        instance = Server http: listen: {}
        instance.listen (err, addr) -> 
            addr.should.equal 'mock address'
            facto()


    it 'can stop http', ipso (facto, http) ->

        http.does 
            createServer: ->
                listen: (args...) -> args.pop()()
                address: -> 
                close: -> facto()


        instance = Server http: listen: {}
        instance.listen -> instance.close()

