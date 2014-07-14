window.waveformCanvas = document.createElement('canvas');
window.waveformCanvasContext = window.waveformCanvas.getContext('2d');
window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.waveformBarWidth = 1;
window.waveformBarGap = 0;

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'arraybuffer';
	var loader = this;
	xhr.onload = function() {
		loader.context.decodeAudioData(
			xhr.response,
			function(buffer) {
				if (!buffer) {
					console.error('Error decoding file data: ' + url);
					return;
			}
			loader.bufferList[index] = buffer;
			if (++loader.loadCount == loader.urlList.length)
				loader.onload(loader.bufferList);
			},
			function(error) {
				console.error('DecodeAudioData error', error);
			}
		);
	};
	xhr.onerror = function() {
		console.error('BufferLoader: XHR error');
	}
	xhr.send();
}

BufferLoader.prototype.load = function() {
	for (var i = 0; i < this.urlList.length; ++i) {
		this.loadBuffer(this.urlList[i], i);
	}
}

function WaveformGenerator(file,width,height,color,barWidth,gaps,retFunc) {
	localStorage.setItem('color', color);
	window.waveformCanvas.width = width;
	window.waveformCanvas.height = height;
	window.waveformBarWidth = parseInt(barWidth);
	window.waveformBarGap = parseFloat(gaps);
	window.retFunc = retFunc;
	window.waveformContext = new AudioContext();
	var bufferLoader = new BufferLoader(window.waveformContext,[file],function(bufferList) {
		var source = window.waveformContext.createBufferSource();
		source.buffer = bufferList[0];
		window.waveformBuffer = bufferList[0];
		WaveformGenerator.bufferExtract(window.waveformCanvas.width, WaveformGenerator.drawBar);
	});
	bufferLoader.load();
};

WaveformGenerator.bufferExtract = function(sections, out) {
	var buffer = window.waveformBuffer.getChannelData(0);
	var inv, len = Math.floor(buffer.length / sections);
	var i = 0;
	var f = function() {
		var end, pos, res;
		end = len;
		console.log(end);
		while (i < end) {
			pos = i * len;
			out(i, WaveformGenerator.bufferMeasure(pos, pos + len, buffer));
			i += window.waveformBarWidth;
			if (i >= sections) {
				clearInterval(inv);
				break;
			}
		}
		if (i == sections) {
			window.retFunc(window.waveformCanvas.toDataURL());
		}
		return res;
	};
	return inv = setInterval(f, 1);
};

WaveformGenerator.bufferMeasure = function(a, b, data) {
	var i, s, sum = 0.0, ref;
	for (i = a, ref = b - 1; a <= ref ? i <= ref : i >= ref; a <= ref ? i++ : i--) {
		s = data[i];
		sum += s * s;
	}
	return Math.sqrt(sum / data.length);
};

WaveformGenerator.drawBar = function(i, val) {
	var ctx = window.waveformCanvasContext;
	var ccl = localStorage.getItem('color');
	ctx.fillStyle = ccl !== undefined ? ccl : 'black';
	var h;
	h = val * 50 * window.waveformCanvas.height;
	var barWidth = window.waveformBarWidth;
	if (window.waveformBarGap !== 0) {
		barWidth *= Math.abs(1 - window.waveformBarGap);
	} 
	return ctx.fillRect(i, window.waveformCanvas.height / 2 - h / 2, barWidth, h);
};