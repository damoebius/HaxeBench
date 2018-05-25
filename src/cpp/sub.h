//---------------------------------------------------------------------------
//  Part of ScreenPressor lossless video codec
//  (C) Infognition Co. Ltd.
//---------------------------------------------------------------------------

// Header for new range coder class which performs arithmetic coding.
// This range coder is used in version 2.0.

#ifndef _SUBB_
#define _SUBB_

typedef unsigned int uint;
typedef unsigned char BYTE;
#define BOOL bool
#define TRUE true
#define FALSE false

#define TOP (1<<24)

#define TOP_C         (1<<24)
#define BOT_C         (1<<16)

class RangeCoderSub {
	uint code, range;//, FFNum, Cache;
	//uint low; 
public:
	
	BYTE* DecodeBegin(BYTE* pSrc) {
		code=0;
		range=(uint)-1;
		for (int i=0; i<5; i++) 
			code=(code<<8) | *pSrc++;
		return pSrc;
	}

	//BYTE* ShiftLow(BYTE* pDst); 
	uint GetFreq (uint totFreq);
	BYTE* Decode(uint cumFreq, uint freq, uint totFreq, BYTE* pSrc);

	////////////////////////////////////////////////////////
	BYTE* DecodeVal(int &c, uint *cnt, uint &totfr, uint maxc, uint step, BYTE *pSrc);
	BYTE* DecodeValUni(int &c, uint *cnt, uint &totfr, uint step, BYTE *pSrc);

};//class

#endif