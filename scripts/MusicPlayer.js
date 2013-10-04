var Time = {
	format: function(s) {
		s = Math.floor(s);
	    var m = Math.floor(s / 60);
	    m = m >= 10 ? m : +m;
	    s = Math.floor(s % 60);
	    s = s >= 10 ? s : '0' + s;
	    var sm = m + ':' + s;
	    return sm;
	},
	seconds: function(f) {
		f = f.split(':');
		return (parseInt(f[0]) * 60) + parseInt(f[1]);
	}
};

var MusicPlayer = {
	debug: true,
	settings: {
		player: '#player',
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
			progress: {
				currentTime: '#current-time',
				totalTime: '#total-time',
				progressBar: '#progress-bar',
				progressHolder: '#progressbar-holder'
			},
			volume: {
				volumeHolder: '#volume-holder',
				volumeBar: '#volume-bar'
			},
			loading: {
				loadingHolder: '#loading-holder',
				loadingBar: '#loading-bar',
				loadingContainer: '#loading-container'
			}
		},
		volumeIncreaseFactor: 8,
		volume: 80
	},
	tmp: {
		mouseIsDown: false
	},
	match: function(target, query) {
		var q = query.substring(1,query.length);
		if (target.classList.contains(q) || target.id == q) {
			return true;
		}
		return false;
	},
	get: function() {
		return $(MusicPlayer.settings.player)[0];
	},
	play: function() {
		if (MusicPlayer.get().currentSrc == "") {
			// No music file loaded
			if (MusicPlayer.debug) {
				console.error('Cannot play audio. There is not source.');
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
	load: function(url) {
		console.log('Loading file: ' + url);
		MusicPlayer.get().src = url;
	},
	durationPercent: function() {
		return ((MusicPlayer.get().currentTime / MusicPlayer.get().duration) * 100);
	},
	volume: {
		down: function() {
			MusicPlayer.volume.set((MusicPlayer.get().volume - (MusicPlayer.settings.volumeIncreaseFactor / 100)) * 100);
		},
		up: function() {
			MusicPlayer.volume.set((MusicPlayer.get().volume + (MusicPlayer.settings.volumeIncreaseFactor / 100)) * 100);
		},
		set: function(perc) {
			perc = perc > 100 ? 100 : perc;
			perc = perc < 0 ? 0 : perc;
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
		volumeChange: function(e) {
			if (MusicPlayer.debug) {
				console.debug('The volume of the audio was changed to ' + (MusicPlayer.get().volume * 100) + '%');
			}
			var volumeBars = $(MusicPlayer.settings.elements.volume.volumeBar);
			$.each(volumeBars, function(pb) {
				var vBar = volumeBars[pb];
				console.log(vBar);
				if (vBar.nodeName == "PROGRESS") {
					$(vBar).attr('max',100);
					$(vBar).val(MusicPlayer.get().volume * 100);
				} else {
					$(vBar).css('width', MusicPlayer.get().volume * 100 + '%');
				}
			});
		},
		timeUpdate: function(e) {

			$(MusicPlayer.settings.elements.progress.currentTime).html(Time.format(MusicPlayer.get().currentTime));
		
			if (MusicPlayer.tmp.mouseIsDown) {
				return;
			}

			var progressBars = $(MusicPlayer.settings.elements.progress.progressBar);
			$.each(progressBars, function(pb) {
				var progressBar = progressBars[pb];
				if (progressBar.nodeName == "PROGRESS") {
					$(progressBar).attr('max',100);
					$(progressBar).val(MusicPlayer.durationPercent());
				} else {
					$(progressBar).css('width', MusicPlayer.durationPercent() + '%');
				}
			});
		},
		canPlay: function(e) {
			if (MusicPlayer.debug) {
				console.debug('The audio can now be played.');
			}
			$(MusicPlayer.settings.elements.progress.totalTime).html(Time.format(MusicPlayer.get().duration));
			$(MusicPlayer.settings.elements.loading.loadingContainer).addClass('done-loading');
			MusicPlayer.volume.set(MusicPlayer.settings.volume);
		},
		canPlayThrough: function(e) {
			if (MusicPlayer.debug) {
				console.debug('The audio can now be played through.');
			}
		},
		mouseDown: function(e) {
			// Is progressbar?
			if (MusicPlayer.handler.verifyBar(MusicPlayer.settings.elements.progress.progressBar,e.target)) {
				MusicPlayer.tmp.mouseIsDown = true;
				MusicPlayer.tmp.wasPlaying = !MusicPlayer.get().paused;
			}

			// Is volumebar?
			if (MusicPlayer.handler.verifyBar(MusicPlayer.settings.elements.volume.volumeBar,e.target)) {
				MusicPlayer.tmp.mouseIsDown = true;
			}
		},
		mouseMove: function(e) {
			// Is progressbar?
			if (MusicPlayer.handler.verifyBar(MusicPlayer.settings.elements.progress.progressBar,e.target)) {
				if (MusicPlayer.tmp.mouseIsDown) {
					if (e.target.nodeName == "PROGRESS") {
						$(e.target).val(MusicPlayer.handler.getRelativePerc(e));
					} else {
						if (MusicPlayer.match(e.target, MusicPlayer.settings.elements.progress.progressBar)) {
							$(e.target).css('width', MusicPlayer.handler.getRelativePerc(e) + '%');
						} else {
							$($(e.target).children()[0]).css('width', MusicPlayer.handler.getRelativePerc(e) + '%');
						}
					}
				}
			}

			// Is volumebar?
			if (MusicPlayer.handler.verifyBar(MusicPlayer.settings.elements.volume.volumeBar,e.target)) {
				if (MusicPlayer.tmp.mouseIsDown) {
					if (e.target.nodeName == "PROGRESS") {
						$(e.target).val(MusicPlayer.handler.getRelativePerc(e));
					} else {
						if (MusicPlayer.match(e.target, MusicPlayer.settings.elements.volume.volumeBar)) {
							$(e.target).css('width', MusicPlayer.handler.getRelativePerc(e) + '%');
						} else {
							$($(e.target).children()[0]).css('width', MusicPlayer.handler.getRelativePerc(e) + '%');
						}
					}
				}
			}
		},
		mouseUp: function(e) {
			// Is progressbar?
			if (MusicPlayer.handler.verifyBar(MusicPlayer.settings.elements.progress.progressBar,e.target)) {
				MusicPlayer.tmp.mouseIsDown = false;
				MusicPlayer.tmp.wasPlaying = !MusicPlayer.get().paused;
				var perc = (MusicPlayer.handler.getRelativePerc(e) / 100);
				MusicPlayer.get().currentTime = MusicPlayer.get().duration * perc;
				if (MusicPlayer.tmp.wasPlaying) {
					MusicPlayer.get().play();
				}
			}

			// Is volumebar?
			if (MusicPlayer.handler.verifyBar(MusicPlayer.settings.elements.volume.volumeBar,e.target)) {
				MusicPlayer.tmp.mouseIsDown = false;
				MusicPlayer.volume.set(MusicPlayer.handler.getRelativePerc(e));
			}
		},
		verifyBar: function(which,target) {
			if (MusicPlayer.match(target, which) && target.nodeName == "PROGRESS") {
				return true;
			} else if (target.nodeName !== "PROGRESS") {
				if (MusicPlayer.match(target, which)) {
					return true;
				} else {
					var fchild = $(target).children()[0];
					if (fchild !== undefined && $(fchild).nodeName !== "PROGRESS" && MusicPlayer.match(fchild, which)) {
						return true;
					}
				}
			}
			return false;
		},
		getRelativePerc: function(mouse) {
			var target = mouse.target;
			if (target.nodeName !== "PROGRESS" && (MusicPlayer.match(target, MusicPlayer.settings.elements.progress.progressBar) || MusicPlayer.match(target, MusicPlayer.settings.elements.volume.volumeBar))) {
				target = target.parentNode;
			}
			var xpt = mouse.pageX - $(target).offset().left;
			var width = $(target).offset().width;
			return (xpt / width) * 100;
		}
	},
	init: function(settingsObject) {
		// Settings
		if (!$.isPlainObject(settingsObject)) {
			if (MusicPlayer.debug) {
				console.warn('No settings-object available. Using default settings.');
			}
			return;
		}
		$.extend(true, MusicPlayer.settings, settingsObject);
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
	$(MusicPlayer.settings.player).on('volumechange',MusicPlayer.handler.volumeChange);
	$(MusicPlayer.settings.player).on('timeupdate',MusicPlayer.handler.timeUpdate);
	$(MusicPlayer.settings.player).on('canplay',MusicPlayer.handler.canPlay);
	$(MusicPlayer.settings.player).on('canplaythrough',MusicPlayer.handler.canPlay);

	$(document).on('mousedown',MusicPlayer.handler.mouseDown);
	$(document).on('mouseup',MusicPlayer.handler.mouseUp);
	$(document).on('mousemove',MusicPlayer.handler.mouseMove);
	// End of Bind Events

	MusicPlayer.load('test.mp3');
});