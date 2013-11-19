{v4}   = require 'node-uuid'
Api    = require './api/api'
Logger = require './logger/logger'


module.exports = (config) ->

    title = config.title or 'Untitled Vertex'
    uuid = config.uuid or v4()
    log = Logger.create config


    Api.create( config ).listen (err, api) -> 

        if err?

            log.fatal err
            process.exit 1
        
    #     local = 
    #         title: title
    #         uuid:  uuid
    #         log:   log
    #         api:   api
