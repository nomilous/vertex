{ipso, tag, mock} = require 'ipso'

describe 'Hub', (should) ->

    before ipso (done, Hub) -> 

        tag

            subject: Hub mock 'config'

        .then done


    it 'defines listen() and close()', 

        ipso (subject) -> 

            subject.listen.should.be.an.instanceof Function
            subject.close.should.be.an.instanceof Function

            