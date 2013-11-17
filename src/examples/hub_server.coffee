
Hub = require '../hub/hub'

hub = Hub 
    listen: port: 3002
    secret: 'π'

hub.listen()

