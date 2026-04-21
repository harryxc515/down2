const messages = {
  welcome: (firstName) =>
    `<blockquote>welcome${firstName ? ", " + firstName : ""}

paste a link from youtube, instagram or pinterest and i will download the media for you.
supported platforms:
- youtube  (videos, shorts, reels)
- instagram  (reels, posts, stories)
- pinterest  (videos, images)
just send a link to get started.
tap help or how to use if you need guidance.</blockquote>`,
  processing: (platform) =>
    `<blockquote>downloading from ${platform}
please wait...</blockquote>`,

  noUrl: `<blockquote>no link found in your message.

send a link from youtube, instagram or pinterest.</blockquote>`,

  unsupportedPlatform: (url) =>
    `<blockquote>this link is not supported.

supported platforms:
- youtube.com  youtu.be
- instagram.com
- pinterest.com  pin.it

link received: ${url}</blockquote>`,

  downloadSuccess: (platform, title) =>
    `<blockquote>done

platform: ${platform}${title ? "\ntitle: " + title : ""}

send another link anytime.</blockquote>`,

  downloadFailed: (reason) =>
    `<blockquote>download failed

${reason || "unknown error"}

check that the link is public and try again.</blockquote>`,

  helpInline: `<blockquote>help

this bot downloads videos and images from:
- youtube
- instagram
- pinterest

just paste a link from any of those platforms and send it here.

if a download fails, make sure the content is public and not age-restricted.</blockquote>`,

  howto: `<blockquote>how to use

1. open youtube, instagram or pinterest
2. find the video or image you want
3. copy the share link
4. paste it here and send
5. the bot will fetch and send the file

for bulk downloads or a better experience, use the mini app button.</blockquote>`,
};

module.exports = messages;

