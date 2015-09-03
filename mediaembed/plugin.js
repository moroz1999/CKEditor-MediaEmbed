/**
 * Embed Media Plugin.
 *
 */

(function() {
	'use strict';

	CKEDITOR.plugins.add( 'mediaembed', {
		icons: 'mediaembed', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%
		lang: 'en,es',
		requires: 'widget,dialog',
		init: function( editor ) {
			var cls = editor.config.mediaEmbedClass || 'embed-content',
				lang = editor.lang.mediaembed;

			editor.addContentsCss(this.path + 'styles/mediaembed.css');

			editor.widgets.add( 'mediaembed', {
				dialog: 'mediaembed',
				button: lang.button,
				mask: true,
				allowedContent: 'div{padding-bottom}(!' + cls + ');iframe[*](*)',
				pathName: lang.pathName,

				template: '<div class="' + cls + '"></div>',

				parts: {
					embed: 'div'
				},

				defaults: {
					html: '',
					ratio: 0, // height / width * 100
				},

				init: function() {
					this.setData('html', this.element.getHtml());
					var paddingBottom = this.element.getStyle( 'padding-bottom' );
					if (paddingBottom != '') {
						this.setData('ratio', parseFloat(paddingBottom));
					}
				},

				data: function() {
					this.element.setHtml(this.data.html);
					if (this.data.ratio != 0) {
						this.element.addClass('responsive');
						this.element.setStyle('padding-bottom', this.data.ratio + '%');
					}
				},

				upcast: function( el, data ) {
					return el.name == 'div' && el.hasClass( cls );
				},

				downcast: function( el ) {
					//el.setHtml( this.data.html );
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
								var html = this.getValue();

								// Is there an iframe
								if (html.indexOf('iframe') !== -1) {
									// Attempt to get the width and height
									var width = html.match(/iframe[^>]+width="([1-9][0-9]*)"/);
									if (width !== null) {
										width = width[1];
										var height = html.match(/iframe[^>]+height="([1-9][0-9]*)"/);
										if (height !== null) {
											height = height[1];
											widget.setData( 'ratio', height / width * 100 );
										}
									}
								}

								// filter html
								html = editor.dataProcessor.toHtml( html );
								html = editor.dataProcessor.toDataFormat( html );

								widget.setData( 'html', html );
							}
						}]
					}]
				};
			});
		}
	});
})();
