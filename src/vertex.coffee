{v4}       = require 'node-uuid'
{parallel} = require 'also'
Api        = require './api/api'
Logger     = require './logger/logger'


module.exports = (config) ->

    title = config.title or 'Untitled Vertex'
    uuid = config.uuid or v4()
    log = Logger.create config


    parallel([


        -> if config.api? then Api.create( config, log ).listen()



    ]).then(

        ([api]) -> 

            if api? then log.info
            
                listen: api.server.address()
                'api listening'



            #     local = 
            #         title: title
            #         uuid:  uuid
            #         log:   log
            #         api:   api

        (error) -> 

            log.fatal error
            process.exit 1

    )

