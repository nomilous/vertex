{parse} = require 'querystring'
{deferred} = require 'decor'
{readFile} = require 'fs'
Recursor = require './recursor'
Cache    = require './cache'

lastInstance          = undefined
module.exports._test  = -> lastInstance
module.exports.create = (config) ->

    config ||= {}
    config.www ||= {}

    lastInstance = local = 

        root: config.routes || {}

        recursor: Recursor.create config
        cache: Cache.create config

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

                    #
                    # TODO: incoherent here, 
                    #       pending content encoder defaulting properly
                    #       pending cache store activated from result.www[cache]{config}
                    #       too much work assembling result.headers in www function callback
                    #

                    result.headers ||= {}
                    body = result.body
                    unless result.headers['Content-Type']?
                        body = JSON.stringify body # option
                        #
                        # TODO: error 
                        #

                    if body? 
                        result.headers['Content-Type'] ||= 'application/json'
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

            if path is '/' and not config.www.allowRoot
                res.writeHead 404
                return res.end()

            #
            # quick hac to get engine.io.js to client
            # =======================================
            # 
            # todo: not cool, make plan
            # todo: component?: https://github.com/component/component
            #

            if path is '/engine.io.js'
                res.writeHead 200, 'Content-Type': 'text/javascript'
                eioClientScript = __dirname + '/../../node_modules/engine.io-client/engine.io.js'
                return readFile eioClientScript, (err, buf) -> res.end buf.toString()



            #
            # todo: inbound encoding?, optional carry stream emitter into www functions
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
