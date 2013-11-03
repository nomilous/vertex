should   = require 'should'
ipso     = require 'ipso'
{server} = require '../../lib/api/server'

describe 'server', -> 

    it 'uses config.api', (done) -> 

        config = {}
        Object.defineProperty config, 'api', get: -> done()
        server config

    it 'starts http listening at config.api.port', ipso (facto, http) -> 

        http.does 
            createServer: ->
                listen: (port) -> 
                    port.should.equal 2999
                    facto()
            singLullaby: -> 

        http.singLullaby()
        #server api: port: process.env.API_PORT
        facto() # should fail on account of no call to createServer
        

    it 'temporary test to verify cleanup', (done) -> #ipso (facto, http, should) -> 


        try [stub] = require('http').createServer.toString().match /STUB/
        should.not.exist stub
        done()

