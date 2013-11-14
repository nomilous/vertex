{ipso, mock, tag} = require 'ipso'

describe 'Recursor', -> 

    before ipso (done, Recursor) -> 

        mock('options').with

            path: '/path/to/thing'

        tag

            subject: Recursor.create mock('config').with 

                root: 
                    path:
                        to:
                            thing: {}

        .then done


    context 'process()', -> 

        it 'returns a promise', ipso (subject, options, should) -> 

            should.exist subject.process( options ).then


        it 'calls recurse with opts and path array', ipso (subject, options) ->

            subject.does recurse: (opts, path) -> 

                opts.is options
                path.should.eql ['path', 'to', 'thing']

            subject.process options.with path: '/path/to/thing'
            subject.process options.with path: 'path/to/thing/'
            subject.process options.with path: '/path/to/thing/'


        it 'rejects on error in recursor', 

            ipso (facto, subject, config, options) -> 

                subject.does recurse: (args...) -> args.pop()( new Error 'e' )

                subject.process( options ).then (->), (error) -> 

                    error.message.should.equal 'e'
                    facto()


        it 'resolves with statusCode: 404 if path not present', 

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/not/present'
                config.with  root: thing: in: tree: ''

                subject.process( options ).then ({statusCode}) -> 

                    statusCode.should.equal 404
                    facto()


        it 'resolves with statusCode: 200 and body if path is present in tree', 

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing'
                config.with  root: thing: is: 'present'

                subject.process( options ).then ({statusCode, body}) -> 

                    statusCode.should.equal 200
                    body.should.eql is: 'present'
                    facto()


        it 'recurses along the path', 

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/in/tree/is'
                config.with  root: thing: in: tree: is: 'fruit'

                subject.process( options ).then ({statusCode, body}) -> 

                    body.should.equal 'fruit'
                    statusCode.should.equal 200
                    facto()


        it '"recurses" into $api functions in the tree',

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/in/tree/is'
                config.with root: thing: in: (opts, callback) -> callback null, tree: is: 'fruit'
                config.root.thing.in.$api = {}

                subject.process( options ).then ({statusCode, body}) -> 

                    body.should.equal 'fruit'
                    statusCode.should.equal 200
                    facto()


        it 'does not "recurse" into non $api fuctions',

            ipso (facto, subject, config, options) -> 

                options.with path: '/thing/in/tree/is'
                config.with root: thing: in: (opts, callback) -> callback null, tree: is: 'fruit'

                subject.process( options ).then ({statusCode, body}) -> 

                    statusCode.should.equal 404
                    facto()


        it 'passes opts to $api function', 

            ipso (facto, subject, config, options) -> 

                options.with 
                    headers: 'headers'
                    method:  'method'
                    path:    '/things/1/nested/23'
                    query:   'query'

                config.with root: 

                    things: (opts, callback) -> 

                        opts.headers.should.equal 'headers'
                        opts.method.should.equal  'method'
                        opts.path.should.equal    '/things/1/nested/23'
                        opts.query.should.equal   'query'
                        opts.rest.should.eql      ['1', 'nested', '23']
                        facto()


                config.root.things.$api = {}

                subject.process( options ).then -> 








