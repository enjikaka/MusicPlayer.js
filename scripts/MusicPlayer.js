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
			}
		},
		volumeIncreaseFactor: 8
	},
	tmp: {
		mouseIsDown: false
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
		},
		canPlayThrough: function(e) {
			if (MusicPlayer.debug) {
				console.debug('The audio can now be played through.');
			}
		},
		mouseDown: function(e) {
			// Is progressbar?
			if (MusicPlayer.handler.verifyProgressBar(e.target)) {
				MusicPlayer.tmp.mouseIsDown = true;
				MusicPlayer.tmp.wasPlaying = !MusicPlayer.get().paused;
				console.log('DOWN: ' + MusicPlayer.handler.getRelativePerc(e));
			}
		},
		mouseMove: function(e) {
			if (MusicPlayer.handler.verifyProgressBar(e.target)) {
				if (MusicPlayer.tmp.mouseIsDown) {
					if (e.target.nodeName == "PROGRESS") {
						$(e.target).val(MusicPlayer.handler.getRelativePerc(e));
					} else {
						var pb = MusicPlayer.settings.elements.progress.progressBar;
						pb = pb.substring(1,pb.length);
						if (e.target.classList.contains(pb)) {
							$(e.target).css('width', MusicPlayer.handler.getRelativePerc(e) + '%');
						} else {
							$($(e.target).children()[0]).css('width', MusicPlayer.handler.getRelativePerc(e) + '%');
						}
					}
				}
			}
		},
		mouseUp: function(e) {
			if (MusicPlayer.handler.verifyProgressBar(e.target)) {
				MusicPlayer.tmp.mouseIsDown = false;
				//MusicPlayer.get().pause();
				MusicPlayer.get().currentTime = MusicPlayer.get().duration * MusicPlayer.handler.getRelativePerc(e);
				console.log('This should be the new time ' + MusicPlayer.get().duration * MusicPlayer.handler.getRelativePerc(e));
				if (MusicPlayer.tmp.wasPlaying) {
					MusicPlayer.get().play();
				}
			}
		},
		verifyProgressBar: function(target) {
			var pb = MusicPlayer.settings.elements.progress.progressBar;
			pb = pb.substring(1,pb.length);
			if ((target.classList.contains(pb) || target.id == pb) && target.nodeName == "PROGRESS") {
				return true;
			} else if (target.nodeName !== "PROGRESS") {
				if (target.classList.contains(pb) || target.id == pb) {
					return true;
				} else {
					var fchild = $(target).children()[0];
					if (fchild !== undefined && $(fchild).nodeName !== "PROGRESS") {
						var classes = fchild.classList;
						if ((classes !== undefined && classes.length > 0 && classes.contains(pb)) || fchild.id == pb) {
							return true;
						}
					}
				}
			}
			return false;
		},
		getRelativePerc: function(mouse) {
			var xpt = mouse.pageX - $(mouse.target).offset().left;
			var width = $(mouse.target).offset().width;
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

	console.dir(MusicPlayer.handler);

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