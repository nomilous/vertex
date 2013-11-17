Client = require 'engine.io-client'

module.exports = (config) ->

    local = 

        socket: undefined

        connect: ->

            local.socket ||= new Client.Socket config.connect.uri


        close: ->
