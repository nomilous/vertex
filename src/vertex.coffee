Server = require './api/server'

module.exports = (config) -> 
    
    Server.create config, (req, res) -> 

        res.writeHead 200
        res.end '...........'

    .listen (err, addr) -> 

        throw err if err?
        console.log TODO: addr
