
'use strict'

const _ = require('lodash')
const config = require('../config')
const request = require("request");

const msgDefaults = {
  response_type: 'in_channel',
  username: 'Starbot',
  icon_emoji: config('ICON_EMOJI')
}

const handler = (payload, res) => {

  var options = { method: 'GET',
    url: 'https://api.heroku.com/apps/starbot9gag',
    headers:
     { 'postman-token': '60203083-50d7-c2b2-9730-e5f10e0a9e51',
       'cache-control': 'no-cache',
       authorization: 'Bearer a87c5c28-03fb-4a72-b1af-63d701206308',
       accept: 'application/vnd.heroku+json; version=3' } };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    let msg = _.defaults({
      channel: payload.channel_name,
      attachments: body
    }, msgDefaults)

    res.set('content-type', 'application/json')
    res.status(200).json(msg)
    return
  });
}

module.exports = { pattern: /app/ig, handler: handler }
