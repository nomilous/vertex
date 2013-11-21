
Client = require '../client/client'

client = Client
    
    title: 'Example Client 1'
    uuid: '810a4d70-b3c4-4102-8c16-1f1cab29449a'
    secret: 'π'
    connect: 
        uri: 'ws://localhost:3001'
        interval: 100

client.connect()
