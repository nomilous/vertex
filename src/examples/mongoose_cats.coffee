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

    api: listen: port: 3000

    root: routes =

        kittens: ({method, body, rest, query, api}, callback) -> 

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
                # curl :3000/kittens/52854e0b46d897738f000001
                # curl :3000/kittens?name=Brigitte%20Bardot
                # 

                when 'GET' 

                    if id = rest.shift()

                        return Kitten.findById id, (err, kitten) -> 

                            if err? then return callback null, 

                                statusCode: 400
                                error: err

                            #
                            # TODO: statuscode not getting through
                            #

                            console.log K: kitten, P: rest

                            if not kitten? then callback null, statusCode: 404

                            return callback null, kitten


                    Kitten.find query, (err, kittens) -> 

                        #
                        # api.paginate... 
                        #

                        if err? then return callback null, 

                            statusCode: 400
                            error: err

                        callback null, kittens






routes.kittens.$api = 

    paginate: 20 # or something
