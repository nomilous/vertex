{ipso, mock} = require 'ipso'

describe 'Vertex', ->

    before ipso -> 

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

            Vertex.create config


    it 'provides create.www() as convenience for only starting the Api server', 

        ipso (facto, Http, Vertex, config) -> 

            Http.does 
                create: (conf) -> 
                    mock('httpServer').does
                        listen: (port) -> 
                            facto()

            Vertex.create.www listen: port: 2999


    it 'creates an Hub server with config and starts listening', 

        ipso (facto, Hub, Vertex, config) -> 

            Hub.does 
                create: (conf) -> 
                    config.is conf
                    listen: -> facto()

            Vertex.create config


    it 'does not start the Api server if no config.www.listen'
    it 'does not start the Hub server if no config.listen'



