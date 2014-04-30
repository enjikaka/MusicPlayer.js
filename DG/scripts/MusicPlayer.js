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
	currentSong: {
		title: null,
		artist: null,
		album: null,
		year: null,
		track: null,
		comment: null,
		genre: null,
		picture: null,
		lyrics: null
	},
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
			fileOpener: '#file-opener',
			info: {
				loadedFile: '#loaded-file',
				title:'#song-title',
				artist:'#song-artist',
				album:'#song-album',
				year:'#song-year',
				comment:'#song-comment',
				track:'#song-track',
				comment:'#song-comment',
				genre:'#song-genre',
				picture:'#song-picture',
				lyrics:'#song-lyrics'
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
		mouseIsDown: false,
		loading: false
	},
	loading: {
		start: function() {
			$('body').addClass('loading');
			MusicPlayer.tmp.loading = true;
			if (MusicPlayer.debug) {
				console.debug('Loading...');
			}
		},
		end: function() {
			$('body').removeClass('loading');
			MusicPlayer.tmp.loading = false;
			console.debug('Done loading.');
		}
	},
	getInfoFromFilename: function(name,a) {
		name = name == null ? 'Unkown' : name;
		name = name.replace(/_/g,' ');
		var artist = artist == null ? 'Unkown' : artist;
		if (name.indexOf(' - ') !== -1) {
			name = name.split(' - ');
			artist = name[0];
			name = name[1];
		}
		name = name.split('.')[0];
		switch (a) {
			case 'a':
				return artist;
				break;
			default:
				return name;
				break;
		}
	},
	clearMetadataFromDOM: function() {
		$(MusicPlayer.settings.elements.info.title).html(null);
	    $(MusicPlayer.settings.elements.info.artist).html(null);
	    $(MusicPlayer.settings.elements.info.album).html(null);
	    $(MusicPlayer.settings.elements.info.year).html(null);
	    $(MusicPlayer.settings.elements.info.comment).html(null);
	    $(MusicPlayer.settings.elements.info.track).html(null);
	    $(MusicPlayer.settings.elements.info.genre).html(null);
	    $(MusicPlayer.settings.elements.info.lyrics).html(null);
	},
	readMetadata: function(url, filename) {
		MusicPlayer.clearMetadataFromDOM();
		var tags = new ID3.getAllTags(url);
	    var artist = tags.artist;
	    var title = tags.title;
	    var fn = filename;
	    $(MusicPlayer.settings.elements.info.album).html(tags.album);
	    $(MusicPlayer.settings.elements.info.year).html(tags.year);
	    $(MusicPlayer.settings.elements.info.comment).html(tags.comment);
	    $(MusicPlayer.settings.elements.info.track).html(tags.track);
	    $(MusicPlayer.settings.elements.info.genre).html(tags.genre);
	    $(MusicPlayer.settings.elements.info.lyrics).html(tags.lyrics);
	    if (title === undefined) {
	        $(MusicPlayer.settings.elements.info.title).html(MusicPlayer.getInfoFromFilename(fn,'n'));
	    } else {
	    	$(MusicPlayer.settings.elements.info.title).html(tags.title);
	    }
	    if (artist === undefined) {
	        $(MusicPlayer.settings.elements.info.artist).html(MusicPlayer.getInfoFromFilename(fn,'a'));
	    } else {
	    	 $(MusicPlayer.settings.elements.info.artist).html(tags.artist);
	    }
	    var image = tags.picture;
	    if (image) {
	        var base64 = "data:" + image.format + ";base64," + Base64.encodeBytes(image.data);
	        $('img').attr('src',base64);
	    }
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
	open: function() {
		if (MusicPlayer.debug) {
			console.debug('Open file.');
		}
		if (window.File && window.FileReader && window.FileList && window.Blob) {
			$(MusicPlayer.settings.elements.fileOpener).click();
		} else {
			if (MusicPlayer.debug) {
  				console.error('The File APIs are not fully supported in this browser.');
  			}
		}
	},
	load: function(url) {
		console.debug('Loading file...');
		var wasPlaying = false;
		if (!MusicPlayer.get().paused) {
			MusicPlayer.play();
			wasPlaying = true;
		}
		MusicPlayer.get().src = url;
		if (wasPlaying) {
			MusicPlayer.play();
		}
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
		fileSelect: function(e) {
			var files = e.target.files;
			MusicPlayer.loading.start();
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				if (file.type.match('audio.*')) {
					if (MusicPlayer.debug) {
						console.debug('Reading file.');
					}
					var reader = new FileReader();
					reader.onload = (function(theFile) {
						return function(e) {
							MusicPlayer.load(e.target.result);
							$(MusicPlayer.settings.elements.info.loadedFile).html(theFile.name);
						};
					})(file);
					reader.readAsDataURL(file);

					if (MusicPlayer.debug) {
						console.debug('Checking for ID3 tags.');
					}
					var tagReader = new FileReader();
					tagReader.onloadend = function(e) {
			            ID3.loadTags(file.urn, function() {
			                MusicPlayer.readMetadata(file.urn, file.name);
			            }, {
			                tags: ["title","artist","picture","album","year"],
			                dataReader: FileAPIReader(file)
			            });
			        };
					tagReader.readAsDataURL(file);
				} else {
					console.error('Not an audio file.');
				}
			}
		},
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
			MusicPlayer.loading.end();
			$(MusicPlayer.settings.elements.progress.totalTime).html(Time.format(MusicPlayer.get().duration));
			$(MusicPlayer.settings.elements.loading.loadingContainer).addClass('done-loading');
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
			if (!MusicPlayer.tmp.mouseIsDown) return;

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
			MusicPlayer.tmp.mouseIsDown = false;

			// Is progressbar?
			if (MusicPlayer.handler.verifyBar(MusicPlayer.settings.elements.progress.progressBar,e.target)) {
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
		mouseOut: function(e) {
			MusicPlayer.tmp.mouseIsDown = false;
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
		MusicPlayer.volume.set(MusicPlayer.settings.volume);
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

	$(MusicPlayer.settings.elements.button.open).on('click',MusicPlayer.open);
	$(MusicPlayer.settings.elements.fileOpener).on('change',MusicPlayer.handler.fileSelect);

	$(document).on('mousedown',MusicPlayer.handler.mouseDown);
	$(document).on('mouseup',MusicPlayer.handler.mouseUp);
	$(document).on('mousemove',MusicPlayer.handler.mouseMove);
	// End of Bind Events

	MusicPlayer.load('test.mp3');
});