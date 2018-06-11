package hxcpp;

import haxe.io.UInt8Array;
import haxe.io.UInt32Array;

class RangeCoder 
{
	var range : Int;
	var code : Int;
	var data : UInt8Array;
	var pos : Int;
		
	static inline var TOP = 0x01000000;
	static inline var BOT =   0x010000;
		
	public function new() 
	{		
	}

	public function DecodeBegin(src : UInt8Array, pos0 : Int):Void
	{
		code = 0;
		//range = 4294967295;// 0xFFFFFFFF;		
		var ff = 0xFFFF;
		range = ff * 65536;
		range += ff;
		data = src;
		pos = pos0;
		code = 0;
		code = (code * 256) + data[pos + 1];
		code = (code * 256) + data[pos + 2];
		code = (code * 256) + data[pos + 3];
		code = (code * 256) + data[pos + 4];
		pos += 5;
	}
	
	inline function decode(cumFreq : Int, freq:Int, total_freq:Int) :Void
	{
		code -= cumFreq * range;
		range = range * freq;
		while ( range < TOP ) { 
			code = (code * 256) + data[pos++];  range *= 256; 
		}
	}
	
 	inline function get_freq(total_freq:Int):Int 
	{
		range = Std.int(range / total_freq);
		return Std.int(code / range);
	}
		
	public inline function DecodeVal(cnt:UInt32Array, maxc:Int, step:Int):Int
	{
		var totfr = cnt[maxc];
		var value = get_freq(totfr);
		var c = 0;
		var cumfr = 0;
		var cnt_c = 0;
		while (c < maxc) {	
			cnt_c = cnt[c];
			if (value >= cumfr + cnt_c)	
				cumfr += cnt_c;	
			else
				break;
			c++;
		}	
		decode(cumfr, cnt_c, totfr);
	
		cnt[c] = cnt_c + step;
		totfr += step;		
		if (totfr > BOT) {
			totfr = 0;
			for (i in 0...maxc) {
				var nc = (cnt[i] >> 1) + 1;
				cnt[i] = nc;///	cnt[i] = (cnt[i]>>1)+1;
				totfr += nc;
			}			
		}
		cnt[maxc] = totfr;
		return c;
	}
	
	public inline function DecodeValUni(cnt:UInt32Array, off:Int, step:Int):Int
	{
		var totfr = cnt[off + 16];
		var value = get_freq(totfr);

		var x = 0;
		var cumfr = 0;
		var cnt_x = 0;
		while (x < 16) {
			cnt_x = cnt[off + x];
			if (value >= cumfr + cnt_x)
				cumfr += cnt_x;
			else
				break;
			x++;
		}

		var c = x * 16;
		var cnt_c = 0;
		while (c < 256) {
			cnt_c = cnt[off + c + 17];
			if (value >= cumfr + cnt_c)
				cumfr += cnt_c;
			else
				break;
			c++;
		}
		decode(cumfr, cnt_c, totfr);
		cnt[off + c + 17] = cnt_c + step; ///	cnt[c] += step;
		cnt[off + x] = cnt_x + step; ///	cnt[256+x] += step;
		totfr += step;
		if (totfr > BOT) {
			totfr = 0;
			for (i in (off+17)...(off+256+17)) {
				var nc = (cnt[i] >> 1) + 1;
				cnt[i] = nc; ///cnt[i] = (cnt[i]>>1)+1;
				totfr += nc;
			}
			for(i in 0...16) {
				var sum = 0;
				var i16_17 = off + (i << 4) + 17;
				for(j in 0...16)
					sum += cnt[i16_17 + j];///cnt[256+i] += cnt[i*16+j];
				cnt[off + i] = sum;
			}
		}
		cnt[off + 16] = totfr;
		return c;
	}
}