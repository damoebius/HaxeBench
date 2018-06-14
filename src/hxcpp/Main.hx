package hxcpp;

import hxcpp.ScreenPressor;

@:buildXml("
<linker id='exe' exe='emcc'>
	<flag value='-s' />
	<flag value='WASM=1' />
</linker>
")
class Main 
{
	static inline var X = 960;
	static inline var Y = 540;
	static var ScreenPressor;
	
	static function main() 
	{
		ScreenPressor = new ScreenPressor(X,Y);
		trace('hello');
	}
	
}