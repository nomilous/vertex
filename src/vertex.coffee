{v4}       = require 'node-uuid'
{parallel} = require 'also'
Http       = require './www/http'
Hub        = require './hub/hub'
Logger     = require './logger/logger'


module.exports = (config) ->

    title = config.title or 'Untitled Vertex'
    uuid = config.uuid or v4()
    log = Logger.create config


    parallel([


        -> if config.www?    then Http.create( config, log ).listen()
        -> if config.listen? then Hub.create( config, log ).listen()


    ]).then(

        ([www, hub]) -> 

            if www? then log.info
            
                listen: www.server.address()
                'www listening'


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
