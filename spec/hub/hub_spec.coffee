{ipso, tag, mock} = require 'ipso'

describe 'Hub', ipso (should) ->

    before ipso (done, Hub) -> 

        mock('server').with on: ->

        tag

            subject: Hub mock 'config'
            Engine: require 'engine.io'

        .then done


    it 'defines listen() and close()', 

        ipso (subject) -> 

            subject.listen.should.be.an.instanceof Function
            subject.close.should.be.an.instanceof Function



    context 'listen()', -> 

        it 'starts engine.io listening', 

            ipso (subject, config, server, Engine) -> 

                Engine.does listen: (port) -> 

                    port.should.equal 3001
                    return server

                config.with listen: port: 3001
                subject.listen()
                subject.server.is server

