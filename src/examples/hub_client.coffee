
Client = require '../client/client'

client1 = Client
    
    title: 'Example Client 1'
    uuid: '810a4d70-b3c4-4102-8c16-1f1cab29449a'
    connect: 
        uri: 'ws://localhost:3002'
        secret: 'π'

client2 = Client
    
    title: 'Example Client 2'
    uuid: '810a4d70-b3c4-4102-8c16-1f1cab29449b'
    connect: 
        uri: 'ws://localhost:3002'
        secret: 'π'

client1.connect()
client2.connect()

