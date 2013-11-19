{ipso, mock} = require 'ipso'

describe 'Vertex', ->

    before ipso (Logger) -> 

        logger = mock 'logger'
        
        Logger.does create: -> logger

        mock('config').with 

            title: 'Vertex Title'
            api: listen: {}


    it 'creates an Api server with config and logger and starts listening', 

        ipso (facto, Api, Vertex, config, logger) -> 

            Api.does 
                create: (conf, log) -> 
                    config.is conf
                    logger.is log
                    listen: -> facto()

            Vertex config


