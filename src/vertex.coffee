{v4}       = require 'node-uuid'
{parallel} = require 'also'
Api        = require './api/api'
Hub        = require './hub/hub'
Logger     = require './logger/logger'


module.exports = (config) ->

    title = config.title or 'Untitled Vertex'
    uuid = config.uuid or v4()
    log = Logger.create config


    parallel([


        -> if config.api? then Api.create( config, log ).listen()
        -> if config.listen? then Hub.create( config, log ).listen()


    ]).then(

        ([api, hub]) -> 

            if api? then log.info
            
                listen: api.server.address()
                'api listening'


            if hub? then log.info

                listen: hub.transport.address()
                'hub listening'


            #     local = 
            #         title: title
            #         uuid:  uuid
            #         log:   log
            #         api:   api

        (error) -> 

            log.fatal error
            process.exit 1

    )


module.exports.Client = require './client/client'
