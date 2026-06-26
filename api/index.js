const { app } = require('../server/app')
require('../server/routes')(app)

module.exports = app
