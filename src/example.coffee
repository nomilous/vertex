
#
# define routes
#

routes =
    module: 
        function: (opts, callback) -> 

            #
            # curl localhost:3000/module/function
            #

            console.log opts
            callback null, {}

#
# enable routes
#

routes.module.function.$www = {}


#
# start server
#

require('./vertex').create

    www: 
        #allowRoot: true
        routes: routes
        listen: 
            port: 3000
            #hostname: '0.0.0.0'

