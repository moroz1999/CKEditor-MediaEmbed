This is a rework of the plugin designed by frozeman and meedan adjusted for
the specific use of embedding YouTube videos in a responsive way.

#Installing the MediaEmbed Plugin

1. Copy the "mediaembed" folder and place it in the ~/ckeditor/plugins directory.
2. Enable the plugin by changing or adding the extraPlugins line in your configuration (config.js):
```JavaScript
    config.extraPlugins = 'mediaembed';
```
3. Add the button to your toolbar by adding the `Mediaembed` item to the toolbar list.
(See http://docs.cksource.com/CKEditor_3.x/Developers_Guide/Toolbar)
4. Include the styles/mediaembed.css file in the head of the page that the edited content will appear on.

