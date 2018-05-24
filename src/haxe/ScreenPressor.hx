package haxe;

import js.html.Uint8Array;
import haxe.RangeCoder;
import js.html.Uint32Array;
import js.html.Int32Array;

class ScreenPressor 
{
	static inline var SC_STEP = 400;
	static inline var SC_NSTEP = 400;
	static inline var SC_CXSHIFT = 2;
	static inline var SC_CXMAX = 4096;
	static inline var SC_NCXMAX = 6;
	static inline var SC_UNSTEP = 1000; 
	static inline var CNTABSZ = 273; 

	var X : Int;
	var Y : Int;
	var rc : RangeCoder;
	var cntab : Uint32Array; 
	var ptypetab : Array<Uint32Array>;
	var ntab : Array<Uint32Array>;
		
	public function new(width:Int, height:Int) 
	{
		X = width; Y = height; 
		rc = new RangeCoder();
		cntab = new Uint32Array(3 * 4096 * CNTABSZ);
		ptypetab = new Array<Uint32Array>();
		ntab = new Array<Uint32Array>();
		for(i in 0...6) {
			ptypetab[i] = new Uint32Array(7);
			ntab[i] = new Uint32Array(257);
		}
		for (chan in 0...3)
			for (ctx in 0...SC_CXMAX) {
				cntab[((chan << 12) + ctx) * CNTABSZ + 16] = 0;
			}		
	}
	
	public function ReinitTabs():Void
	{
		for (chan in 0...3)
			for (ctx in 0...SC_CXMAX) {
				var p = ((chan << 12) + ctx) * CNTABSZ;
				if (cntab[p + 16] != 256) { //fill if changed
				for(i in 0...256)
					cntab[p + i + 17] = 1;
				for(i in 0...16)
					cntab[p + i] = 16;
				cntab[p + 16] = 256;
        }
				
			}
		for (ncx in 0...SC_NCXMAX) {
			var p = ntab[ncx];
			for(i in 0...256)
				p[i] = 1;
			p[256] = 256;      
		}
		
		for (ctx in 0...6) {
			var p = ptypetab[ctx];
			for(i in 0...6)
				p[i] = 1;
			p[6] = 6;			
		}				
	}
	
	public function DecompressI(src:Uint8Array, dst:Int32Array):Void
	{
		var end = X * Y;
		var di = 0, clr = 0, cx = 0, cx1 = 0, lasti = 0;
				
		if (src[0] != 0x12) {
				trace("unknown version of the codec"); return;
		}			
		ReinitTabs();
		rc.DecodeBegin(src, 1);
		var k = 0; 
			
		while(k<X+1) {
			var r = rc.DecodeValUni(cntab, (cx+cx1)*CNTABSZ, SC_STEP);
			cx1 = (cx<<6)&0xFC0;
			cx = r>>SC_CXSHIFT;
			var g = rc.DecodeValUni(cntab, (4096 + cx+cx1)*CNTABSZ, SC_STEP);
			cx1 = (cx<<6)&0xFC0;
			cx = g>>SC_CXSHIFT;
			var b = rc.DecodeValUni(cntab, (2*4096 + cx+cx1)*CNTABSZ, SC_STEP);
			cx1 = (cx<<6)&0xFC0;
			cx = b>>SC_CXSHIFT;			
			
			var n = rc.DecodeVal(ntab[0], 256, SC_NSTEP);
			clr = (b << 16) + (g << 8) + r;
			k += n;
			while(n-->0) {
				dst[di] = clr;
				di++;
			}		
			lasti = di - 1;			
		}
		var off = -X - 1;
		var ptype = 0;	
		var dstbytes = new Uint8Array( dst.buffer );
		
		while(di < end) {
			ptype = rc.DecodeVal(ptypetab[ptype], 6, SC_UNSTEP);
			if (ptype==0) {
				var r = rc.DecodeValUni(cntab, (cx+cx1)*CNTABSZ, SC_STEP);
				cx1 = (cx<<6)&0xFC0;
				cx = r >> SC_CXSHIFT;
				var g = rc.DecodeValUni(cntab, (4096 + cx+cx1)*CNTABSZ, SC_STEP);
				cx1 = (cx<<6)&0xFC0;
				cx = g >> SC_CXSHIFT;
				var b = rc.DecodeValUni(cntab, (2*4096 + cx+cx1)*CNTABSZ, SC_STEP);
				cx1 = (cx<<6)&0xFC0;
				cx = b >> SC_CXSHIFT;		
				clr = (b << 16) + (g << 8) + r;
			}			
			var n = rc.DecodeVal(ntab[ptype], 256, SC_NSTEP);
			switch(ptype) {
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
						var r = dstbytes[lasti*4] + dstbytes[(di + off)*4 + 4] - dstbytes[(di + off)*4];
						var g = dstbytes[lasti*4+1] + dstbytes[(di + off)*4 + 5] - dstbytes[(di + off)*4+1];
						var b = dstbytes[lasti*4+2] + dstbytes[(di + off)*4 + 6] - dstbytes[(di + off)*4+2];
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