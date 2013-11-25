{ipso, mock, tag} = require 'ipso'

describe 'Recursor', -> 

    before ipso (Recursor) -> 

        mock('options').with

            path: '/path/to/thing'

        tag

            subject: Recursor.create mock('config').with 

                api: root: path: to: thing: {}


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
                config.with  api: root: thing: in: tree: ''

                subject.process( options ).then ({statusCode}) -> 

                    statusCode.should.equal 404
                    facto()


        it 'resolves with statusCode: 200 and body if path is present in tree', 

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing'
                config.with  api: root: thing: is: 'present'

                subject.process( options ).then ({statusCode, body}) -> 

                    statusCode.should.equal 200
                    body.should.eql is: 'present'
                    facto()


        it 'recurses along the path', 

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/in/tree/is'
                config.with  api: root: thing: in: tree: is: 'fruit'

                subject.process( options ).then ({statusCode, body}) -> 

                    body.should.equal 'fruit'
                    statusCode.should.equal 200
                    facto()


        it '"recurses" into $api functions in the tree',

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/in/tree/is'
                config.with api: root: thing: in: (opts, callback) -> callback null, tree: is: 'fruit'
                config.api.root.thing.in.$api = {}

                subject.process( options ).then ({statusCode, body}) -> 

                    body.should.equal 'fruit'
                    statusCode.should.equal 200
                    facto()


        it 'does not "recurse" into non $api fuctions',

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/in/tree/is'
                config.with api: root: thing: in: (opts, callback) -> callback null, tree: is: 'fruit'

                subject.process( options ).then ({statusCode, body}) -> 

                    statusCode.should.equal 404
                    facto()


        it 'passes opts to $api function', 

            ipso (facto, subject, config, options) -> 

                config.with api: root: routes = 

                    things: (opts, callback) -> 

                        opts.headers.should.equal 'headers'
                        opts.method.should.equal  'method'
                        opts.path.should.equal    '/things/1/nested/23'
                        opts.query.should.equal   'query'
                        opts.rest.should.eql      ['1', 'nested', '23']
                        opts.api.should.eql       configure: eg: roles: ['admin']
                        facto()

                    deeper: 

                        stuff: (opts, allback) -> 


                routes.things.$api       = configure: eg: roles: ['admin']
                routes.deeper.stuff.$api = {}

                subject.process options.with

                    headers: 'headers'
                    method:  'method'
                    path:    '/things/1/nested/23'
                    query:   'query'



        it 'recurses no further if function callback with body or statusCode',

            ipso (facto, subject, config, options) -> 

                config.with api: root: routes = 

                    things: (opts, callback) -> 

                        callback null, statusCode: 404

                routes.things.$api = {}

                #
                # spy on recurse()
                #

                lastRecursedPath = undefined
                subject.does _recurse: (opts, path) -> lastRecursedPath = path


                subject.process( options.with

                    path:    '/things/with/more/path/un/walked'

                ).then (result) -> 

                    result.should.eql statusCode: 404, body: ''
                    lastRecursedPath.should.eql [ 'with', 'more', 'path', 'un', 'walked' ]
                    facto()



        it 'calls back with the accompanying $api hash',

            ipso (facto, subject) -> 

                root = module: function: (opts, callback) -> callback null, statusCode: 404
                root.module.function.$api = configKey: 'configValue'

                subject.recurse {}, ['module', 'function'], root, (error, result, api) ->

                    api.should.eql configKey: 'configValue'
                    facto()



        "hmmm, all these it()s don't appear all that necessary to me": 

            ipso (facto, subject) -> 







