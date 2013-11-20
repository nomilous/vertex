
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

    listen: port: 3001
    
    api: listen: port: 3000

    allowRoot: true

    root: 
        thing: thing

    #
    # curl :3000/thing/in/tree?key=value
    # curl -H 'Content-Type: application/json' -XPOST :3000/thing/in/tree  --data '{"0":"o"}'
    # curl -H 'Content-Type: application/json' -XPUT :3000/thing/in/tree/1 --data '{"1":"o"}'
    # 

