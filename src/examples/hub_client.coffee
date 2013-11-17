
Client = require '../client/client'

client1 = Client
    
    title: 'Example Client 1'
    uuid: '810a4d70-b3c4-4102-8c16-1f1cab29449a'
    secret: 'π'
    connect: 
        uri: 'ws://localhost:3002'


client2 = Client
    
    title: 'Example Client 2'
    uuid: '810a4d70-b3c4-4102-8c16-1f1cab29449b'
    secret: 'PI'
    connect: 
        uri: 'ws://localhost:3002'
    

client1.connect()
client2.connect()

