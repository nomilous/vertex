
Hub = require '../hub/hub'

hub = Hub.create
    listen: port: 3002
    secret: 'π'

hub.listen()

