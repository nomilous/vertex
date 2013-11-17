
Client = require '../client/client'

client = Client
    connect: 
        uri: 'ws://localhost:3002'

client.connect()

