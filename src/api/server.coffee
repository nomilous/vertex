http = require 'http'

module.exports.create = (config, handler) ->

    local = 

        server: undefined

        listen: (callback) ->

            return unless try listenArgs = config.http.listen

            port      = parseInt listenArgs.port
            hostname  = listenArgs.hostname

            local.server = http.createServer handler

            local.server.listen port, hostname, ->

                callback null, local.server.address()


        close: ->

            try local.server.close()

