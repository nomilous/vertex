
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


        broken: (opts, callback) -> 

            callback new Error 'Moo'

#
# enable routes
#

routes.module.function.$www = {}
routes.module.broken.$www = {}


#
# start server
#

require('./vertex').create.www


    #allowRoot: true
    routes: routes
    #listen: 
    #    port: 3000
    #    #hostname: '0.0.0.0'

