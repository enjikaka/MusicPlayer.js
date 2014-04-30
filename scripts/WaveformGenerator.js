window.waveformCanvas = document.createElement('canvas');
window.waveformCanvasContext = window.waveformCanvas.getContext('2d');
window.AudioContext = window.AudioContext||window.webkitAudioContext;

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}


/* BufferLoader */

BufferLoader.prototype.loadBuffer = function(url, index) {
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";
  var loader = this;
  request.onload = function() {
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }
  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }
  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}

/* End BufferLoader */

function WaveformGenerator(file,width,height,color,retFunc) {
	localStorage.setItem('color', color);
	window.waveformCanvas.width = width;
	window.waveformCanvas.height = height;
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
		end = i + 10;
		res = [];
		while (i < end) {
			pos = i * len;
			out(i, WaveformGenerator.bufferMeasure(pos, pos + len, buffer));
			i++;
			if (i >= sections) {
				clearInterval(inv);
				break;
			} else {
				res.push(void 0);
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
	return ctx.fillRect(i, window.waveformCanvas.height / 2 - h / 2, 1, h);
};