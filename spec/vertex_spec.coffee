ipso = require 'ipso'

#
# pending
# -------
# 
# * local module injection
# * synchronous injection also through does.spectate()
# * Subject.does.reset() to remove all stubs
#

describe 'Vertex', ipso (Vertex) -> 
    
    it 'creates a server and starts listening', ipso (facto, Server) -> 

        Server.does create: -> listen: -> facto()
        Vertex http: listen: port: 3000

