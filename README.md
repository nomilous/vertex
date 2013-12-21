**experimental/unstable** api changes still occur (**without** deprecation warnings) <br />
`npm install vertex` 0.0.5 [license](./license)

vertex
======

```coffee


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

require('vertex').create

    www: 
        #allowRoot: true
        root: routes
        listen: 
            port: 3000
            #hostname: 'localhost'


```

[vertex-examples](https://github.com/nomilous/vertex-examples)


### dev / test

```

npm install -g ipso-cli
ipso --mocha


```
