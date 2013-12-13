{ipso, mock} = require 'ipso'

describe 'Vertex', ->

    before ipso (Logger) -> 

        mock('config').with 

            title: 'Vertex Title'
            listen: port: 2998
            www: listen: port: 2999
            


    it 'creates an Api server with config and starts listening', 

        ipso (facto, Http, Vertex, config) -> 

            Http.does 
                create: (conf) -> 
                    config.is conf
                    listen: -> facto()

            Vertex config


    it 'creates an Hub server with config and starts listening', 

        ipso (facto, Hub, Vertex, config) -> 

            Hub.does 
                create: (conf) -> 
                    config.is conf
                    listen: -> facto()

            Vertex config


