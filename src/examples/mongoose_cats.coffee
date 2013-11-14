#
# mongoose cats example
#

mongoose = require('mongoose').connect 'mongodb://localhost/test'

kittySchema = mongoose.Schema
    
    name: 
        type: String
        index: unique: true

Kitten = mongoose.model 'Kitten', kittySchema


require('../vertex')

    http: listen: port: 3000

    root: routes =

        kittens: ({method, body}, callback) -> 

            switch method

                #
                # curl -H 'Content-Type: application/json' :3000/kittens --data '{"name":"Brigitte Bardot"}'
                # 

                when 'POST' then (kitten = new Kitten body).save (err) -> 

                    if err? then return callback null, 

                        statusCode: 409 # ?
                        error: err

                    
                    callback null, kitten




routes.kittens.$api = {}
