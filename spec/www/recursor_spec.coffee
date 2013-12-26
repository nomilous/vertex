{ipso, mock, tag} = require 'ipso'

describe 'Recursor', -> 

    before ipso (Recursor) -> 

        mock('options').with

            path: '/path/to/thing'

        tag

            subject: Recursor.create mock('config').with 

                www: routes: path: to: thing: {}


    context 'process()', -> 

        it 'returns a promise', ipso (subject, options, should) -> 

            should.exist subject.process( options ).then


        it 'calls recurse with opts and path array', ipso (facto, subject, options) ->

            subject.does recurse: (opts, path) -> 

                opts.is options
                path.should.eql ['path', 'to', 'thing']


            subject.process options.with path: '/path/to/thing'
            subject.process options.with path: 'path/to/thing/'
            subject.process options.with path: '/path/to/thing/'
            facto()


        it 'rejects on error in recursor', 

            ipso (facto, subject, config, options) -> 

                subject.does recurse: (args...) -> args.pop()( new Error 'e' )

                subject.process( options ).then (->), (error) -> 

                    error.message.should.equal 'e'
                    facto()


        it 'resolves with statusCode: 404 if path not present', 

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/not/present'
                config.with  www: routes: thing: in: tree: ''

                subject.process( options ).then ({statusCode}) -> 

                    statusCode.should.equal 404
                    facto()


        it 'resolves with statusCode: 200 and body if path is present in tree', 

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing'
                config.with  www: routes: thing: is: 'present'

                subject.process( options ).then ({statusCode, body}) -> 

                    statusCode.should.equal 200
                    body.should.eql is: 'present'
                    facto()


        it 'recurses along the path', 

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/in/tree/is'
                config.with  www: routes: thing: in: tree: is: 'fruit'

                subject.process( options ).then ({statusCode, body}) -> 

                    body.should.equal 'fruit'
                    statusCode.should.equal 200
                    facto()


        it '"recurses" into $www functions in the tree',

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/in/tree/is'
                config.with www: routes: thing: in: (opts, callback) -> callback null, tree: is: 'fruit'
                config.www.routes.thing.in.$www = {}

                subject.process( options ).then ({statusCode, body}) -> 

                    body.should.equal 'fruit'
                    statusCode.should.equal 200
                    facto()

        it 'does skips $www function if next node on path is nested property of function',

            ipso (facto, subject, config, options) -> 

                

                outer = (opts, callback) -> 
                outer.inner = (opts, callback) -> callback null, 'INNER'

                outer.$www = {}
                outer.inner.$www = {}

                options.with path: '/outer/inner'
                config.with www: routes: outer: outer

                subject.process( options ).then ({statusCode, body}) -> 

                    body.should.equal 'INNER'
                    facto()


        it 'does not "recurse" into non $www fuctions',

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/in/tree/is'
                config.with www: routes: thing: in: (opts, callback) -> callback null, tree: is: 'fruit'
                # config.www.routes.thing.in.$www = {}

                subject.process( options ).then ({statusCode, body}) -> 

                    statusCode.should.equal 404
                    facto()


        it 'passes opts to $www function', 

            ipso (facto, subject, config, options) -> 

                config.with www: routes: routes = 

                    things: (opts, callback) -> 

                        opts.headers.should.equal 'headers'
                        opts.method.should.equal  'method'
                        opts.path.should.equal    '/things/1/nested/23'
                        opts.query.should.equal   'query'
                        opts.rest.should.eql      ['1', 'nested', '23']
                        opts.www.should.eql       configure: eg: roles: ['admin']
                        facto()

                    deeper: 

                        stuff: (opts, allback) -> 


                routes.things.$www       = configure: eg: roles: ['admin']
                routes.deeper.stuff.$www = {}

                subject.process options.with

                    headers: 'headers'
                    method:  'method'
                    path:    '/things/1/nested/23'
                    query:   'query'



        it 'recurses no further if function callback with body or statusCode',

            ipso (facto, subject, config, options) -> 

                config.with www: routes: routes = 

                    things: (opts, callback) -> 

                        callback null, statusCode: 404

                routes.things.$www = configKey: 'configValue'

                #
                # spy on recurse()
                #

                lastRecursedPath = undefined
                subject.does _recurse: (opts, path) -> lastRecursedPath = path


                subject.process( options.with

                    path:    '/things/with/more/path/un/walked'

                ).then (result) -> 

                    # console.log result

                    result.should.eql 
                        statusCode: 404
                        headers: undefined   # <-------------------------------------------------------------------------- eeek
                        body: ''
                        www: configKey: 'configValue'

                    lastRecursedPath.should.eql [ 'with', 'more', 'path', 'un', 'walked' ]
                    facto()



        it 'calls back with the accompanying $www hash',

            ipso (facto, subject) -> 

                root = module: function: (opts, callback) -> callback null, statusCode: 404
                root.module.function.$www = configKey: 'configValue'

                subject.recurse {}, ['module', 'function'], root, (error, result) ->

                    result.www.should.eql configKey: 'configValue'
                    facto()



        "hmmm, all these it()s don't appear all that necessary to me": 

            ipso (facto, subject) -> 







