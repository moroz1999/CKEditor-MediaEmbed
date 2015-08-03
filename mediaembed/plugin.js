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
	'use strict';
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

	var fixSrc =
		// In Firefox src must exist and be different than about:blank to emit load event.
		CKEDITOR.env.gecko ? 'javascript:true' : // jshint ignore:line
		// Support for custom document.domain in IE.
		CKEDITOR.env.ie ? 'javascript:' + // jshint ignore:line
						'void((function(){' + encodeURIComponent(
							'document.open();' +
							'(' + CKEDITOR.tools.fixDomain + ')();' +
							'document.close();'
						) + '})())' :
		// In Chrome src must be undefined to emit load event.
						'javascript:void(0)'; // jshint ignore:line

	CKEDITOR.plugins.add( 'mediaembed', {
		icons: 'mediaembed', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%
		lang: 'en,es',
		requires: 'widget,dialog',
		init: function( editor ) {
			var cls = editor.config.mediaEmbedClass || 'embed-content',
				lang = editor.lang.mediaembed;

			editor.widgets.add( 'mediaembed', {
				// inline: true,
				dialog: 'mediaembed',
				button: lang.button,
				mask: true,
				allowedContent: 'div(!' + cls + ')',
				pathName: lang.pathName,

				template: '<div class="' + cls + '"></div>',

				parts: {
					embed: 'div'
				},

				defaults: {
					html: ''
				},

				init: function() {
					var iframe = this.parts.embed.getChild( 0 );

					// Check if span contains iframe and create it otherwise.
					if ( !iframe || iframe.type != CKEDITOR.NODE_ELEMENT || !iframe.is( 'iframe' ) ) {
						iframe = new CKEDITOR.dom.element( 'iframe' );
						iframe.setAttributes( {
							style: 'border:0;width:0;height:0',
							scrolling: 'no',
							frameborder: 0,
							allowTransparency: true,
							src: fixSrc
						} );
						this.parts.embed.append( iframe );
					}

					// Wait for ready because on some browsers iFrame will not
					// have document element until it is put into document.
					// This is a problem when you crate widget using dialog.
					this.once( 'ready', function() {
						// Src attribute must be recreated to fix custom domain error after undo
						// (see iFrame.removeAttribute( 'src' ) in frameWrapper.load).
						if ( CKEDITOR.env.ie ) {
							iframe.setAttribute( 'src', fixSrc );
						}

						this.frameWrapper = new CKEDITOR.plugins.mediaembed.frameWrapper( iframe, editor );
						this.frameWrapper.setValue( this.data.html );
					} );
				},

				data: function() {
					if ( this.frameWrapper ) {
						this.frameWrapper.setValue( this.data.html );
					}
				},

				upcast: function( el, data ) {
					if ( !( el.name == 'div' && el.hasClass( cls ) ) ) {
						return;
					}

					if ( !el.children.length ) {
						return;
					}

					data.html = CKEDITOR.tools.htmlDecode( el.getHtml() );
					data.html = editor.dataProcessor.toDataFormat( data.html );

					el.setHtml( '' );

					return el;
				},

				downcast: function( el ) {
					el.setHtml( this.data.html );
					return el;
				}
			} );

			CKEDITOR.dialog.add( 'mediaembed', function ( editor ) {
				return {
					title : lang.dialogTitle,
					minWidth : 550,
					minHeight : 200,
					contents : [{
						id: 'iframe',
						expand: true,
						elements: [{
							id: 'embedArea',
							type: 'textarea',
							label: lang.dialogLabel,
							setup: function( widget ){
								this.setValue( widget.data.html );
							},
							commit: function( widget ){
								widget.setData( 'html', this.getValue() );
							}
						}]
					}]
				};
			});
		}
	});

	CKEDITOR.plugins.mediaembed = {};
	CKEDITOR.plugins.mediaembed.loadingIcon = CKEDITOR.plugins.get( 'mediaembed' ).path + 'images/loader.gif';
	CKEDITOR.plugins.mediaembed.frameWrapper = function( iFrame, editor ) {
		var media, preview, value, newValue,
			doc = iFrame.getFrameDocument(),

			isInit = false,
			isRunning = false,

			loadedHandler = CKEDITOR.tools.addFunction( function() {
				media = doc.getById( 'cke-media' );
				preview = doc.getById( 'cke-preview' );
				isInit = true;

				if ( newValue ) {
					update();
				}
			} ),

			updateDoneHandler = CKEDITOR.tools.addFunction( function() {
				preview.hide();

				var scripts = media.getElementsByTag( 'script' ),
					head = doc.getHead();
				for ( var i = 0; i < scripts.count(); i++ ) {
					var source = scripts.getItem( i ),
						target = doc.createElement( 'script' );

					source.copyAttributes( target );
					target.setHtml( source.getHtml() );
					head.append( target );
				}

				editor.fire( 'lockSnapshot' );

				iFrame.setStyles( {
					height: 0,
					width: 0
				} );

				var height = Math.max( doc.$.body.offsetHeight, doc.$.documentElement.offsetHeight );

				iFrame.setStyles( {
					height: height + 'px',
					width: '100%'
				} );

				editor.fire( 'unlockSnapshot' );

				// If value changed in the meantime update it again.
				if ( value != newValue ) {
					update();
				} else {
					isRunning = false;
				}
			} );

		iFrame.on( 'load', load );

		load();

		function load() {
			doc = iFrame.getFrameDocument();

			if ( doc.getById( 'cke-media' ) ) {
				return;
			}

			// Because of IE9 bug in a src attribute can not be javascript
			// when you undo (#10930). If you have iFrame with javascript in src
			// and call insertBefore on such element then IE9 will see crash.
			if ( CKEDITOR.env.ie ) {
				iFrame.removeAttribute( 'src' );
			}

			doc.write( '<!DOCTYPE html>' +
						'<html>' +
						'<head>' +
							'<meta charset="utf-8">' +
							'<script>' +
								// Get main CKEDITOR form parent.
								'function getCKE() {' +
									'if ( typeof window.parent.CKEDITOR == \'object\' ) {' +
										'return window.parent.CKEDITOR;' +
									'} else {' +
										'return window.parent.parent.CKEDITOR;' +
									'}' +
								'}' +

								'function update() {' +
									'getCKE().tools.callFunction( ' + updateDoneHandler + ' );' +
								'}' +

								'function load() {' +
									'getCKE().tools.callFunction(' + loadedHandler + ');' +
								'};' +
							'</script>' +

						'</head>' +
						'<body style="padding:0;margin:0;background:transparent;overflow:hidden" onload="load();">' +
							'<span id="cke-preview"></span>' +
							'<span id="cke-media"></span>' +
							// '<span id="buffer" style="display:none"></span>' +
						'</body>' +
						'</html>' );
		}

		// Run MathJax parsing Tex.
		function update() {
			isRunning = true;

			value = newValue;

			editor.fire( 'lockSnapshot' );

			media.setHtml( value );

			// Set loading indicator.
			preview.setHtml( '<img src=' + CKEDITOR.plugins.mediaembed.loadingIcon + ' alt=' + editor.lang.mediaembed.loading + '>' );
			preview.show();

			iFrame.setStyles( {
				height: '16px',
				width: '16px',
				// display: 'inline',
				'vertical-align': 'middle'
			} );

			editor.fire( 'unlockSnapshot' );

			doc.getWindow().$.update();
		}

		return {
			setValue: function( value ) {
				newValue = value;

				if ( isInit && !isRunning ) {
					update();
				}
			}
		};
	};
})();
