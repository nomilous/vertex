ipso = require 'ipso'

describe 'Vertex', ->
    
    it 'creates a server and starts listening', ipso (facto, Server, Vertex) -> 

        Server.does create: -> listen: -> facto()
        Vertex http: listen: {}

    it 'assigns a handler to the server', ipso (facto, Server, Handler, Vertex) -> 

        Server.does
            create: (config, handler) -> 
                handler.should.equal Handler._test().handle
                listen: ->

        Vertex http: listen: {}
        facto()
