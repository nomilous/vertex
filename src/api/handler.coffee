{parse} = require 'querystring'
{pipeline, deferred} = require 'also'

lastInstance          = undefined
module.exports._test  = -> lastInstance
module.exports.create = (config) ->

    lastInstance = local = 

        root: config.root || {}



        prepare: deferred (action, opts) -> 

            #
            # auth / cookie / session
            #

            action.resolve()



        process: deferred (action, opts) -> 

            #
            # processor / recursor
            #

            body = JSON.stringify config.root
            action.resolve
                statusCode: 200
                headers: 
                    'Content-Type': 'application/json'
                    'Content-Length': body.length
                body: body



        responder: (opts, res) ->

            local.prepare( opts )
            .then local.process( opts )
            .then(

                (result) -> 

                    res.writeHead result.statusCode, result.headers
                    res.write result.body
                    res.end()

                    #
                    # after success
                    #

                (error) -> 

                    res.writeHead error.statusCode or 500, error.headers or {}
                    res.end error.body or error.toString()

                    #
                    # after error
                    #

                (notify) -> 

                    #
                    # multipart later
                    #

            )


        handle: (req, res) ->

            path  = req.url
            try [m, path, query] = req.url.match /^(.*?)\?(.*)/

            if path is '/' and not config.allowRoot
                res.writeHead 404
                return res.end() 

            local.responder 
                headers: req.headers
                path: path
                query: if query? then parse query else {}
                res


    return api = 

        handle: local.handle
