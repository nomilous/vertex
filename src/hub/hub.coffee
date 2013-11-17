engine = require 'engine.io'

module.exports = (config) ->

    local = 

        server: undefined

        listen: -> 

            local.server = engine.listen config.listen.port



        close: ->
