{basename} = require 'path'
Bunyan = require 'bunyan'

module.exports.create = (config) -> 

    name = config.title || basename( process.argv[1] ).split('.').shift()
    return Bunyan.createLogger name: name
