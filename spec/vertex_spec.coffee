{ipso, mock} = require 'ipso'

describe 'Vertex', ->

    before ipso (Logger) -> 

        logger = mock('logger').with 

            info: -> 
        
        Logger.does create: -> logger


        mock('config').with 

            title: 'Vertex Title'
            listen: port: 2998
            www: listen: port: 2999
            


    it 'creates an Api server with config and logger and starts listening', 

        ipso (facto, Http, Vertex, config, logger) -> 

            Http.does 
                create: (conf, log) -> 
                    config.is conf
                    logger.is log
                    listen: -> facto()

            Vertex config


    it 'creates an Hub server with config and logger and starts listening', 

        ipso (facto, Hub, Vertex, config, logger) -> 

            Hub.does 
                create: (conf, log) -> 
                    config.is conf
                    logger.is log
                    listen: -> facto()

            Vertex config


