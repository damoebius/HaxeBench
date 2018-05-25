import 'dart:typed_data';

const int TOP = 0x01000000;
const int BOT =   0x010000;

class RangeCoder {
  int low = 0;
  int range = 0;
  int code = 0;
  int ffnum = 0;
  int cache = 0;
  Uint8List data;
  int pos = 0;
  
  void DecodeBegin(Uint8List src, int pos0) { // for I-frame pos0 = 1
    pos = pos0;
    data = src;
    code = 0;
    range = 0xFFFFFFFF;   
    code = (code<<8) | src[pos+1];
    code = (code<<8) | src[pos+2];
    code = (code<<8) | src[pos+3];
    code = (code<<8) | src[pos+4];
    pos += 5;
  }
  
  void decode(int cumFreq, int freq, int total_freq) {
    code -= cumFreq * range;
    range *= freq;
    while ( range < TOP ) { 
      code = (code << 8) | data[pos++];  range <<= 8; 
    }   
  }
  
  int get_freq(int total_freq)   {
    range = range ~/ total_freq;
    return code ~/ range;
  }

  int DecodeVal(Int32List cnt, int maxc, int step)  {
    int totfr = cnt[maxc];
    int value = get_freq(totfr);
    int c = 0;
    int cumfr = 0;
    int cnt_c = 0;
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
      for (int i = 0; i < maxc; i++) {
        int nc = (cnt[i] >> 1) + 1;
        cnt[i] = nc;///  cnt[i] = (cnt[i]>>1)+1;
        totfr += nc;
      }     
    }
    cnt[maxc] = totfr;
    return c;
  }

  int DecodeValUni(Int32List cnt, int off, int step)  {
    int totfr = cnt[off + 16];
    int value = get_freq(totfr);

    int x = 0;
    int cumfr = 0;
    int cnt_x = 0;
    while (x < 16) {
      cnt_x = cnt[off + x];
      if (value >= cumfr + cnt_x)
        cumfr += cnt_x;
      else
        break;
      x++;
    }

    int c = x * 16;
    int cnt_c = 0;
    while (c < 256) {
      cnt_c = cnt[off + c + 17];
      if (value >= cumfr + cnt_c)
        cumfr += cnt_c;
      else
        break;
      c++;
    }
    decode(cumfr, cnt_c, totfr);
    cnt[off + c + 17] = cnt_c + step; ///  cnt[c] += step;
    cnt[off + x] = cnt_x + step; /// cnt[256+x] += step;
    totfr += step;
    if (totfr > BOT) {
      totfr = 0;
      for (int i = off + 17; i < off + 256+17; i++) {
        int nc = (cnt[i] >> 1) + 1;
        cnt[i] = nc; ///cnt[i] = (cnt[i]>>1)+1;
        totfr += nc;
      }
      for(int i = 0; i < 16; i++) {
        int sum = 0;
        int i16_17 = off + (i << 4) + 17;
        for(int j = 0; j < 16; j++)
          sum += cnt[i16_17 + j];///cnt[256+i] += cnt[i*16+j];
        cnt[off + i] = sum;
      }
    }
    cnt[off + 16] = totfr;
    return c;
  }
}