import 'dart:html';
import 'dart:typed_data';
import 'dart:async';
import 'rangecoder.dart';

const int SC_STEP = 400;
const int SC_NSTEP = 400;
const int SC_CXSHIFT = 2;
const int SC_CXMAX = 4096;
const int SC_NCXMAX = 6;
const int SC_UNSTEP = 1000; 
const int CNTABSZ = 273; 

class ScreenPressor {
  int X, Y;
  RangeCoder rc;
  Int32List cntab; 
  List<Int32List> ptypetab;
  List<Int32List> ntab;
  
  ScreenPressor(this.X, this.Y) {
    cntab = new Int32List(3 * 4096 * 273);
    ptypetab = new List<Int32List>(SC_NCXMAX);
    ntab = new List<Int32List>(SC_NCXMAX);
    for(int i=0;i<6;i++) {
      ptypetab[i] = new Int32List(7);
      ntab[i] = new Int32List(257);
    }
    rc = new RangeCoder();
    for (int chan = 0; chan < 3; chan++)
      for (int ctx = 0; ctx < SC_CXMAX; ctx++) 
        cntab[((chan << 12) + ctx) * 273 + 16] = 0;
  }
  
  void ReinitTabs() {
    for(int chan = 0; chan < 3; chan++)
      for(int ctx = 0; ctx < SC_CXMAX; ctx++) {
        int p = ((chan << 12) + ctx) * 273;
        if (cntab[p + 16] != 256) { //fill if changed
          for(int i = 0; i < 256; i++)
            cntab[p + i + 17] = 1;
          for(int i = 0; i < 16; i++)
            cntab[p + i] = 16;
          cntab[p + 16] = 256;
        }
      }
    for (int ncx = 0; ncx < SC_NCXMAX; ncx++) {
      Int32List p = ntab[ncx];
      for(int i = 0; i < 256; i++)
        p[i] = 1;
      p[256] = 256;      
    }
    
    for(int ctx = 0; ctx < 6; ctx++) {
      Int32List p = ptypetab[ctx];
      for (int i = 0; i < 6; i++)
        p[i] = 1;
      p[6] = 6;
    }       
  }
  
  void DecompressI(Uint8List src, Int32List dst) {
    int clr = 0, di = 0;
    if (src[0] != 0x12) {
      print("unknown version of the codec"); return;
    }
    ReinitTabs();
    rc.DecodeBegin(src, 1);
    int cx = 0, cx1 = 0, k = 0;
    
    while(k<X+1) {
      int r = rc.DecodeValUni(cntab, (cx+cx1)*CNTABSZ, SC_STEP);
      cx1 = (cx<<6)&0xFC0;
      cx = r>>SC_CXSHIFT;
      int g = rc.DecodeValUni(cntab, (4096 + cx+cx1)*CNTABSZ, SC_STEP);
      cx1 = (cx<<6)&0xFC0;
      cx = g>>SC_CXSHIFT;
      int b = rc.DecodeValUni(cntab, (2*4096 + cx+cx1)*CNTABSZ, SC_STEP);
      cx1 = (cx<<6)&0xFC0;
      cx = b>>SC_CXSHIFT;     
      
      int n = rc.DecodeVal(ntab[0], 256, SC_NSTEP);
      clr = (b << 16) + (g << 8) + r;
      k += n;
      while(n-->0) {
        dst[di] = clr;        
        di++;
      }             
    }
    int lasti = di - 1;
    int off = -X - 1;
    int ptype = 0;  
    int last_pos = 0;
    final int end = X*Y;
    Uint8List dstbytes = dst.buffer.asUint8List();
    
    while(di < end) {
      ptype = rc.DecodeVal(ptypetab[ptype], 6, SC_UNSTEP);
      if (ptype==0) {
        int r = rc.DecodeValUni(cntab, (cx+cx1)*CNTABSZ, SC_STEP);
        cx1 = (cx<<6)&0xFC0;
        cx = r>>SC_CXSHIFT;
        int g = rc.DecodeValUni(cntab, (4096 + cx+cx1)*CNTABSZ, SC_STEP);
        cx1 = (cx<<6)&0xFC0;
        cx = g>>SC_CXSHIFT;
        int b = rc.DecodeValUni(cntab, (2*4096 + cx+cx1)*CNTABSZ, SC_STEP);
        cx1 = (cx<<6)&0xFC0;
        cx = b>>SC_CXSHIFT;     
        clr = (b << 16) + (g << 8) + r;
      }     
      int n = rc.DecodeVal(ntab[ptype], 256, SC_NSTEP);
      switch(ptype) {
        case 0:  
          while (n-->0) {
            dst[di++] = clr;                   
          }
          lasti = di - 1;
          break;
        case 1:
          while (n-->0) {
            dst[di] = dst[lasti]; lasti = di; di++;                  
          }
          clr = dst[lasti];
          break;
        case 2:
          while (n-->0) {
            clr = dst[di + off + 1];
            dst[di] = clr; di++;                  
          }
          lasti = di - 1;
          break;
        case 4:          
          while (n-->0) {
            int r = dstbytes[lasti*4] + dstbytes[(di + off)*4 + 4] - dstbytes[(di + off)*4];
            int g = dstbytes[lasti*4+1] + dstbytes[(di + off)*4 + 5] - dstbytes[(di + off)*4+1];
            int b = dstbytes[lasti*4+2] + dstbytes[(di + off)*4 + 6] - dstbytes[(di + off)*4+2];
            clr = ((b & 0xFF) << 16) + ((g & 0xFF) << 8) + (r & 0xFF);
            dst[di] = clr; lasti = di; di++;                  
          }
          break;
        case 5:
          while (n-->0) {
            clr = dst[di + off];  
            dst[di] = clr; di++;                  
          }
          lasti = di - 1;
          break;
      }
      
      cx1 = (clr & 0xFC00) >> 4;
      cx = clr >> 18;   
    }
  } //DecompressI
}//SP

void showImg(Int32List pic, int X, int Y) {
  var c = new CanvasElement(width:X, height:Y);
  querySelector("#main")..children.clear()
                        ..append(c);
  ImageData imagedata = c.context2D.getImageData(0, 0, X, Y);
  List<int> data = imagedata.data;
  Uint8List picbytes = pic.buffer.asUint8List();
  for(int i=0;i<X*Y;i++) {
    data[i*4+0] = picbytes[i*4+0];
    data[i*4+1] = picbytes[i*4+1];
    data[i*4+2] = picbytes[i*4+2];
    data[i*4+3] = 255;
  }
  c.context2D.putImageData(imagedata, 0, 0);  
}

main() {
  var txt = querySelector("#txt");
  const int X = 960, Y = 540;
  txt.innerHtml = "loading image...";
  HttpRequest.request("blow.spi", responseType:"arraybuffer").then((req) { 
    ByteBuffer buf = req.response;
    txt.innerHtml = "received ${buf.lengthInBytes} bytes.";
    InputElement inp = new Element.html('<input size="5" value="10" autocomplete="off">');
    var btn = new Element.html('<input type="submit" value="Go">');
    querySelector("#starter")..appendHtml("Number of times to decompress: ")
                             ..append(inp)
                             ..append(btn);
    btn.onClick.listen((e) {
      try {
        int N = int.parse(inp.value);
        if (N < 0 || N > 1000) {
          txt.innerHtml = "You must be joking!"; return;
        }
        txt.innerHtml = "decompressing $N times...";
        querySelector("#main").children.clear();
        new Future((){
          Uint8List bytes = buf.asUint8List(4);
          var sp = new ScreenPressor(X,Y);
          Int32List dst = new Int32List(X*Y);
          Stopwatch sw = new Stopwatch()..start();
          for(int n=0;n<N;n++) 
            sp.DecompressI(bytes, dst);    
          sw.stop();
          txt.innerHtml += " t=${sw.elapsedMilliseconds} ms";
          showImg(dst, X, Y);
        });        
      } on FormatException {}
    });
  }); 
}