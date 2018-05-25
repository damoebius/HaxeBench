//---------------------------------------------------------------------------
//  Part of ScreenPressor lossless video codec
//  (C) Infognition Co. Ltd.
//---------------------------------------------------------------------------

#include "screencap.h"
#include <malloc.h>
#include <stdlib.h>

CScreenCapt::CScreenCapt(int w, int h) 
: init(FALSE),  bytespp(3) 
{
  Init(w,h);
}

// allocate memory for stats tables 
void CScreenCapt::Init(/*CodecParameters *pParams*/int w, int h)
{
	if (init) Deinit();

	X = w; Y = h;
	stride = (X * 3 + 3) & (~3);

	for(uint i=0;i<3;i++)
		for(int j=0;j<SC_CXMAX;j++) 
			cntab[i][j] = (uint*)calloc(256+16+1, sizeof(uint));
	for(int i=0;i<SC_NCXMAX;i++) 
		ntab[i] = (uint*)calloc(257,  sizeof(uint));

	init = TRUE;
}

//free the tables
void CScreenCapt::Deinit()
{
	if (!init) return;
	for(uint i=0;i<3;i++)
		for(int j=0;j<SC_CXMAX;j++) 
			free(cntab[i][j]);
	for(int i=0;i<SC_NCXMAX;i++) 
		free(ntab[i]);

	init = FALSE;
}

//forget all previous data statistics and fill the tables with default values

void CScreenCapt::RenewI()
{
	for(int i=0;i<3;i++)
		for(int j=0;j<SC_CXMAX;j++) 
      if (cntab[i][j][256+16] != 256)  {
        for(int n=0;n<256;n++)
          cntab[i][j][n] = 1;
        for(int n=0;n<16;n++)
          cntab[i][j][256+n] = 16;
        cntab[i][j][256+16] = 256;//totfr
      }
	for(int i=0;i<SC_NCXMAX;i++) {
		for(int n=0;n<256;n++)
			ntab[i][n] = 1;
		ntab[i][256] = 256;
	}

	for(int n=0;n<6;n++) {
		for(int i=0;i<6;i++)
			ptypetab[n][i] = 1;
		ptypetab[n][6] = 6;
	}
}



#define GO_NEXT_PIXEL 	lasti = i; \
	x++; i += 3; \
	if (x>=X) { \
		x = 0; y++; \
		i = y*stride; \
	}

//decompress RGB24 I-frame
int CScreenCapt::DecompressI(BYTE *pSrc, BYTE *pDst)
{
	int r,g,b;
	RenewI();
	pSrc = rc.DecodeBegin(pSrc);
	StartClr();

	int ptype = 0, lastptype = 0;
	int i = 0, n = 1, k = 0, lasti=0;
	while(k<X+1) {
		pSrc = DecodeRGB(pSrc, r,g,b);
		pSrc = rc.DecodeVal(n, ntab[NCX2], ntab[NCX2][256], 256, SC_NSTEP, pSrc);
		for(int x=0;x<n;x++) {
			pDst[i] = r;
			pDst[i+1] = g;
			pDst[i+2] = b;
			k++;
			lasti = i;
			i+=3;
			if ((i % stride)>=X*3)
				i = (i / stride + 1) * stride;
		}		
	}

	const int off = -stride-3;

	int x = (i % stride)/3, y = i / stride;
	while(y<Y) {
		lastptype = ptype;
		pSrc = rc.DecodeVal(ptype, ptypetab[lastptype], ptypetab[lastptype][6], 6, SC_UNSTEP, pSrc);
		
		if (!ptype)
			pSrc = DecodeRGB(pSrc, r,g,b);		

		pSrc = rc.DecodeVal(n, ntab[NCX2], ntab[NCX2][256], 256, SC_NSTEP, pSrc);

		i = y*stride + x*3;
		switch(ptype) {
		case 0:
			while(n-->0) {
				pDst[i] = r;
				pDst[i+1] = g;
				pDst[i+2] = b;
				GO_NEXT_PIXEL;
			}
			break;
		case 1:
			while(n-->0) {
				pDst[i] = pDst[lasti]; pDst[i+1] = pDst[lasti+1]; pDst[i+2] = pDst[lasti+2];
				GO_NEXT_PIXEL;
			}
			break;
		case 2:
			while(n-->0) {
				pDst[i] = pDst[i+off+3]; pDst[i+1] = pDst[i+off+4]; pDst[i+2] = pDst[i+off+5];
				GO_NEXT_PIXEL;
			}
			break;
		case 4:
			while(n-->0) {
				pDst[i] = (int)pDst[lasti] + (int)pDst[i+off+3] - (int)pDst[i+off];
				pDst[i+1] = (int)pDst[lasti+1] + (int)pDst[i+off+4] - (int)pDst[i+off+1];
				pDst[i+2] = (int)pDst[lasti+2] + (int)pDst[i+off+5] - (int)pDst[i+off+2];
				GO_NEXT_PIXEL;
			}
			break;
		case 5:
			while(n-->0) {
				pDst[i] = pDst[i+off]; pDst[i+1] = pDst[i+off+1]; pDst[i+2] = pDst[i+off+2];
				GO_NEXT_PIXEL;
			}
			break;
		}
		g = pDst[lasti+1];
		b = pDst[lasti+2];

		cx = g>>SC_CXSHIFT;
		MAKECX1;
		cx = b>>SC_CXSHIFT;		
	}

	return 1;
}

//reinit contexts
void CScreenCapt::StartClr()
{
	cx = cx1 = 0;
}

//read RGB values
BYTE *CScreenCapt::DecodeRGB(BYTE *pSrc, int &r, int &g, int &b)
{
  pSrc = rc.DecodeValUni(r, cntab[0][cx+cx1], cntab[0][cx+cx1][256+16], SC_STEP, pSrc);
	MAKECX1;
	cx = r>>SC_CXSHIFT;
	pSrc = rc.DecodeValUni(g, cntab[1][cx+cx1], cntab[1][cx+cx1][256+16], SC_STEP, pSrc);
	MAKECX1;
	cx = g>>SC_CXSHIFT;
	pSrc = rc.DecodeValUni(b, cntab[2][cx+cx1], cntab[2][cx+cx1][256+16], SC_STEP, pSrc);
	MAKECX1;
	cx = b>>SC_CXSHIFT;
	return pSrc;
}

//decompress a frame
int CScreenCapt::DecompressFrame(int ipSrc, int ipDst)
{
	return DecompressI((BYTE*)ipSrc+1, (BYTE*)ipDst);
}
