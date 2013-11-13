{ipso, mock, tag, once} = require 'ipso'

describe 'Recursor', -> 

    beforeEach ipso (done, Recursor) -> 

        tag

            subject: Recursor.create mock 'config'

        .then done


    it 'recurses config.root', ipso (subject, config) -> 

        subject.does 

            process: ->
            recurse: once ->

