var RangeCoder = (function () {
    function RangeCoder() {
    }
    RangeCoder.prototype.DecodeBegin = function (src, pos0) {
        this.code = 0;
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
    };
    RangeCoder.prototype.decode = function (cumFreq, freq, total_freq) {
        this.code -= cumFreq * this.range;
        this.range = this.range * freq;
        while (this.range < RangeCoder.TOP) {
            this.code = (this.code * 256) + this.data[this.pos++];
            this.range *= 256;
        }
    };
    RangeCoder.prototype.get_freq = function (total_freq) {
        this.range = Math.floor(this.range / total_freq);
        return Math.floor(this.code / this.range);
    };
    RangeCoder.prototype.DecodeVal = function (cnt, maxc, step) {
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
            for (var i = 0; i < maxc; i++) {
                var nc = (cnt[i] >> 1) + 1;
                cnt[i] = nc;
                totfr += nc;
            }
        }
        cnt[maxc] = totfr;
        return c;
    };
    RangeCoder.prototype.DecodeValUni = function (cnt, off, step) {
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
        cnt[off + c + 17] = cnt_c + step;
        cnt[off + x] = cnt_x + step;
        totfr += step;
        if (totfr > RangeCoder.BOT) {
            totfr = 0;
            for (var i = (off + 17); i < (off + 256 + 17); i++) {
                var nc = (cnt[i] >> 1) + 1;
                cnt[i] = nc;
                totfr += nc;
            }
            for (var i = 0; i < 16; i++) {
                var sum = 0;
                var i16_17 = off + (i << 4) + 17;
                for (var j = 0; j < 16; j++)
                    sum += cnt[i16_17 + j];
                cnt[off + i] = sum;
            }
        }
        cnt[off + 16] = totfr;
        return c;
    };
    RangeCoder.TOP = 0x01000000;
    RangeCoder.BOT = 0x010000;
    return RangeCoder;
}());
var ScreenPressor = (function () {
    function ScreenPressor(width, height) {
        this.X = width;
        this.Y = height;
        this.rc = new RangeCoder();
        this.cntab = new Uint32Array(3 * 4096 * ScreenPressor.CNTABSZ);
        this.ptypetab = new Array();
        this.ntab = new Array();
        for (var i = 0; i < 6; i++) {
            this.ptypetab[i] = new Uint32Array(7);
            this.ntab[i] = new Uint32Array(257);
        }
        for (var chan = 0; chan < 3; chan++) {
            for (var ctx = 0; ctx < ScreenPressor.SC_CXMAX; ctx++) {
                this.cntab[((chan << 12) + ctx) * ScreenPressor.CNTABSZ + 16] = 0;
            }
        }
    }
    ScreenPressor.prototype.ReinitTabs = function () {
        for (var chan = 0; chan < 3; chan++) {
            for (var ctx = 0; ctx < ScreenPressor.SC_CXMAX; ctx++) {
                var p = ((chan << 12) + ctx) * ScreenPressor.CNTABSZ;
                if (this.cntab[p + 16] != 256) {
                    for (var i = 0; i < 256; i++) {
                        this.cntab[p + i + 17] = 1;
                    }
                    for (var i = 0; i < 16; i++) {
                        this.cntab[p + i] = 16;
                    }
                    this.cntab[p + 16] = 256;
                }
            }
        }
        for (var ncx = 0; ncx < ScreenPressor.SC_NCXMAX; ncx++) {
            var p2 = this.ntab[ncx];
            for (var i = 0; i < 256; i++) {
                p2[i] = 1;
            }
            p2[256] = 256;
        }
        for (var ctx = 0; ctx < 6; ctx++) {
            var p3 = this.ptypetab[ctx];
            for (var i = 0; i < 6; i++) {
                p3[i] = 1;
            }
            p3[6] = 6;
        }
    };
    ScreenPressor.prototype.DecompressI = function (src, dst) {
        var end = this.X * this.Y;
        var di = 0, clr = 0, cx = 0, cx1 = 0, lasti = 0;
        if (src[0] != 0x12) {
            console.log("unknown version of the codec");
            return;
        }
        this.ReinitTabs();
        this.rc.DecodeBegin(src, 1);
        var k = 0;
        while (k < this.X + 1) {
            var r = this.rc.DecodeValUni(this.cntab, (cx + cx1) * ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
            cx1 = (cx << 6) & 0xFC0;
            cx = r >> ScreenPressor.SC_CXSHIFT;
            var g = this.rc.DecodeValUni(this.cntab, (4096 + cx + cx1) * ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
            cx1 = (cx << 6) & 0xFC0;
            cx = g >> ScreenPressor.SC_CXSHIFT;
            var b = this.rc.DecodeValUni(this.cntab, (2 * 4096 + cx + cx1) * ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
            cx1 = (cx << 6) & 0xFC0;
            cx = b >> ScreenPressor.SC_CXSHIFT;
            var n = this.rc.DecodeVal(this.ntab[0], 256, ScreenPressor.SC_NSTEP);
            clr = (b << 16) + (g << 8) + r;
            k += n;
            while (n-- > 0) {
                dst[di] = clr;
                di++;
            }
            lasti = di - 1;
        }
        var off = -this.X - 1;
        var ptype = 0;
        var dstbytes = new Uint8Array(dst.buffer);
        while (di < end) {
            ptype = this.rc.DecodeVal(this.ptypetab[ptype], 6, ScreenPressor.SC_UNSTEP);
            if (ptype == 0) {
                var r = this.rc.DecodeValUni(this.cntab, (cx + cx1) * ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
                cx1 = (cx << 6) & 0xFC0;
                cx = r >> ScreenPressor.SC_CXSHIFT;
                var g = this.rc.DecodeValUni(this.cntab, (4096 + cx + cx1) * ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
                cx1 = (cx << 6) & 0xFC0;
                cx = g >> ScreenPressor.SC_CXSHIFT;
                var b = this.rc.DecodeValUni(this.cntab, (2 * 4096 + cx + cx1) * ScreenPressor.CNTABSZ, ScreenPressor.SC_STEP);
                cx1 = (cx << 6) & 0xFC0;
                cx = b >> ScreenPressor.SC_CXSHIFT;
                clr = (b << 16) + (g << 8) + r;
            }
            var n = this.rc.DecodeVal(this.ntab[ptype], 256, ScreenPressor.SC_NSTEP);
            switch (ptype) {
                case 0:
                    while (n-- > 0) {
                        dst[di++] = clr;
                    }
                    lasti = di - 1;
                case 1:
                    while (n-- > 0) {
                        dst[di] = dst[lasti];
                        lasti = di;
                        di++;
                    }
                    clr = dst[lasti];
                case 2:
                    while (n-- > 0) {
                        clr = dst[di + off + 1];
                        dst[di] = clr;
                        di++;
                    }
                    lasti = di - 1;
                case 4:
                    while (n-- > 0) {
                        var r = dstbytes[lasti * 4] + dstbytes[(di + off) * 4 + 4] - dstbytes[(di + off) * 4];
                        var g = dstbytes[lasti * 4 + 1] + dstbytes[(di + off) * 4 + 5] - dstbytes[(di + off) * 4 + 1];
                        var b = dstbytes[lasti * 4 + 2] + dstbytes[(di + off) * 4 + 6] - dstbytes[(di + off) * 4 + 2];
                        clr = ((b & 0xFF) << 16) + ((g & 0xFF) << 8) + (r & 0xFF);
                        dst[di] = clr;
                        lasti = di;
                        di++;
                    }
                case 5:
                    while (n-- > 0) {
                        clr = dst[di + off];
                        dst[di] = clr;
                        di++;
                    }
                    lasti = di - 1;
            }
            cx1 = (clr & 0xFC00) >> 4;
            cx = clr >> 18;
        }
    };
    ScreenPressor.SC_STEP = 400;
    ScreenPressor.SC_NSTEP = 400;
    ScreenPressor.SC_CXSHIFT = 2;
    ScreenPressor.SC_CXMAX = 4096;
    ScreenPressor.SC_NCXMAX = 6;
    ScreenPressor.SC_UNSTEP = 1000;
    ScreenPressor.CNTABSZ = 273;
    return ScreenPressor;
}());
var Main = (function () {
    function Main() {
    }
    Main.main = function () {
        var txt = document.getElementById("txt");
        txt.innerHTML = "sss";
        var r = new XMLHttpRequest();
        r.onload = function (x) {
            var buf = r.response;
            txt.innerHTML = "received " + buf.byteLength;
            var btn = document.getElementById("btn");
            btn.onclick = function (e) {
                var bytes = new Uint8Array(buf, 4);
                var sp = new ScreenPressor(Main.X, Main.Y);
                var dst = new Int32Array(Main.X * Main.Y);
                var inp = document.getElementById("N");
                var N = parseInt(inp.value);
                if (N < 0 || N > 1000) {
                    txt.innerHTML = "You must be joking!";
                    return;
                }
                txt.innerHTML = "Decompressing " + N + " times...";
                Main.clearImg();
                setTimeout(function () {
                    console.log("sssss");
                    var t0 = Date.now();
                    for (var n = 0; n < N; n++) {
                        sp.DecompressI(bytes, dst);
                    }
                    var t1 = Date.now();
                    txt.innerHTML += " t=" + (t1 - t0);
                    Main.showImg(dst);
                }, 20);
            };
        };
        r.open("GET", "blow.spi", true);
        r.responseType = "arraybuffer";
        r.send();
    };
    Main.clearImg = function () {
        var m = document.getElementById("main");
        while (m.lastChild != null)
            m.removeChild(m.lastChild);
    };
    Main.showImg = function (pic) {
        var m = document.getElementById("main");
        var c = document.createElement("canvas");
        c.width = Main.X;
        c.height = Main.Y;
        m.appendChild(c);
        var imagedata = c.getContext("2d").getImageData(0, 0, Main.X, Main.Y);
        var data = imagedata.data;
        var picbytes = new Uint8Array(pic.buffer);
        var l = Main.X * Main.Y;
        for (var i = 0; i < l; i++) {
            data[i * 4 + 0] = picbytes[i * 4 + 0];
            data[i * 4 + 1] = picbytes[i * 4 + 1];
            data[i * 4 + 2] = picbytes[i * 4 + 2];
            data[i * 4 + 3] = 255;
        }
        c.getContext("2d").putImageData(imagedata, 0, 0);
    };
    Main.X = 960;
    Main.Y = 540;
    return Main;
}());
Main.main();
