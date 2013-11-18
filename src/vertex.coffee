Server  = require './api/server'
Handler = require './api/handler'

module.exports = (config) ->


    Server.create( config ).listen (err, api) -> 

        throw err if err?
        
        console.log todo: log: api.server.address()


