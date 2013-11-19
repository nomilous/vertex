{ipso} = require 'ipso'

describe 'Logger', -> 

    context 'create()', -> 

        it 'creates a bunyan logger name as the vertex title', 

            ipso (Logger, bunyan) -> 

                bunyan.does createLogger: ({name}) -> 

                    name.should.equal 'Vertex Title'

                Logger.create title: 'Vertex Title'


