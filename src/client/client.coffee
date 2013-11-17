Client = require 'engine.io-client'

module.exports = (config) ->

    local = 

        client: undefined

        connect: ->

            local.client = new Client.Socket config.connect.uri


        close: ->
