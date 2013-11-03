server = require('../api/server')
    
    http: listen: port: 3000

    (req, res) -> 

        res.writeHead 200
        res.end '...........'


server.listen (error, address) -> 

    console.log address

