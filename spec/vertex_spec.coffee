ipso = require 'ipso'

describe 'Vertex', ->
    
    it 'creates an Api server and starts listening', ipso (facto, Api, Vertex) -> 

        Api.does create: -> listen: -> facto()
        Vertex api: listen: {}

