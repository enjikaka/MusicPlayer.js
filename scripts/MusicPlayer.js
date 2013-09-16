var MusicPlayer = {
	debug: true,
	settings: {
		player: '#player',
		isSetting: function(key) {
			return MusicPlayer.settings[key] !== undefined;
		},
		elements: {
			button: {
				play: '#play',
				stop: '#stop',
				next: '#next',
				previous: '#previous',
				open: '#open-file',
				volumeDown: '#volume-down',
				volumeUp: '#volume-up'
			},
			info: {
				cover: '#album-art',
				title: '#song-title',
				artist: '#song-artist',
				album: '#song-album'
			},
			playbar: '#playbar',
			progress: {
				currentTime: '#current-time',
				totalTime: '#total-time'
			}
		},
		volumeIncreaseFactor: 8,
		volumeChangeFactor: 'width', // Width, height or value.
		playbarChangeFactor: 'width' // Width, height or value.
	},
	get: function() {
		return $(MusicPlayer.settings.player)[0];
	},
	play: function() {
		if (MusicPlayer.get().currentSrc == "") {
			// No music file loaded
			if (MusicPlayer.debug) {
				console.error('Cannot play');
			}
			return;
		}

		if (MusicPlayer.get().paused) {
			MusicPlayer.get().play();
		} else {
			MusicPlayer.get().pause();
		}
	},
	stop: function() {
		MusicPlayer.get().pause();
		MusicPlayer.get().currentTime = 0;
	},
	next: function() {
		console.log('Next');
	},
	previous: function() {
		console.log('Previous');
	},
	selectFile: function() {
		console.log('Open file');
	},
	volume: {
		down: function() {
			MusicPlayer.get().volume = MusicPlayer.get().volume - (MusicPlayer.volumeIncreaseFactor / 100);
		},
		up: function() {
			MusicPlayer.get().volume = MusicPlayer.get().volume - (MusicPlayer.volumeIncreaseFactor / 100);
		},
		set: function(perc) {
			MusicPlayer.get().volume = (perc / 100);
		}
	},
	handler: {
		play: function(e) {
			if (MusicPlayer.debug) {
				console.debug('The audio has been started or is no longer paused.');
			}

			$(MusicPlayer.settings.elements.button.play).removeClass('paused');
		},
		pause: function(e) {
			if (MusicPlayer.debug) {
				console.debug('The audio has been paused.');
			}

			$(MusicPlayer.settings.elements.button.play).addClass('paused');
		},
		seeked: function(e) {
			if (MusicPlayer.debug) {
				console.debug('Finished moving to a new position in the audio.');
				console.debug('New position: ' + MusicPlayer.get().currentTime);
			}
		},
		seeking: function(e) {
			if (MusicPlayer.debug) {
				console.debug('Started moving to a new position in the audio.');
			}
		},
		stalled: function(e) {
			if (MusicPlayer.debug) {
				console.debug('The browser is trying to get media data, but data is not available.');
			}
		},
		suspend: function(e) {
			if (MusicPlayer.debug) {
				console.debug('The browser is intentionally not getting media data.');
			}
		},
		volumechange: function(e) {
			if (MusicPlayer.debug) {
				console.debug('The volume of the audio was changed to ' + (MusicPlayer.get().volume * 100) + '%');
			}
		}
	},
	init: function(settingsObject) {
		// Settings
		if (!$.isPlainObject(settingsObject)) {
			if (MusicPlayer.debug) {
				console.error('No settings-object available.');
			}
			return;
		}
		var setValues = 0;
		$.each(settingsObject, function(index, item) {
			if (index == "debug" && $.type(item) == 'boolean') {
				if (MusicPlayer.debug) {
					console.debug('Debug mode: ' + item);
					setValues += 1;
					return;
				}
			}
			if (MusicPlayer.settings.isSetting(index)) {
				MusicPlayer.settings[index] = item;
				setValues += 1;
				if (MusicPlayer.debug) {
					console.debug('Key "' + index + '"" in settings was updated to "' + item + '".');
				}
			} else {
				console.error('Key "' + index + '" is not a valid key for the settings-object and was ignored.');
			}
		});
		if (setValues !== 0) {
			//(sessionStorage.setItem('inited', true);
		} else if (setValues == 0) {
			if (MusicPlayer.debug) {
				console.warn('You ran init() without any valid keys.');
				console.debug('MusicPlayer is running with all default settings.');
			}
		}
		// End of Settings
	}
};

$(window).on('load', function() {
	console.log('~ Using MusicPlayer.js from Jeremy Karlsson (@enjikaka) ~');
	console.log('  http://enji.se - http://twitter.com/enjikaka - http://github.com/enjikaka');
	console.log('  Thanks for using this Open Source product licenced under the\n  Creative Commons Attribution-ShareAlike 3.0 Generic Licence (CC BY-SA 3.0).');

	// Bind Events

	var elements = MusicPlayer.settings.elements;
	$(elements.button.play).on('click',MusicPlayer.play);
	$(elements.button.stop).on('click',MusicPlayer.stop);
	$(elements.button.next).on('click',MusicPlayer.next);
	$(elements.button.previous).on('click',MusicPlayer.previous);
	$(elements.button.open).on('click',MusicPlayer.selectFile);
	$(elements.button.volumeUp).on('click',MusicPlayer.volume.up);
	$(elements.button.volumeDown).on('click',MusicPlayer.volume.down);

	$(MusicPlayer.settings.player).on('play',MusicPlayer.handler.play);
	$(MusicPlayer.settings.player).on('pause',MusicPlayer.handler.pause);
	$(MusicPlayer.settings.player).on('seeking',MusicPlayer.handler.seeking);
	$(MusicPlayer.settings.player).on('seeked',MusicPlayer.handler.seeked);
	$(MusicPlayer.settings.player).on('stalled',MusicPlayer.handler.stalled);
	$(MusicPlayer.settings.player).on('suspend',MusicPlayer.handler.suspend);
	$(MusicPlayer.settings.player).on('volumechange',MusicPlayer.handler.volumechange);

	// End of Bind Events
});