{ipso} = require 'ipso'

describe 'Logger', -> 

    context 'create()', -> 

        it 'creates a bunyan logger with name as the vertex title', 

            ipso (Logger, bunyan) -> 

                bunyan.does createLogger: ({name, level}) -> 

                    name.should.equal 'Vertex Title'
                    level.should.equal 'fatal'

                Logger.create 

                    title: 'Vertex Title'
                    log: 
                        level: 'fatal'


