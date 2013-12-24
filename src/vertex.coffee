# {v4} = require 'node-uuid'
Http = require './www/http'
Hub  = require './hub/hub'
{Q, deferred} = require 'decor'


module.exports.create = (config) ->

    title = config.title or 'Untitled Vertex'
    uuid = config.uuid or 'pending default uuid' # v4()

    Q.all([

        Http.create( config ).listen()
        Hub.create( config ).listen()

    ]).spread(

        (www, hub) -> 

            if www? then console.log 'www listening', www.server.address()
            if hub? then console.log 'hub listening', hub.transport.address()

        (error) -> 

            console.log error.stack
            process.exit 1

    )

