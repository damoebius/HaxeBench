class RangeCoder 
{
	range : number;
	code : number;
	data : Uint8Array;
	pos : number;
		
	static TOP = 0x01000000;
	static BOT =   0x010000;
		
	constructor() 
	{		
	}

	public DecodeBegin(src : Uint8Array, pos0 : number):void
	{
		this.code = 0;
		//range = 4294967295;// 0xFFFFFFFF;		
		var ff = 0xFFFF;
		this.range = ff * 65536;
		this.range += ff;
		this.data = src;
		this.pos = pos0;
		this.code = 0;
		this.code = (this.code * 256) + this.data[this.pos + 1];
		this.code = (this.code * 256) + this.data[this.pos + 2];
		this.code = (this.code * 256) + this.data[this.pos + 3];
		this.code = (this.code * 256) + this.data[this.pos + 4];
		this.pos += 5;
	}
	
	decode(cumFreq : number, freq:number, total_freq:number) :void
	{
		this.code -= cumFreq * this.range;
		this.range = this.range * freq;
		while ( this.range < RangeCoder.TOP ) { 
			this.code = (this.code * 256) + this.data[this.pos++];  this.range *= 256; 
		}
	}
	
 	get_freq(total_freq:number):number 
	{
		this.range = Math.floor( this.range / total_freq );
		return Math.floor(this.code / this.range);
	}
		
	public DecodeVal(cnt:Uint32Array, maxc:number, step:number):number 
	{
		var totfr = cnt[maxc];
		var value = this.get_freq(totfr);
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
		this.decode(cumfr, cnt_c, totfr);
	
		cnt[c] = cnt_c + step;
		totfr += step;		
		if (totfr > RangeCoder.BOT) {
			totfr = 0;
			for (let i=0; i<maxc; i++) {
				var nc = (cnt[i] >> 1) + 1;
				cnt[i] = nc;///	cnt[i] = (cnt[i]>>1)+1;
				totfr += nc;
			}			
		}
		cnt[maxc] = totfr;
		return c;
	}
	
	public DecodeValUni(cnt:Uint32Array, off:number, step:number):number
	{
		var totfr = cnt[off + 16];
		var value = this.get_freq(totfr);

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
		this.decode(cumfr, cnt_c, totfr);
		cnt[off + c + 17] = cnt_c + step; ///	cnt[c] += step;
		cnt[off + x] = cnt_x + step; ///	cnt[256+x] += step;
		totfr += step;
		if (totfr > RangeCoder.BOT) {
			totfr = 0;
			for (let i=(off+17);i<(off+256+17);i++) {
				var nc = (cnt[i] >> 1) + 1;
				cnt[i] = nc; ///cnt[i] = (cnt[i]>>1)+1;
				totfr += nc;
			}
			for(let i=0;i<16;i++) {
				var sum = 0;
				var i16_17 = off + (i << 4) + 17;
				for(let j=0;j<16;j++)
					sum += cnt[i16_17 + j];///cnt[256+i] += cnt[i*16+j];
				cnt[off + i] = sum;
			}
		}
		cnt[off + 16] = totfr;
		return c;
	}
}