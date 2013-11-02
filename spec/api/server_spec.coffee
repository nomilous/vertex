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


        server api: port: process.env.API_PORT


    xit 'temporary test to check failure to call "active stub"', ipso (facto, should) -> 

        should.does exist: -> facto()

