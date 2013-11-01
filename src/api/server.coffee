http = require 'http'

module.exports.server = (config = {}) ->

    return unless opts = config.api?
    port = parseInt config.api.port

    server = http.createServer()

    server.listen port