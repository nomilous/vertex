should       = require 'should'
{ipso, mock} = require 'ipso'
{create}     = require '../../lib/api/server'


describe 'Server.create()', -> 

    @timeout 10

    it 'uses config.http for listen configuration', (done) -> 

        config = {}
        Object.defineProperty config, 'http', get: -> done()
        create( config ).listen()



    it 'starts http listening at config.http.listen.port and hostname', ipso (facto, http) -> 

        http.does 
            createServer: ->
                listen: (port, hostname) -> 
                    port.should.equal 2999
                    hostname.should.equal 'test.local'
                    facto()

        create 
            http: 
                listen: 
                    hostname: process.env.API_HOSTNAME
                    port: process.env.API_PORT
                    
        .listen()
        


    it 'calls back with the listening address', ipso (facto, http) ->

        http.does 
            createServer: ->
                listen: (args...) -> args.pop()() # callback is last arg
                address: -> 'mock address'

        instance = create http: listen: {}
        instance.listen (err, addr) -> 
            addr.should.equal 'mock address'
            facto()


    it 'can stop http', ipso (facto, http) ->

        http.does 
            createServer: -> 

                return mock('server').does

                    #
                    # a "tier2" mock, with function expectations...
                    # ---------------------------------------------
                    # 
                    # * worth it's weight in gold! 
                    # 

                    listen: (args...) -> args.pop()()
                    address: -> 
                    close: -> facto()   


        instance = create http: listen: {}
        instance.listen ->  # instance.close()


        # 
        #  actual expected
        #  
        #   1 | {
        #   2 |   "http": {
        #   3 |     "functions": {
        #   4 |       "Object.createServer()": "was called"
        #   5 |     }
        #   6 |   },
        #   7 |   "server": {
        #   8 |     "functions": {
        #   9 |       "Object.listen()": "was called",
        #  10 |       "Object.address()": "was called",
        #  11 |       "Object.close()": "was NOT called"  <---------------- 
        #  12 |     }
        #  13 |   }
        #  14 | }
        # 
        #  as opposed to: 
        # 
        #     Error: timeout of 2000ms exceeded
        # 

