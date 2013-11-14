{parse} = require 'querystring'
{pipeline, deferred} = require 'also'
Recursor = require './recursor'

lastInstance          = undefined
module.exports._test  = -> lastInstance
module.exports.create = (config) ->

    lastInstance = local = 

        root: config.root || {}

        recursor: Recursor.create config

        prepare: deferred (action, opts) -> 

            #
            # auth / cookie / session
            #

            action.resolve()


        process: (opts) -> local.recursor.process opts


        responder: (opts, res) ->

            local.prepare( opts )
            .then local.process( opts )
            .then(

                (result) -> 

                    try body = JSON.stringify result.body # option
                    result.headers ||= {}

                    if body? 
                        result.headers['Content-Type'] = 'application/json'
                        result.headers['Content-Length'] = body.length

                    res.writeHead result.statusCode || 200, result.headers
                    res.write body if body?
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

            #
            # todo: inbound encoding?, optional carry stream emitter into api functions
            #

            body = ''
            req.on 'data', (chunk) -> body += chunk.toString()


            req.on 'end', -> 

                #
                # todo: content-type handler config sub FNs .encode, .decode
                # todo: response error format
                #

                if req.headers['content-type'] is 'application/json'

                    try body = JSON.parse body
                    catch error

                        res.writeHead 500
                        res.write "JSON #{error.toString()}"
                        return res.end()


                local.responder
                    headers: req.headers
                    method: req.method
                    path: path
                    query: if query? then parse query else {}
                    body: body
                    res


    return api = 

        handle: local.handle
