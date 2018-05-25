//---------------------------------------------------------------------------
//  Part of ScreenPressor lossless video codec
//  (C) Infognition Co. Ltd.
//---------------------------------------------------------------------------
// Implementation of new range coder class which performs arithmetic coding.
// This range coder is used in version 2.0.
// see http://en.wikipedia.org/wiki/Range_encoding

//#include "defines.h"
#include "sub.h"
//#include <assert.h>


/*BYTE* RangeCoderSub::ShiftLow(BYTE* pDst) 
{
		if ( (low>>24)!=0xFF ) {
			*pDst++ = Cache + (low>>32);
			int c = 0xFF+(low>>32);
			while ( FFNum ) *pDst++ = c, FFNum--;
			Cache = uint(low)>>24;
		} else 
			FFNum++;
		low = uint(low)<<8;
		return pDst;
}*/

uint RangeCoderSub::GetFreq (uint totFreq) 
{
		return code / (range/= totFreq);
}

BYTE* RangeCoderSub::Decode(uint cumFreq, uint freq, uint totFreq, BYTE* pSrc) 
{
		code -= cumFreq*range;
		range *= freq;
		while( range<TOP ) code=(code<<8) | *pSrc++, range<<=8;
		return pSrc;
}

//decode a value from a known range and update stats table, renormalizing stats if necessary
BYTE* RangeCoderSub::DecodeVal(int &c, uint *cnt, uint &totfr, uint maxc, uint step, BYTE *pSrc)
{
	uint value, cumfr, i;
	
	value = GetFreq(totfr);
	for(cumfr=0,c=0; c<maxc; c++ ) {																					
		if (value >= cumfr + cnt[c])													
			cumfr += cnt[c];														
		else																			
	        break;																		
	}																					
	pSrc = Decode(cumfr, cnt[c], totfr, pSrc);

	cnt[c] += step;
	totfr += step;
	if (totfr>BOT_C) {
		totfr = 0;
		for(i=0;i<maxc;i++) {
			cnt[i] = (cnt[i]>>1)+1;
			totfr += cnt[i];
		}
	}
	return pSrc;
}

//decode a value from range 0..255 with close to uniform distribution
BYTE* RangeCoderSub::DecodeValUni(int &c, uint *cnt, uint &totfr, uint step, BYTE *pSrc)
{
	uint value, cumfr, i;
	const int maxc = 256;
	
	value = GetFreq(totfr);

	int x=0;
	for(cumfr=0; x<16; x++ ) {
		if (value >= cumfr + cnt[256 + x])
			cumfr += cnt[256 + x];
		else																			
	        break;																		
	}																					

	c = x * 16;
	for(; c<maxc; c++ ) {																					
		if (value >= cumfr + cnt[c])													
			cumfr += cnt[c];														
		else																			
	        break;																		
	}																					
	pSrc = Decode(cumfr, cnt[c], totfr, pSrc);
	cnt[c] += step;
	cnt[256+x] += step;
	totfr += step;
	if (totfr>BOT_C) {
		totfr = 0;
		for(i=0;i<maxc;i++) {
			cnt[i] = (cnt[i]>>1)+1;
			totfr += cnt[i];
		}
		for(i=0;i<16;i++) {
			cnt[256+i] = 0;
			for(int j=0; j<16;j++)
				cnt[256+i] += cnt[i*16+j];
		}
	}
	return pSrc;
}