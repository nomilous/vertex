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

        kittens: ({method, body, rest}, callback) -> 

            switch method

                #
                # curl -H 'Content-Type: application/json' :3000/kittens --data '{"name":"Brigitte Bardot"}'
                # 

                when 'POST' then Kitten.create body, (err, kitten) -> 

                    if err? then return callback null, 

                        statusCode: 409 # ?
                        error: err

                    
                    callback null, kitten


                #
                # curl :3000/kittens/52854c6b9c1cb7e28d000001
                # 

                when 'GET' 

                    if id = rest.pop()

                        Kitten.findById id, (err, kitten) -> 

                            if err? then return callback null, 

                                statusCode: 400
                                error: err

                            #
                            # TODO: statuscode not getting through
                            #

                            if not kitten? then callback null, statusCode: 404

                            callback null, kitten






routes.kittens.$api = {}
