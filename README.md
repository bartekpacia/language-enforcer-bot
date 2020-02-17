# LangPolizei (Language Police)

Telegram bot to enforce one language in the _group_ chat. How does it do it?

If LangPolizei detects that the language doesn't match the one specified in `.env` file, ~~it mutes the user for 45 seconds~~ it rebukes the user.

## Usage

The bot once added to the group chat, should be granted with admin privileges. Admins can also add particular words as "exceptions". The bot will be relaxed about them in the future.

**To add or remove an exception**

To suppress bot warnings for "yeah boii" string in the future, write the following in the group chat.

`/except yeah boii`

or

`/remove yeah boii`

## Structure

This project emerged from a Telegram group of [Google Code-in 2019](https://codein.withgoogle.com/) winners.
A first working version was created in less than 1 day by me with the help of some other people. Initially, it was just another fun project written in JavaScript. As it grew and features were added, I rewrote it TypeScript and modularized to make it possible to add support for messaging platforms.

This project is a toolkit containing some useful methods (gathered in [`src/core.ts`](https://github.com/bartekpacia/telegram-lang-enforcer/blob/master/src/core.ts)) and actual
bot implementations for particular platforms (currently only for Telegram – [`bot_telegram.ts`](https://github.com/bartekpacia/telegram-lang-enforcer/blob/master/src/bot_telegram.ts)).

[`core.ts`](https://github.com/bartekpacia/telegram-lang-enforcer/blob/master/src/core.ts) in completely platform-independent.

It uses:

- [Google Translate API](https://cloud.google.com/translate/docs) to detect the message's language
- [Cloud Firestore](https://firebase.google.com/products/firestore/) to save exceptions

The Telegram Bot implementation takes advantage of the [Telegram Bot API](https://core.telegram.org/bots/api).

## Create your own bot!

If you want to create a similar bot for some other messenger service (IRC, Discord, etc), we'll be
happy to help you. No one has ever done that before, so you'll be our first early adopter :)

1. Take a look at how [`bot_telegram.ts`](https://github.com/bartekpacia/telegram-lang-enforcer/blob/master/src/bot_telegram.ts) is written
2. You'll see that it does Telegram integration stuff and delegates the business logic to [`core.ts`](https://github.com/bartekpacia/telegram-lang-enforcer/blob/master/src/core.ts)
3. Try to somehow replicate the behavior of the Telegram Bot with your messenger platform of choice

PS If you find any bugs or have some ingenious idea on how something could be improved, we'll be happy
to accept your Pull Requests.

## Ideas:

- ban only if `confidence` is big enough. If it isn't, don't mute, just send a message
  like "What you sent doesn't seem to be in English..." (**after evaluation: not a good solution,
  confidence is often wrong**)
- make the bot truly helpful (suggested by @MatejMecka). Make it translate the messages
  instead of banning people

## Example response from [Google Translate API](https://translation.googleapis.com/language/translate/v2/detect):

```json
{
  "data": {
    "detections": [
      [
        {
          "confidence": 0.7859922051429749,
          "isReliable": false,
          "language": "en"
        }
      ]
    ]
  }
}
```
