{server} = require '../../lib/api/server'

describe 'server', -> 

    it 'uses config.api', (done) -> 

        config = {}
        Object.defineProperty config, 'api', get: -> done()
        server config
