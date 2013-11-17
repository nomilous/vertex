Client = require 'engine.io-client'

module.exports = (config) ->

    local = 

        socket: undefined

        connect: ->

            return local.reconnect() if local.socket?

            local.socket ||= new Client.Socket config.connect.uri


        close: ->
