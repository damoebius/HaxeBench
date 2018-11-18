/// <reference path="RangeCoder.ts" />
class ScreenPressor
{
	static SC_STEP = 400;
	static SC_NSTEP = 400;
	static SC_CXSHIFT = 2;
	static SC_CXMAX = 4096;
	static SC_NCXMAX = 6;
	static SC_UNSTEP = 1000;
	static CNTABSZ = 273;

	X : number;
	Y : number;
	rc : RangeCoder;
	cntab : Uint32Array;
	ptypetab : Array<Uint32Array>;
	ntab : Array<Uint32Array>;

	constructor(width : number, height : number)
	{
		this.X = width; this.Y = height;
		this.rc = new RangeCoder();
		this.cntab = new Uint32Array(3 * 4096 * ScreenPressor.CNTABSZ);
		this.ptypetab = new Array<Uint32Array>();
		this.ntab = new Array<Uint32Array>();

		for(let i=0; i<6 ; i++) {
			this.ptypetab[i] = new Uint32Array(7);
			this.ntab[i] = new Uint32Array(257);
		}

		for (let chan=0; chan<3; chan++) {
			for (let ctx=0,len=ScreenPressor.SC_CXMAX;ctx<len; ctx++) {
				this.cntab[((chan << 12) + ctx) * ScreenPressor.CNTABSZ + 16] = 0;
      }
    }
	}

	public ReinitTabs():void
	{
		for (let chan=0;chan<3;chan++) {
			for (let ctx=0,len=ScreenPressor.SC_CXMAX; ctx<len; ctx++) {
				let p = ((chan << 12) + ctx) * ScreenPressor.CNTABSZ;
				if (this.cntab[p + 16] != 256) { //fill if changed
          for(let i=0;i<256;i++){
            this.cntab[p + i + 17] = 1;
          }
          for(let i=0;i<16;i++){
            this.cntab[p + i] = 16;
          }
          this.cntab[p + 16] = 256;
        }
      }
    }


		for (let ncx=0,len=ScreenPressor.SC_NCXMAX;ncx<len;ncx++) {
			let p2 = this.ntab[ncx];
			for(let i=0;i<256; i++){
        p2[i] = 1;
      }
			p2[256] = 256;
		}

		for (let ctx=0;ctx<6;ctx++) {
			let p3 = this.ptypetab[ctx];
			for(let i=0;i<6;i++){
        p3[i] = 1;
      }
			p3[6] = 6;
		}
	}

	public DecompressI(src:Uint8ClampedArray, dst:Int32Array):void
	{
		let end = this.X * this.Y;
		let di = 0, clr = 0, cx = 0, cx1 = 0, lasti = 0;

		if (src[0] != 0x12) {
				console.log("unknown version of the codec"); return;
		}
		this.ReinitTabs();
		this.rc.DecodeBegin(src, 1);
		let k = 0;

		while(k<this.X+1) {
			let r = this.rc.DecodeValUni(this.cntab, (cx+cx1)*ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
			cx1 = (cx<<6)&0xFC0;
			cx = r>>ScreenPressor.SC_CXSHIFT;
			let g = this.rc.DecodeValUni(this.cntab, (4096 + cx+cx1)*ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
			cx1 = (cx<<6)&0xFC0;
			cx = g>>ScreenPressor.SC_CXSHIFT;
			let b = this.rc.DecodeValUni(this.cntab, (2*4096 + cx+cx1)*ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
			cx1 = (cx<<6)&0xFC0;
			cx = b>>ScreenPressor.SC_CXSHIFT;

			let n = this.rc.DecodeVal(this.ntab[0], 256, ScreenPressor.SC_NSTEP);
			clr = (b << 16) + (g << 8) + r;
			k += n;
			while(n-->0) {
				dst[di] = clr;
				di++;
			}
			lasti = di - 1;
		}
		let off = -this.X - 1;
		let ptype = 0;
		let dstbytes = new Uint8ClampedArray(dst.buffer);

		while(di < end) {
			ptype = this.rc.DecodeVal(this.ptypetab[ptype], 6, ScreenPressor.SC_UNSTEP);
			if (ptype===0) {
				let r = this.rc.DecodeValUni(this.cntab, (cx+cx1)*ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
				cx1 = (cx<<6)&0xFC0;
				cx = r >> ScreenPressor.SC_CXSHIFT;
				let g = this.rc.DecodeValUni(this.cntab, (4096 + cx+cx1)*ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
				cx1 = (cx<<6)&0xFC0;
				cx = g >> ScreenPressor.SC_CXSHIFT;
				let b = this.rc.DecodeValUni(this.cntab, (2*4096 + cx+cx1)*ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
				cx1 = (cx<<6)&0xFC0;
				cx = b >> ScreenPressor.SC_CXSHIFT;
				clr = (b << 16) + (g << 8) + r;
			}
			let n = this.rc.DecodeVal(this.ntab[ptype], 256, ScreenPressor.SC_NSTEP);
			switch (ptype) {
				case 0:
					while (n-->0) {
						dst[di++] = clr;
					}
					lasti = di - 1;
				case 1:
					while (n-->0) {
						dst[di] = dst[lasti]; lasti = di; di++;
					}
					clr = dst[lasti];
				case 2:
					while (n-->0) {
						clr = dst[di + off + 1];
						dst[di] = clr; di++;
					}
					lasti = di - 1;
				case 4:
					while (n-->0) {
						var r = dstbytes[lasti*4 + 0] + dstbytes[(di + off)*4 + 4] - dstbytes[(di + off)*4 + 0];
						var g = dstbytes[lasti*4 + 1] + dstbytes[(di + off)*4 + 5] - dstbytes[(di + off)*4 + 1];
						var b = dstbytes[lasti*4 + 2] + dstbytes[(di + off)*4 + 6] - dstbytes[(di + off)*4 + 2];
						clr = ((b & 0xFF) << 16) + ((g & 0xFF) << 8) + (r & 0xFF);
						dst[di] = clr; lasti = di; di++;
					}
				case 5:
					while (n-->0) {
						clr = dst[di + off];
						dst[di] = clr; di++;
					}
					lasti = di - 1;
			}
			cx1 = (clr & 0xFC00) >> 4;
			cx = clr >> 18;
		}
	}
}
