{ipso, mock} = require 'ipso'

describe 'Http', ipso (Http, should) -> 

    @timeout 100

    before -> 

        mock('config').with

            www: listen: port: 2999, hostname: 'test.local'

        mock('server').with

            listen:->
            close: ->
            on: ->

        mock('handler').with

            handle:->


    context 'create()', ->

        it 'creates an www server instance with handler and status', 

            ipso (config, Handler) -> 

                instance = Http.create config
                instance.handler.should.equal Handler._test().handle
                instance.status.value.should.equal 'pending'
                instance.status.at.should.be.an.instanceof Date


        it 'passes the config to the handler factory', 

            ipso (config, Handler, handler) -> 

                Handler.does create: (conf) -> 

                    config.is conf
                    return handler

                instance = Http.create config



    context 'listen()', -> 

        it 'starts http listening at config.www.listen.port and hostname', 

            ipso (facto, http, server, config) -> 

                http.does 
                    createServer: -> 
                        return server.does 
                            listen: (port, hostname) -> 
                                port.should.equal 2999
                                hostname.should.equal 'test.local'
                                facto()

                Http.create( config ).listen ->
        

        it 'sets status to listening and callsback with local www instance',

            ipso (facto, http, server, config) ->

                http.does 
                    createServer: -> 
                        return server.does
                            listen: (args...) -> args.pop()() # callback is last arg
                        

                instance = Http.create config
                instance.listen (err, www) -> 

                    www.should.equal instance
                    www.status.value.should.equal 'listening'
                    www.status.at.should.be.an.instanceof Date
                    facto()



        it 'callsback error if error before listening',

            ipso (facto, http, server, config) -> 

                http.does 
                    createServer: -> 
                        return server.does
                            on: (pub, sub) -> 
                                if pub is 'error' then sub new Error 'listen EADDRINUSE'

                instance = Http.create config
                instance.listen (err, www) -> 

                    err.message.should.equal 'listen EADDRINUSE'
                    facto()


                # 
                # chop the promise chain, to prevent ipso from failing on 
                # the carried rejection 
                # 

                .then


        it 'returns a promise', 

            ipso (http, server, config) -> 

                http.does createServer: -> server
                instance = Http.create config
                instance.listen().then.should.be.an.instanceof Function


        it 'resolves the promise on listen callback with the www instance',

            ipso (facto, http, server, config) -> 

                http.does createServer: -> server.does listen: (args...) -> args.pop()()
                instance = Http.create config
                instance.listen().then (www) -> 

                    www.should.equal Http._test()
                    facto()


        it 'rejects the promise on server errors that preceed the first listen callback', 

            ipso (facto, http, server, config) -> 

                http.does createServer: -> server.does on: (pub, sub) -> 
                    
                    if pub is 'error' then sub new Error 'listen EADDRINUSE'

                instance = Http.create config
                instance.listen().then (->), (error) -> 

                    error.message.should.equal 'listen EADDRINUSE'
                    facto()



    context 'close()', ->

        it 'can stop http', 

            ipso (facto, http, server, config) -> 

                http.does 
                    createServer: -> 
                        return server.does
                            listen: (args...) -> args.pop()()
                            close: -> facto()   

                instance = Http.create config
                instance.listen -> instance.close()

