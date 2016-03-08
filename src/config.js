
'use strict'

const dotenv = require('dotenv')
const ENV = process.env.NODE_ENV || 'development'

if (ENV === 'development') dotenv.load()

const config = {
  ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PROXY_URI: process.env.PROXY_URI,
  HIPHUB_COMMAND_TOKEN: process.env.HIPHUB_COMMAND_TOKEN,
  SLACK_TOKEN: process.env.SLACK_TOKEN
}

module.exports = (key) => {
  if (!key) return config

  return config[key]
}
