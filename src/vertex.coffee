{v4}       = require 'node-uuid'
{parallel} = require 'also'
Http       = require './www/http'
Hub        = require './hub/hub'


module.exports.create = (config) ->

    title = config.title or 'Untitled Vertex'
    uuid = config.uuid or v4()

    parallel([

        -> if config.www?    then Http.create( config ).listen()
        -> if config.listen? then Hub.create( config ).listen()

    ]).then(

        ([www, hub]) -> 

            # if www? then log.info
            #     listen: www.server.address()
            #     'www listening'

            # if hub? then log.info
            #     listen: hub.transport.address()
            #     'hub listening'

        (error) -> 

            console.log error.stack
            process.exit 1

    )

