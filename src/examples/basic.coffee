
thing = 
    in: 
        tree: (opts, callback) -> 

            console.log opts
            callback null, is: 'bird'

        sky: (opts, callback) -> 
            callback null, is: 'plane'


thing.in.sky.$api  = {}
thing.in.tree.$api = {}


require('../vertex')
    
    http: listen: port: 3000

    allowRoot: true

    root: 
        thing: thing

    #
    # curl :3000/thing/in/tree?key=value
    #
