{v4}   = require 'node-uuid'
Bunyan = require 'bunyan'
Api    = require './api/api'


module.exports = (config) ->

    title = config.title or 'Untitled Vertex'
    uuid = config.uuid or v4()
    log = Bunyan.createLogger name: title


    Api.create( config ).listen (err, api) -> 

        if err?

            log.fatal err  
            throw err?  ##undecided process.exit?
        
    #     local = 
    #         title: title
    #         uuid:  uuid
    #         log:   log
    #         api:   api
