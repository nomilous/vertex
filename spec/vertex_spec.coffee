{ipso, mock} = require 'ipso'

describe 'Vertex', ->

    before -> 

        mock('config').with 

            title: 'Vertex Title'
            api: listen: {}


    
    it 'creates an Api server and starts listening', 

        ipso (facto, Api, Vertex, config) -> 

            Api.does create: -> listen: -> facto()
            Vertex config


    it 'starts bunyan logger with name as vertex title', 

        ipso (Vertex, Api, config, bunyan) -> 

            bunyan.does createLogger: ({name}) -> 

                name.should.equal  'Vertex Title'

            Api.does create: -> listen: ->
            Vertex config

