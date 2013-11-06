lastInstance          = undefined
module.exports._test  = -> lastInstance
module.exports.create = (config) ->

    lastInstance = local = 

        root: config.root

        handle: (req, res) -> 

            if config.allowRoot

                res.writeHead 200
                res.write JSON.stringify local.root
                return res.end()

            res.writeHead 404
            res.end() 

    return api = 

        handle: local.handle
