![Starbot](https://heroku-www-files.s3.amazonaws.com/starbot/starbot-banner.png)

# How to Deploy Your Slack Bots to Heroku

Whether they're publishing notifications, responding to /slash commands and or carrying a conversation, bots have become an integral part of the way we work with Slack.  A bot could do literally anything that's useful to you and your team as part of your day-to-day work, as well as most anything else you can imagine. For some first-hand expereince, check out the [Heroku Button Gallery](https://elements.heroku.com/buttons), where users have created all types of bots: from fun bots like [poker](https://elements.heroku.com/buttons/charliehess/slack-poker-bot) and [Jeopardy!](https://elements.heroku.com/buttons/gesteves/trebekbot), to more practical ones like a bot that [tracks the satisfaction of your team members](https://elements.heroku.com/buttons/wearehanno/oskar) or one that [reminds your team to review existing pull requests](https://elements.heroku.com/buttons/pedrorijo91/slack-pr-bot).

That said, the real power and fun of Slack bots comes once you know how to build your own.  In this post, we'll show you how to create and deploy a Slack bot that will respond to /slash commands in order to show the top trending repos in GitHub.  And while a Slack bot can be built in practically any language, today we're going to build ours with Node, and not just because I <span class="EmojiInput mj40" title="Heavy Black Heart ❤"></span> Node. Anything beyond a simple notification bot depends on Slack's WebSocket-based [RTM (Real Time Messaging) API](https://api.slack.com/rtm), and WebSockets and Node go together like 🍔🍟.

There’s a lot to cover; here's an outline of the post that might be helpful: 

1. **[Prologue](#prologue)**
2. **[Publishing Notifications to Slack](#publish-notifications-to-slack)**
3. **[Receiving and Responding to `/slash` Commands](#receive-and-respond-to-code-slash-code-commands)**
4. **[Connecting a Bot to the Slack RTM API](#publish-notifications-to-slack)**
5. **[Share Your Bot with the Heroku Button](#connecting-a-bot-to-the-slack-rtm-api)**
6. **[Epilogue](#epilogue)**

## Prologue

Let me introduce you to [:star2: Starbot](https://github.com/mattcreager/starbot), the example we'll be working with today.  It's soon-to-be the easiest way to stay apprised of hip repos on GitHub, from the comfort of your favorite Slack channel.

### Before you begin

Come build with me. Here's what you'll need:

- A (free or better) [Heroku account](https://signup.heroku.com)
- The [Heroku Toolbelt](https://toolbelt.heroku.com)
- A Slack team to abuse
- Node (5.7.* preferably)
- The burning desire to scream [IT'S ALIVE](https://media.giphy.com/media/YEL7FJP6ed008/giphy.gif).

> This guide bounces between Slack, Heroku and your local development machine — so I've prefixed the sub-titles with the applicable logo where appropriate.

### ![Slack](https://heroku-www-files.s3.amazonaws.com/starbot/icons/icon-slack.png) Create a custom Slack integration

We're going to make a [custom integration bot](https://slack.com/apps/build) designed explicitly for your team, though Slack also supports Slack's [App Directory] like [Heroku's](https://slack.com/apps/A0F7VRF7E-heroku) (and either could be deployed on Heroku). As a bonus, I'll show you how to easily distribute your bot using the Heroku Button, so that you can share your creation with everyone – even grandma.

(Note that if you are building a serious bot, you will ultimately want to run it on Hobby rather than Free dynos to avoid any issues with dyno sleeping and idling.  But Free dynos are great for building and testing.)

First, visit [`slack.com/apps/build`](https://slack.com/apps/build) and select "Make a Custom Integration" as seen below.

![select a custom intergration](https://heroku-www-files.s3.amazonaws.com/starbot/screenshots/1-custom-intergration.png)

### Run Starbot locally

Starbot is essentially a bare-bones [Express](http://expressjs.com/) app, you can find detailed instructions on running it locally in the projects[`README.md`](https://github.com/mattcreager/starbot/blob/master/README.md).

#### Clone the project

```shell
$ git clone https://github.com/mattcreager/starbot.git
$ cd starbot
```

#### Install dependencies

```shell
$ npm install
```

#### Copy `.env-example` to `.env`

```shell
$ cp .env-example .env
```

#### Start Starbot

```shell
$ npm start

🚀 Starbot LIVES on PORT 3000 🚀
```

That's it! Visit [localhost:3000](http://localhost:3000) and make sure Starbot is running.

### ![Heroku](https://heroku-www-files.s3.amazonaws.com/starbot/icons/icon-heroku.png) Deploy Starbot to Heroku

We could push our code to Heroku without ever visiting the command line, but what fun  would that be?

#### Create a Heroku app, with the Heroku Toolbelt

```shell
$ heroku create {optional-app-name}

Creating app... done, stack is cedar-14
https://starbot-staging.herokuapp.com/
```

#### Push our code

```shell
$ git push heroku master

Counting objects: 15, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (14/14), done.
Writing objects: 100% (15/15), 5.72 KiB | 0 bytes/s, done.
Total 15 (delta 0), reused 0 (delta 0)
remote: Compressing source files... done.
remote: Building source:
remote:
remote: -----> Node.js app detected
...
remote:        https://starbot-staging.herokuapp.com/ deployed to Heroku
remote:
remote: Verifying deploy.... done.
To https://git.heroku.com/starbot-staging.git
 * [new branch]      master -> master

```

Did we just deploy this application in two commands? Yes, yes we did! Heroku installed the dependencies in Starbot's `package.json` file automatically, and gave us a URL so that we can visit our newly-deployed app.

#### Open the app in a browser

```shell
$ heroku open
```

Now Starbot is running on Heroku, but it doesn't know anything about Slack, and Slack doesn't know anything about it. I expect they'll soon be fast friends, so let's make introductions.

## Publish Notifications to Slack

While publishing notifications to Slack is the simplest of custom integrations, it's still pretty-darn cool, especially with a sprinkling of [Heroku Add-ons](https://elements.heroku.com/addons). Let's show Starbot how to find [trending GitHub projects](https://github.com/trending) and publish them to a Slack channel every morning. In this case, Starbot is using the [BotKit](http://howdy.ai/botkit/docs/) framework from the folks at [Howdy.ai](http://howdy.ai).

### ![Slack](https://heroku-www-files.s3.amazonaws.com/starbot/icons/icon-slack.png) Set up an "Incoming WebHook" on Slack

Slack will provide us with the API endpoint, or webhook; later, we'll `POST` data to this endpoint. Select "Incoming WebHooks" and choose a channel.

![select inbound webhook](https://heroku-www-files.s3.amazonaws.com/starbot/screenshots/2-select-inbound-webhook.png)

_Again, the above selection can be found at {your-team}.slack.com/apps/build/custom-intergration_

![select a channel](https://heroku-www-files.s3.amazonaws.com/starbot/screenshots/3-select-channel.png)

Now you're the proud new owner of a Slack "Incoming WebHook"! The configuration page includes a lot of great information about formatting and delivering messages to your new webhook, but what we need first is the "Webhook URL". It should look something like this:
`https://hooks.slack.com/services/T0..LN/B0..VV1/br..dd`

Found it? 👏 Now let's move right along.

### ![Heroku](https://heroku-www-files.s3.amazonaws.com/starbot/icons/icon-heroku.png) Publish a Notification to Slack from Heroku

Now that we've deployed our Starbot to Heroku, and added an incoming webhook on Slack it's time to connect the dots. [Heroku Add-ons](https://elements.heroku.com/addons) allow us to quickly extend the functionality of our application, in this case, we're going to use the [Scheduler](https://devcenter.heroku.com/articles/scheduler) add-on to deliver trending GitHub repos to Slack daily.

We can provision the add-on from the dashboard, or from the CLI with the Heroku Toolbelt.

```
$ heroku addons:create scheduler

  Creating scheduler-transparent-24143... done, (free)
  Adding scheduler-transparent-24143 to starbot-staging... done

$ heroku addons:open scheduler
```

Then add a scheduled task, and configure it to run daily.

![create a scheduled task](https://heroku-www-files.s3.amazonaws.com/starbot/screenshots/4-scheduler.png)

Our new scheduled task will create a [one-off dyno](https://devcenter.heroku.com/articles/one-off-dynos) and execute `npm run notify`, which is defined in this bit of our `package.json`.

```json
{
  "name": "starbot",
  ...
  "scripts": {
    "start": "node ./src",
    "notify": "node ./src/tasks/notify",
    "test": "standard"
  },
  ...
  "engines": {
    "node": "5.7.1"
  }
}
```

We _could_ wait patiently for the task we scheduled to fire—or we could just run our own one-off dyno, and trigger the notification ourselves. Immediate gratification, FTW.

```shell
$ heroku run "npm run notify"
```

Which should yield the following result:

![trending repos](https://heroku-www-files.s3.amazonaws.com/starbot/screenshots/5-trending-repos.gif)

## Receive and Respond to `/slash` Commands

[Slash commands](https://api.slack.com/slash-commands) are a personal favorite—enabling you to listen for a custom command,   across channels, and triggering a `POST` or `GET` request to a configurable endpoint. In this case, that endpoint will be the Starbot application we deployed earlier, and responding to `/slash` commands will let our bot do a lot more than post once a day!

### ![Slack](https://heroku-www-files.s3.amazonaws.com/starbot/icons/icon-slack.png) Creating a `/starbot` slash command

Return to the "Build a Custom Integration" page and select "Slash Commands".

![select slash commands](https://heroku-www-files.s3.amazonaws.com/starbot/screenshots/6-select-slash-intergration.png)

Next, pick a name, it must begin with `/`.

![choose a command](https://heroku-www-files.s3.amazonaws.com/starbot/screenshots/7-choose-a-command.png)

Now that we've created the command, we need to configure it. Starbot is expecting a `POST` request to arrive at `/commands/starbot`.

![set command url](https://heroku-www-files.s3.amazonaws.com/starbot/screenshots/8-set-command-url.png)

Slack has also provided us with a token specific to this command, something like: `JzRR6hEuh3f749iXY3qEpVgN`. We're going to use this to verify the payload Starbot receives is coming from Slack.

It wouldn't hurt to choose an appropriate name, icon, a descriptive label and some autocomplete text either—you could make something up, or use the suggestions provided in [Starbot's readme](https://github.com/mattcreager/starbot/blob/master/README.md).

### ![Heroku](https://heroku-www-files.s3.amazonaws.com/starbot/icons/icon-heroku.png) Configuring the `/starbot` command on Heroku

We've already deployed Starbot to Heroku, so it's waiting patiently for `POST` requests from Slack, but at the moment Slack's requests are going to receive a `402` (Unauthorized) response. To fix that, we'll need to authenticate the bot with Slack, which is easy. We'll just use the Heroku Toolbelt to set a `STARBOT_COMMAND_TOKEN` [config  var](https://devcenter.heroku.com/articles/config-vars).

```shell
$ heroku config:set STARBOT_COMMAND_TOKEN=JzRR6hEuh3f749iXY3qEpVgN

  Setting config vars and restarting starbot-staging... done
  STARBOT_COMMAND_TOKEN: JzRR6hEuh3f749iXY3qEpVgN
```

Now Slack and the bot can talk! Take `/starbot` or `/starbot repos` for a spin in your Slack channel!

## Connecting a Bot to the Slack RTM API

And finally the star of the show, a developers best-friend, the real-time bot. Fortunately, no matter how tricky your bot is to build, configuring and deploying it to Heroku is simple.

### ![Slack](https://heroku-www-files.s3.amazonaws.com/starbot/icons/icon-slack.png) Connecting a bot to the Slack RTM API

Ok, one last trip to the "Build a Custom Integration" page and this time we're going to select "Bots".

![select bots](https://heroku-www-files.s3.amazonaws.com/starbot/screenshots/9-select-bot-intergration.png)

We get to give our bot a name!

![set bot username](https://heroku-www-files.s3.amazonaws.com/starbot/screenshots/9-set-bot-username.png)

And again, we're presented with the opportunity to customize the bot we've just created by giving it a name, description, icon, etc. You'll notice that the bot isn't currently following any channels. Bots are like vampires: they must be invited to a channel before they can follow it (any takers for BuffyBot?).

Take note of the API token, which is going to look like this: `xoxb-253973540645-lAJG4hL34343f3pk52BE6JO`. Without it, we won't be able to authenticate.

### ![Heroku](https://heroku-www-files.s3.amazonaws.com/starbot/icons/icon-heroku.png) Configuring the bot on Heroku

The Starbot bot won't attempt to connect to Slack's RTM API without a token, so once more, let's use the Heroku Toolbelt to set a `SLACK_TOKEN` config var.

```shell
$ heroku config:set SLACK_TOKEN=xoxb-253973540645-lAJG4hL34343f3pk52BE6JO

  Setting config vars and restarting starbot-staging... done
  SLACK_TOKEN: xoxb-253973540645-lAJG4hL34343f3pk52BE6JO
```

That's it! Head over to your Slack channel and use the `/invite `command to invite our `@starbot` bot to the channel. Then say hello to him - or her!

## Share Your Bot with the Heroku Button

The [Slack Button](https://api.slack.com/docs/slack-button) makes it easy for other Slack users to add your bot to their team, but the Heroku Button makes it just as easy for other developers to deploy and manage your bot themselves.

Adding a button to your bot is as simple as creating an `app.json` file, and adding the button to our GitHub readme.

### Creating an `app.json`

The `app.json` file is a manifest format for describing web apps. Here's the interesting bits from Starbot's `app.json`:

```json
{
  "name": "🌟 Starbot",
  "description": "tarbot is GitHub's trending open-source page, reincarnated as a Slack bot",
  "repository": "https://github.com/mattcreager/starbot",
  "env": {
    "STARBOT_COMMAND_TOKEN": {
      "description": "Slash command token, for the starbot command endpoint",
      "required": true
    },
    "SLACK_TOKEN": {
      "description": "Slack bot RTM API token",
      "required": false
    },
  },
  "image": "heroku/nodejs"
}
```

As you can see above, we begin by specifying our apps name, description and repo. We then declare the environment variables Starbot requires to run. Learn more about the [app.json schema on the DevCenter](https://devcenter.heroku.com/articles/app-json-schema).

### Adding the Heroku Button to the repo

The last thing we must do before people can begin deploying Starbot with the Heroku Button, is to add it to the projects `README.md`:

```
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
```

Heroku will automatically infer the repository URL from the referer header when someone clicks on the button.

## Epilogue

Now that you’ve got the basics down, a whole new world of functionality is at your team’s fingertips. Not just your team’s either – with a little more work you can offer your bot as a service for others on Slack through the [App Directory.](https://slack.com/apps) Peruse the directory to see the many ways teams are extending Slack, whether it's with the outside world through Customer Support apps, or internally with HR or Office Management. To learn more about offering your app, check out their [getting started guide.](https://api.slack.com/slack-apps)
