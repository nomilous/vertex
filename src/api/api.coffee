http    = require 'http'
Handler = require './handler'

module.exports.create = (config) ->

    local = 

        server: undefined

        handler: Handler.create( config ).handle

        listen: (callback) ->

            return unless try listenArgs = config.http.listen

            port      = parseInt listenArgs.port
            hostname  = listenArgs.hostname

            local.server = http.createServer (req, res) -> 

                local.handler req, res

            local.server.listen port, hostname, ->

                callback null, local


        close: (callback) ->

            #
            # TODO: percolate closeability to the top
            #

            try local.server.close callback

