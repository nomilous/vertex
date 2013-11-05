ipso = require 'ipso'

describe 'Vertex', -> 
    
    it 'creates a server and starts listening', ipso (facto, Server, Vertex) -> 

        Server.does create: -> listen: -> facto()
        Vertex http: listen: port: 3000

