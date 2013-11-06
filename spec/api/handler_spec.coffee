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


    context 'handle()', -> 


     it 'responds with the root tree if config.allowRoot is true', ipso (done, Handler) -> 

        {handle} = Handler.create
            allowRoot: true
            root: tree: of: 'things'

        handle req = {}, res = 
            writeHead: ->
            end: ->  
            write: (body) -> 

                body.should.equal '{"tree":{"of":"things"}}'
                done()


    it 'reponds 404 if config.alloRoot is unspecified', ipso (done, Handler) -> 

        {handle} = Handler.create

            root: tree: of: 'things'

        handle req = {}, res = 
            writeHead: (statusCode) -> 
                statusCode.should.equal 404
                done()
            end: ->  
