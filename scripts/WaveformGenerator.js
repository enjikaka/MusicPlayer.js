window.waveformCanvas = document.createElement('canvas');
window.waveformCanvasContext = window.waveformCanvas.getContext('2d');
window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.waveformBarWidth = 1;
window.waveformBarGap = 0;
window.waveformBarAlign = 0;
window.svg = null;

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
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
	};
	xhr.send();
};

BufferLoader.prototype.load = function() {
	for (var i = 0; i < this.urlList.length; ++i) {
		this.loadBuffer(this.urlList[i], i);
	}
};

function WaveformGenerator(file,width,height,color,barWidth,gapWidth,align,retFunc) {
	barWidth=parseInt(barWidth);
	gapWidth=parseFloat(gapWidth);
	color=(color !== undefined ? color : 'black');
	window.waveformCanvas.width = width;
	window.waveformCanvas.height = height;
	window.waveformBarWidth = barWidth;
	window.waveformBarGap = gapWidth;
	window.waveformBarAlign = align;
	window.waveformBarColor = color;
	window.retFunc = retFunc;
	window.svg = document.createElement('svg');
	window.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	window.svg.setAttribute('version', '1.1');
	var svgStyleSheet = document.createElement('style');
	svgStyleSheet.setAttribute('type', 'text/css');
	var sssc = document.createTextNode('<![CDATA[');
	sssc.textContent += 'path {stroke:'+color+';stroke-width:'+((barWidth !== 0) ? (barWidth * Math.abs(1 - gapWidth)) : barWidth)+'}]]>';
	svgStyleSheet.appendChild(sssc);
	window.svg.appendChild(svgStyleSheet);
	window.svg.setAttributeNS('http://www.w3.org/2000/svg', 'viewBox', '0 0 ' + width + ' ' + height);
	window.waveformContext = new AudioContext();
	var bufferLoader = new BufferLoader(window.waveformContext,[file],function(bufferList) {
		var source = window.waveformContext.createBufferSource();
		source.buffer = bufferList[0];
		window.waveformBuffer = bufferList[0];
		WaveformGenerator.bufferExtract(window.waveformCanvas.width, WaveformGenerator.drawBar);
	});
	bufferLoader.load();
}

WaveformGenerator.bufferExtract = function(sections, out) {
	var buffer = window.waveformBuffer.getChannelData(0);
	var inv, len = Math.floor(buffer.length / sections), i = 0;
	var f = function() {
		var end = len, pos, res;
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
			window.retFunc(window.waveformCanvas.toDataURL(), 'data:image/svg+xml;base64,' + btoa(window.svg.outerHTML));
		}
		return res;
	};
	inv = setInterval(f, 1);
	return inv;
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
	ctx.fillStyle = window.waveformBarColor;
	var h;
	console.log('val:' + val);
	h = val * 50 * window.waveformCanvas.height;
	var barWidth = window.waveformBarWidth;
	if (window.waveformBarGap !== 0) {
		barWidth *= Math.abs(1 - window.waveformBarGap);
	}
	var x = i + (barWidth / 2), y = window.waveformCanvas.height - h;
	var path = document.createElement('path');
	if (window.waveformBarAlign === 1) {
		path.setAttribute('d','M'+x+' '+y+' L'+parseFloat(x)+' '+y+' L'+x+' '+parseFloat(y+h)+' L'+x+' '+parseFloat(y+h)+' L'+x+' '+y+' Z');
		
	} else {
		y = window.waveformCanvas.height / 2 - h / 2;
		path.setAttribute('d','M'+x+' '+y+' L'+parseFloat(x)+' '+y+' L'+x+' '+parseFloat(y+h)+' L'+x+' '+parseFloat(y+h)+' L'+x+' '+y+' Z');
	}
	window.svg.appendChild(path);
	return ctx.fillRect(i, y, barWidth, h);
};