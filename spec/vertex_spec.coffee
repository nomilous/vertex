ipso = require('ipso').modules 
    
    Server: require: './lib/api/server'
    Vertex: require: './lib/vertex'


#
# pending
# -------
# 
# * local module injection
# * synchronous injection also through does.spectate()
# * Subject.does.reset() to remove all stubs
#

describe 'Vertex', -> 
    
    it 'creates a server and starts listening', ipso (facto, Server, Vertex) -> 

        Server.does create: -> listen: -> facto()
        Vertex http: listen: port: 3000

