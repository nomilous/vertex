lastInstance          = undefined
module.exports._test  = -> lastInstance
module.exports.create = (config) ->

    lastInstance = local = 

        root: config.root

        handle: (req, res) -> 

            res.writeHead 200
            res.end '...........'



    return api = 

        handle: local.handle