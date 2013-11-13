{ipso, mock, tag} = require 'ipso'

describe 'Handler.create()', ipso (Handler) -> 

    @timeout 10

    it 'uses config.root for route configuration', ipso (done) -> 

        config = {}
        Object.defineProperty config, 'root', get: -> done()
        Handler.create config


    it 'defines a handle function', ipso (done) -> 

        handler = Handler.create {}
        handler.handle.should.be.an.instanceof Function
        done()

    it 'creates a Recursor with the config tree', ipso (Recursor) -> 

        Recursor.does create: (config) -> config.is mockConfig
        Handler.create mockConfig = mock 'config'



    context 'handle()', -> 

        it 'responds 404 to / if config.alloRoot is unspecified', ipso (done) -> 

            {handle} = Handler.create
                root: tree: of: 'things'

            handle req = url: '/', res = 
                writeHead: (statusCode) -> 
                    statusCode.should.equal 404
                    done()
                end: ->  


    context 'responder()', ipso (also) -> 

        before ipso (done) -> 

            Handler.create 
                allowRoot: true
                root: modules: {}

            tag( handler1: Handler._test() )

            .then done


        it 'calls prepare() and process() in sequence with opts', ipso (facto, handler1) -> 

            handler1.does 

                _prepare: (opts) -> opts.prepped = true
                process: (opts) -> 

                    opts.prepped.should.equal true
                    opts.is insertedOpts
                    facto()

            handler1.responder insertedOpts = mock 'opts'


        it 'responds with the processed results as json', ipso (facto, handler1, also) -> 

            handler1.does 
                process: also.deferred ({resolve}, opts) -> 
                    resolve 
                        body: 
                            test: 'value'


            handler1.responder {}, mock('response').does

                writeHead: (statusCode, headers) -> 

                    statusCode.should.equal 200
                    headers.should.eql
                        'Content-Type': 'application/json'
                        'Content-Length': 16

                    facto bug: """

                        after promise, failing should inside expectation times out
                        or reports following expected functions as not called

                    """

                write: (body) -> body.should.equal '{"test":"value"}'
                end: -> facto()


