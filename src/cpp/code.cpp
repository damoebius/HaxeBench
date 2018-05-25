#include "screencap.h"
#include <emscripten/bind.h>
using namespace emscripten;

EMSCRIPTEN_BINDINGS(my_module) {
  
  class_<CScreenCapt>("ScreenPressor")
          .constructor<int, int>()
          .function("DecompressFrame", &CScreenCapt::DecompressFrame)
          ;
  
}