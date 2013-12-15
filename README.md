**experimental/unstable** api changes still occur (**without** deprecation warnings) <br />
`npm install vertex` 0.0.2 [license](./license)

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

require('vertex')

    www: 
        #allowRoot: true
        root: routes
        listen: 
            port: 3000
            #hostname: '0.0.0.0'


```

[vertex-examples](https://github.com/nomilous/vertex-examples)


### dev / test

```

npm install -g ipso-cli
ipso --mocha


```
