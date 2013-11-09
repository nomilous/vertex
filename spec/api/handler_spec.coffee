ipso = require 'ipso'

describe 'Handler.create()', -> 


    xit 'uses config.root for route configuration', ipso (done, Handler) -> 

        config = {}
        Object.defineProperty config, 'root', get: -> done()
        Handler.create config


    xit 'defines a handle function', ipso (done, Handler) -> 

        handler = Handler.create {}
        handler.handle.should.be.an.instanceof Function
        done()


    xcontext 'handle()', -> 


        it 'responds 404 to / if config.alloRoot is unspecified', ipso (done, Handler) -> 

            {handle} = Handler.create
                root: tree: of: 'things'

            handle req = url: '/', res = 
                writeHead: (statusCode) -> 
                    statusCode.should.equal 404
                    done()
                end: ->  


        it 'responds to / with the root tree if config.allowRoot is true', ipso (done, Handler) -> 

            {handle} = Handler.create
                allowRoot: true
                root: tree: of: 'things'

            handle req = url: '/', res = 
                writeHead: ->
                end: ->  
                write: (body) -> 

                    body.should.equal '{"tree":{"of":"things"}}'
                    done()

        it 'calls the responder() with opts.path,query,headers and response object', ipso (done, Handler) -> 

            {handle} = Handler.create
                allowRoot: true
                root: tree: of: 'things'

            Handler._test().responder = (opts, res) -> 
                res.should.equal 'response object'
                opts.should.eql 
                    headers: 'headers'
                    path: '/path'
                    query: 
                        key1: 'value1'
                        key2: '2'
                done()


            handle req = url: '/path?key1=value1&key2=2', headers: 'headers', 'response object'


    context 'responder()', -> 

        before ipso (done, Handler) -> 

            Handler.create 
                allowRoot: true
                root: modules: {}

            ipso.tag( handler1: Handler._test() ).then done


        it 'calls prep() and process() in sequence with opts', ipso (facto, handler1) -> 

            handler1.does 

                _prep:    (opts) -> opts.prepped = true
                _process: (opts) -> 

                    opts.prepped.should.equal true
                    opts.is.should.equal 'opts'


            handler1.responder is: 'opts'
            facto()


