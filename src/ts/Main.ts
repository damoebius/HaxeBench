/// <reference path="ScreenPressor.ts" />


class Main
{
	static X = 960;
	static Y = 540;

	static main()
	{
		var txt = document.getElementById("txt")!;
		txt.innerHTML = "sss";
		var r = new XMLHttpRequest();
		r.onload = _ => {
			var buf : ArrayBuffer = r.response;
			txt.innerHTML = "received " + buf.byteLength;
			var btn = document.getElementById("btn")!;
			btn.onclick = _ => {
				var bytes = new Uint8Array(buf, 4);
				var sp = new ScreenPressor(Main.X, Main.Y);
				var dst = new Int32Array(Main.X * Main.Y);
				var inp : HTMLInputElement = document.getElementById("N") as  HTMLInputElement;
				var N = parseInt( inp.value );
				if (N < 0 || N > 1000) {
					txt.innerHTML = "You must be joking!"; return;
				}
				txt.innerHTML = "Decompressing " + N + " times...";
				Main.clearImg();
				setTimeout(_ => {
          console.log("sssss");
					var t0 = Date.now();
					for(let n=0; n<N; n++){
            sp.DecompressI(bytes, dst);
          }
					var t1 = Date.now();
					txt.innerHTML += " t=" + (t1 - t0);
					Main.showImg(dst);
				}, 20);
			}
		};
		r.open("GET", "blow.spi", true);
		r.responseType = "arraybuffer";
		r.send();
	}

	static clearImg():void
	{
		var m = document.getElementById("main")!;
		while (m.lastChild) m.removeChild(m.lastChild);
	}

	static showImg(pic:Int32Array):void
	{
		var m = document.getElementById("main")!;
		var c = document.createElement("canvas");
    var ctx = c.getContext("2d")!;
		c.width = Main.X;
    c.height = Main.Y;
		m.appendChild(c);
		var imagedata = ctx.getImageData(0, 0, Main.X, Main.Y);
		var data = imagedata.data;
    var picbytes = new Uint8ClampedArray(pic.buffer);
    var l = Main.X*Main.Y;
    for (let i=0; i<l; i++) {
      data[i*4+0] = picbytes[i*4+0];
			data[i*4+1] = picbytes[i*4+1];
			data[i*4+2] = picbytes[i*4+2];
			data[i*4+3] = 255;
    }
		ctx.putImageData(imagedata, 0, 0);
	}
}




Main.main();
