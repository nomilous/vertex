ipso = require 'ipso'

describe 'Handler.create()', -> 

    it 'uses config.root for route configuration', ipso (done, Handler) -> 

        config = {}
        Object.defineProperty config, 'root', get: -> done()
        Handler.create config

