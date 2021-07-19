const knex = require('knex')

const config = require('./knexfile')

const sql = knex(config.development)

module.exports = sql
