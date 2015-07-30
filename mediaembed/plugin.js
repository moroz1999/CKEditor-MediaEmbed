/*
* Embed Media Dialog based on http://www.fluidbyte.net/embed-youtube-vimeo-etc-into-ckeditor
*
* Plugin name:      mediaembed
* Menu button name: MediaEmbed
*
* Youtube Editor Icon
* http://paulrobertlloyd.com/
*
* @author Fabian Vogelsteller [frozeman.de]
* @version 0.6
*/

(function() {
	function processEmbedContent( editor ) {
		var divs = editor.document.getElementsByTag( 'div' ),
			count = divs.count(),
			embeds = [],
			i;
		for ( i = 0; i < count; i++ ) {
			var div = divs.getItem( i );
			if ( div.hasClass( 'embed-content' ) && !div.data( 'embed-source' ) ) {
				embeds.push( div );
			}
		}

		var iframes = [];
		for ( i = 0; i < embeds.length; i++ ) {
			var embed = embeds[ i ],
				html = embed.getHtml(),
				iframe = editor.document.createElement( 'iframe' );

			iframe.setAttribute( 'contenteditable', 'false' );

			html = editor.dataProcessor.toDataFormat( html );

			embed.setHtml( '' );
			embed.data( 'embed-source', encodeURI( html ) );
			embed.append( iframe );

			var iframeDoc = iframe.getFrameDocument();
			iframeDoc.write( html );

			iframes.push( iframe );
		}

		if ( iframes.length ) {
			var interval = window.setInterval(function() {
				for ( var i = 0; i < iframes.length; i++ ) {
					var iframe = iframes[ i ],
						body = iframe.getFrameDocument().getBody();
					iframe.setStyles({
						'height': body.$.scrollHeight + 'px'
					});
					body.setStyle( 'overflow-y', 'hidden' );
				}
			}, 5000 );

			var stopResizing = function() {
				window.clearInterval( interval );
			};

			window.setTimeout( stopResizing, 15000 );
			editor.on( 'contentDomUnload', stopResizing );
		}
	}

	CKEDITOR.plugins.add( 'mediaembed', {
		icons: 'mediaembed', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%
		lang: 'en,es',
		requires: 'dialog',
		onLoad: function() {
			CKEDITOR.addCss(
				'.embed-content iframe { width: 100%; border: 0; }'
			);
		},
		init: function( editor ) {
			CKEDITOR.dialog.add( 'MediaEmbedDialog', function ( editor ) {
				return {
					title : editor.lang.mediaembed.dialogTitle,
					minWidth : 550,
					minHeight : 200,
					contents :
					[
						{
							id: 'iframe',
							expand: true,
							elements: [{
								id: 'embedArea',
								type: 'textarea',
								label: editor.lang.mediaembed.dialogLabel,
								'autofocus': 'autofocus',
								setup: function( element ){
								},
								commit: function( element ){
								}
							}]
						}
					],
					onOk: function() {
						var html = this.getContentElement( 'iframe', 'embedArea' ).getValue(),
							div = editor.document.createElement( 'div' );

						div.addClass( 'embed-content' );
						div.setHtml( html );
						editor.insertElement( div );

						processEmbedContent( editor );
					}
				};
			});

			editor.on( 'contentDom', function( evt ) {
				processEmbedContent( editor );
			});

			editor.addCommand( 'MediaEmbed', new CKEDITOR.dialogCommand( 'MediaEmbedDialog',
				{ allowedContent: 'iframe[*]' }
			));

			editor.ui.addButton( 'MediaEmbed',
			{
				label: editor.lang.mediaembed.toolbar,
				command: 'MediaEmbed',
				toolbar: 'mediaembed'
			});
		},

		afterInit: function( editor ) {
			var dataProcessor = editor.dataProcessor,
				htmlFilter = dataProcessor && dataProcessor.htmlFilter,
				dataFilter = dataProcessor && dataProcessor.dataFilter;

			if ( htmlFilter ) {
				htmlFilter.addRules({
					elements: {
						div: function( div ) {
							if ( div.hasClass( 'embed-content' ) ) {
								var html = div.attributes[ 'data-embed-source' ];
								delete div.attributes[ 'data-embed-source' ];

								html = CKEDITOR.tools.htmlDecode( decodeURI( html ) );
								html = editor.dataProcessor.toHtml( html );
								div.setHtml( html );
							}
						}
					}
				});
			}
		}
	});
})();
