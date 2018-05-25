//---------------------------------------------------------------------------
//  Part of ScreenPressor lossless video codec
//  (C) Infognition Co. Ltd.
//---------------------------------------------------------------------------


#ifndef SCREENCAPH
#define SCREENCAPH

#include "sub.h"

// Some constants for compression algorithm.
// They determine speed of updating statistics for different kinds of data 
// and stats table sizes.
// Two codecs where at least one of these numbers differs become binary incompatible.

#define SC_STEP 400  
#define SC_NSTEP 400 
#define SC_CXSHIFT 2
#define MAKECX1 cx1 = (cx<<6)&0xFC0;

#define SC_CXMAX 4096
#define SC_BTSTEP10 1
#define SC_BTSTEP 10 
#define SC_NCXMAX 6
#define SC_BTNSTEP 20
#define SC_SXYSTEP10 10
#define SC_SXYSTEP 100 
#define SC_MSTEP10 10
#define SC_MSTEP 100 

#define SC_UNSTEP10 1
#define SC_UNSTEP 1000 
#define SC_XXSTEP 1
#define NCX2 ptype

class CScreenCapt  {
protected:
	RangeCoderSub rc; //range coder

	BOOL init; // is data initialized?

	//statistics tables for different kinds of data
	uint *cntab[3][SC_CXMAX];
	uint *ntab[SC_NCXMAX], ntab2[257];
	uint ptypetab[6][7]; //pixel type, context = previous value


	int X,Y, stride;
	uint cx, cx1;//, nbx,nby, fn;
	uint bytespp; //bytes per pixel: 2 or 3

	void StartClr(); //initialize context vars

	int DecompressI(BYTE *pSrc, BYTE *pDst);

	void RenewI(); //reinit stats for compressing/decompressing I-frame

	BYTE* DecodeRGB(BYTE *pSrc, int &r, int &g, int &b);

  void Init(int w, int h); 
	void Deinit();

public:
	CScreenCapt(int w, int h);
  ~CScreenCapt() { Deinit(); }
	int DecompressFrame(int ipSrc, int ipDst);
};

#endif