{basename} = require 'path'
Bunyan = require 'bunyan'

module.exports.create = (config = {}) -> 

    Bunyan.createLogger 

        name:  config.title || basename( process.argv[1] ).split('.').shift()
        level: (try config.log.level) || 'info'

