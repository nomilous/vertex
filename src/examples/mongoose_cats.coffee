#
# mongoose cats example
#

mongoose = require('mongoose').connect 'mongodb://localhost/test'

kittySchema = mongoose.Schema
    
    name: String

Kitten = mongoose.model 'Kitten', kittySchema

