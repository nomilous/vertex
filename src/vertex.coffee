Server  = require './api/server'
Handler = require './api/handler'

module.exports = (config) ->


    Server.create( config, 

        Handler.create( config ).handle

    ).listen (err, addr) -> 

        throw err if err?
        console.log TODO: addr
