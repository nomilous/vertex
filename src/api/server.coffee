http = require 'http'

module.exports = (config = {}) ->

    local = 

        server: undefined

        listen: (callback) ->

            return unless try opts = config.api.listen

            port      = parseInt opts.port
            hostname  = opts.hostname

            local.server = http.createServer()
            local.server.listen port, hostname, ->
                callback null, local.server


        close: ->

            try local.server.close()

