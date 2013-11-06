should   = require 'should'
ipso     = require 'ipso'
{create} = require '../../lib/api/server'

describe 'Server.create()', -> 

    it 'uses config.http for listen configuration', (done) -> 

        config = {}
        Object.defineProperty config, 'http', get: -> done()
        create( config ).listen()



    it 'starts http listening at config.http.listen.port and hostname', ipso (facto, http) -> 

        http.does 
            createServer: ->
                listen: (port, hostname) -> 
                    port.should.equal 2999
                    hostname.should.equal 'test.local'
                    facto()

        create 
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

        instance = create http: listen: {}
        instance.listen (err, addr) -> 
            addr.should.equal 'mock address'
            facto()


    it 'can stop http', ipso (facto, http) ->

        http.does 
            createServer: ->
                listen: (args...) -> args.pop()()
                address: -> 
                close: -> facto()


        instance = create http: listen: {}
        instance.listen -> instance.close()

