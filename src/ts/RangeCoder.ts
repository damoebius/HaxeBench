class RangeCoder
{
	range : number;
	code : number;
	data : Uint8Array;
	pos : number;

	static TOP = 0x01000000;
	static BOT =   0x010000;

	DecodeBegin(src : Uint8Array, pos0 : number) : void
	{
		this.code = 0;
		//range = 4294967295;// 0xFFFFFFFF;
		const ff = 0xFFFF;
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

	decode(cumFreq : number, freq : number, total_freq : number) : void
	{
		this.code -= cumFreq * this.range;
		this.range = this.range * freq;
		while (this.range < RangeCoder.TOP) {
			this.code = (this.code * 256) + this.data[this.pos++];
      this.range *= 256;
		}
	}

 	get_freq(total_freq : number) : number
	{
		this.range = (this.range / total_freq) >>> 0;
		return (this.code / this.range) >>> 0;
	}

	DecodeVal(cnt : Uint32Array, maxc : number, step : number) : number
	{
		let totfr = cnt[maxc];
		let value = this.get_freq(totfr);
		let c = 0;
		let cumfr = 0;
		let cnt_c = 0;
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
				let nc = (cnt[i] >> 1) + 1;
				cnt[i] = nc;///	cnt[i] = (cnt[i]>>1)+1;
				totfr += nc;
			}
		}
		cnt[maxc] = totfr;
		return c;
	}

	DecodeValUni(cnt : Uint32Array, off : number, step : number) : number
	{
		let totfr = cnt[off + 16];
		let value = this.get_freq(totfr);

		let x = 0;
		let cumfr = 0;
		let cnt_x = 0;
		while (x < 16) {
			cnt_x = cnt[off + x];
			if (value >= cumfr + cnt_x)
				cumfr += cnt_x;
			else
				break;
			x++;
		}

		let c = x << 4;
		let cnt_c = 0;
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
			for (let i=(off+17),len = (off+256+17);i<len;i++) {
				let nc = (cnt[i] >> 1) + 1;
				cnt[i] = nc; ///cnt[i] = (cnt[i]>>1)+1;
				totfr += nc;
			}
			for(let i=0;i<16;i++) {
				let sum = 0;
				let i16_17 = off + (i << 4) + 17;
				for(let j=0;j<16;j++) {
					sum += cnt[i16_17 + j];///cnt[256+i] += cnt[i*16+j];
        }
				cnt[off + i] = sum;
			}
		}
		cnt[off + 16] = totfr;
		return c;
	}
}
