package haxe;

import js.html.XMLHttpRequestResponseType;
import js.Browser;
import js.html.Document;
import js.html.InputElement;
import js.html.Int32Array;
import js.html.XMLHttpRequest;
import js.html.ArrayBuffer;
import js.html.Uint8Array;
import js.html.CanvasElement;
import haxe.Timer;
import haxe.ScreenPressor;

class Main 
{
	static inline var X = 960;
	static inline var Y = 540;
	
	static function main() 
	{
		var txt = js.Browser.document.getElementById("txt");
		txt.innerHTML = "sss";
		var r = new XMLHttpRequest();		
		r.onload = function(x : Dynamic) { 
			var buf : ArrayBuffer = r.response;
			txt.innerHTML = "received " + buf.byteLength;
			var btn = Browser.document.getElementById("btn");
			btn.onclick = function(e) {	
				var bytes = new Uint8Array(buf, 4);			
				var sp = new ScreenPressor(X, Y);
				var dst = new Int32Array(X * Y);
				var inp : InputElement = cast Browser.document.getElementById("N");
				var N = Std.parseInt( inp.value );
				if (N < 0 || N > 1000) {
					txt.innerHTML = "You must be joking!"; return;
				}
				txt.innerHTML = "Decompressing " + N + " times...";
				clearImg();
				Timer.delay( function() {
					var t0 = Timer.stamp();
					for(n in 0...N)
						sp.DecompressI(bytes, dst);    
					var t1 = Timer.stamp();
					txt.innerHTML += " t=" + (t1 - t0);
					showImg(dst);
				}, 20);
			}
		};
		r.open("GET", "blow.spi", true);
		r.responseType = XMLHttpRequestResponseType.ARRAYBUFFER;
		r.send();
	}
	
	static function clearImg():Void
	{
		var m = js.Browser.document.getElementById("main");
		while (m.lastChild != null) m.removeChild(m.lastChild);		
	}
	
	static function showImg(pic:Int32Array):Void 
	{
		var m = js.Browser.document.getElementById("main");
		var c = Browser.document.createCanvasElement();
		c.width = X; c.height = Y;
		m.appendChild(c);
		var imagedata = c.getContext2d().getImageData(0, 0, X, Y);
		var data = imagedata.data;
		var picbytes = new Uint8Array(pic.buffer);
		for(i in 0...X*Y) {
			data[i*4+0] = picbytes[i*4+0];
			data[i*4+1] = picbytes[i*4+1];
			data[i*4+2] = picbytes[i*4+2];
			data[i*4+3] = 255;
		}
		c.getContext2d().putImageData(imagedata, 0, 0);
	}
}