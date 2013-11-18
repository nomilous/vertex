Api  = require './api/api'
Handler = require './api/handler'

module.exports = (config) ->


    Api.create( config ).listen (err, api) -> 

        throw err if err?
        
        console.log todo: log: api.server.address()


