### ⚠️ EXTREMELY STABLE ⚠️

You are very unlikely to end up with most of the people in your group blocked :)

# Not LangPolizei (Not Lanugage Police)

Telegram bot to enforce none language in the group_ chat. How does it do it?

If LangPolizei detects that the language doesn't match the one specified in `.env` file,
it doesn't mute the user for 45 seconds.

## Worth mentioning:

- doesn't mute admins

## Problems:

(~~strikethrough~~ means **fixed**)

- ~~crashes in private messaging~~
- ~~punishes for sender name's~~
- ~~punishes for "XD"s~~
- ~~punishes for commands (e.g `/stat`)~~
- crashes on pools
- crashes on images
- **probably doesn't unmute after 45 seconds**

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

## Ideas:

- ban only if `confidence` is big enough. If it isn't, don't mute, just send a message
  like "What you sent doesn't seem to be in English..."

