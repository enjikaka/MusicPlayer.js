window.waveformCanvas = document.createElement('canvas');
window.waveformCanvasContext = window.waveformCanvas.getContext('2d');
window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.waveformContext = new AudioContext();
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
				if (++loader.loadCount == loader.urlList.length) {
					loader.onload(loader.bufferList);
				}	
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

function Waveform(file,width,height,color,barWidth,gapWidth,align,retFunc) {
	color = (color !== undefined ? color : 'black');
	window.waveformCanvas.width = width;
	window.waveformCanvas.height = height;
	window.waveformBarWidth = parseInt(barWidth);
	window.waveformBarGap = parseFloat(gapWidth);
	window.waveformBarAlign = parseInt(align);
	window.waveformBarColor = color;
	window.retFunc = retFunc;

	window.svg = document.createElement('svg');
	window.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	window.svg.setAttribute('version', '1.1');
	var svgStyleSheet = document.createElement('style');
	svgStyleSheet.setAttribute('type', 'text/css');
	var sssc = document.createTextNode('<![CDATA[path{stroke:' + color + ';stroke-width:' + ((barWidth !== 0) ? (barWidth * Math.abs(1 - gapWidth)) : barWidth) + '}]]>');
	svgStyleSheet.appendChild(sssc);
	window.svg.appendChild(svgStyleSheet);
	window.svg.setAttributeNS(null, 'viewBox', '0 0 ' + width + ' ' + height);

	var bufferLoader = new BufferLoader(window.waveformContext, [file], function(bufferList) {
		var source = window.waveformContext.createBufferSource();
		source.buffer = bufferList[0];
		window.waveformBuffer = bufferList[0];
		Waveform.bufferExtract(window.waveformCanvas.width);
	});
	bufferLoader.load();
}

Waveform.bufferExtract = function(sections, out) {
	var buffer = window.waveformBuffer.getChannelData(0);
	var len = Math.floor(buffer.length / sections);
	for (var i = 0; i < sections; i += window.waveformBarWidth) {
		var pos = i * len;
		Waveform.drawBar(i, Waveform.bufferMeasure(pos, pos + len, buffer));
	}
	if (i >= sections) {
		window.retFunc(window.waveformCanvas.toDataURL(), 'data:image/svg+xml;base64,' + btoa('<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">') + btoa(window.svg.outerHTML));
	}
};

Waveform.bufferMeasure = function(a, b, data) {
	var sum = 0.0, ref;
	for (var i = a, ref = b - 1; a <= ref ? i <= ref : i >= ref; a <= ref ? i++ : i--) {
		sum += Math.pow(data[i],2);
	}
	return Math.sqrt(sum / data.length);
};

Waveform.drawBar = function(i, val) {
	var ctx = window.waveformCanvasContext;
	ctx.fillStyle = window.waveformBarColor;
	var h = val * 40 * window.waveformCanvas.height, w = window.waveformBarWidth;
	if (window.waveformBarGap !== 0) {
		w *= Math.abs(1 - window.waveformBarGap);
	}
	var x = i + (w / 2), y = window.waveformCanvas.height - h, path = document.createElement('path');
	y = (window.waveformBarAlign !== 1) ? window.waveformCanvas.height / 2 - h / 2 : y;
	path.setAttribute('d','M'+x+' '+y+' L'+x+' '+y+' L'+x+' '+(y+h)+' L'+x+' '+(y+h)+' L'+x+' '+y+' Z');
	window.svg.appendChild(path);
	return ctx.fillRect(i, y, w, h);
};