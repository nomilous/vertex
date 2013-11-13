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


        it 'rejects on error in recursor', ipso (facto, subject, config, options) -> 

            subject.does recurse: (args...) -> args.pop()( new Error 'e' )

            subject.process( options ).then (->), (error) -> 

                error.message.should.equal 'e'
                facto()


        it 'resolves with statusCode: 404 if path not present', ipso (subject, config, options) -> 

            options.with path: '/thing/not/present'
            config.with  root: thing: in: tree: ''

            subject.process( options ).then ({statusCode}) -> 

                statusCode.should.equal 404


        it 'resolves with statusCode: 200 and body if path is present in tree', 

            ipso (subject, config, options) -> 

                options.with path: '/thing'
                config.with  root: thing: is: 'present'

                subject.process( options ).then ({statusCode, body}) -> 

                    statusCode.should.equal 200
                    body.should.eql is: 'present'


        it 'recurses along the path', 

            ipso (subject, config, options) -> 

                options.with path: '/thing/in/tree/is'
                config.with  root: thing: in: tree: is: ''

                subject.process( options ).then ({statusCode, body}) -> 

                    body.should.equal ''
                    statusCode.should.equal 200
                    

