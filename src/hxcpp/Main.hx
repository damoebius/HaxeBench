
package hxcpp;

import hxcpp.ScreenPressor;

@:buildXml("
<linker id='exe' exe='emcc'>
        <flag value='-s' />
        <flag value='WASM=1' />
        <flag value='--bind' />
	<flag value='-s' />
²²²²<flag value='TOTAL_MEMORY=33554432' />
	<flag value='-O3' />
</linker>
")

@:cppFileCode('
#include <emscripten/bind.h>
using namespace emscripten;

EMSCRIPTEN_BINDINGS(my_module) {
        class_<hxcpp::Main>("MyWrapper")
        .class_function("decompress", &hxcpp::Main_obj::DecompressI);
}
')
class Main
{
	static var SP:ScreenPressor;

	static function main()
	{

	}

	public static function DecompressI(width:Int, height:Int, src:haxe.io.UInt8Array, dst:haxe.io.Int32Array):Void {
		SP = (SP == null) ? new ScreenPressor(width, height) : SP;
		SP.DecompressI(src, dst);
	}
}
