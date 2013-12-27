# {v4} = require 'node-uuid'
Http = require './www/http'
Hub  = require './hub/hub'
{Q, deferred} = require 'decor'


module.exports.create = deferred (action, config) ->

    title = config.title or 'Untitled Vertex'
    uuid = config.uuid or 'pending default uuid' # v4()

    Q.all([

        do -> 

            return unless try config.www.listen?
            Http.create( config ).listen()

        do -> 

            return unless config.listen?
            Hub.create( config ).listen()

    ]).spread(

        (www, hub) -> 

            if www? then console.log 'www listening', www.server.address()
            if hub? then console.log 'hub listening', hub.transport.address()
            
            action.resolve www: www, hub: hub

        (error) -> 

            # console.log error.stack
            # process.exit 1

            action.reject error

    )


module.exports.create.www = (config = {}) -> 

    config.listen ||= {}
    config.listen.port ||= 3000
    module.exports.create www: config 
