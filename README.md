# HaxeBench
Haxe, Dart, Typescript, and Webassembly, javascript output performances comparison.

An updated comparison from https://web.archive.org/web/20171104160438/http://www.infognition.com/blog/2014/comparing_flash_haxe_dart_asmjs_and_cpp.html

## setup

```bash
npm install
npm run build
```

## run

To run the benchmark open one of this urls in your browser :

- Haxe : https://damoebius.github.io/HaxeBench/www/spihaxejs.html
- TypeScript : https://damoebius.github.io/HaxeBench/www/spitsjs.html
- Dart : https://damoebius.github.io/HaxeBench/www/spidart.html
- Wasm : https://damoebius.github.io/HaxeBench/www/asmjs.html


# results

On Chrome 70 and Firefox 63, i5-5300U CPU @ 2.30GHz, 200 passes

| lang  | compilation time | chrome run time | firefox run time | size | minified size |
| ------------- | ------------- |------------- |------------- |------------- |------------- |
| Haxe  | 0.22s  | 6.76s  | 8.15s | 27KB*  | 13KB  |
| TypeScript | 1.89s  | 7.86s  | 8.6s | 12KB  | 7KB |
| Dart  | 5.38s  | 9.137s  | 8.8s |98KB  | 89KB |
| Wasm  | 8.74s  | 6.8s  | 5.93s | 82KB**  | 69KB |

![result](/docs/result2.png)
- ![#76bee0](https://placehold.it/15/76bee0/000000?text=+) `TypeScript 3.1.6`
- ![#fdd71a](https://placehold.it/15/fdd71a/000000?text=+) `Haxe 4.0.0.preview5`
- ![#91be71](https://placehold.it/15/91be71/000000?text=+) `Dart 2.1`
- ![#d15a5c](https://placehold.it/15/D28FB5/000000?text=+) `Wasm 1.0 with emsdk 1.38.4`

On Chrome 66 and Firefox 59, i5-5300U CPU @ 2.30GHz, 200 passes

| lang  | compilation time | chrome run time | firefox run time | size | minified size |
| ------------- | ------------- |------------- |------------- |------------- |------------- |
| Haxe  | 0.281s  | 7.97s  | 7.18s | 27KB*  | 13KB  |
| TypeScript  | 1.97s  | 8.94s  | 8.15s | 12KB  | 7KB |
| Dart  | 5.56s  | 11.418s  | 9.241s |344KB  | 136KB |
| Dart2  | 4.06s  | 11.411s  | 9.206s |264KB  | 106KB |
| Wasm  | 8.74s  | 7.176s  | 5.93s | 82KB**  | 69KB |

\*includes typed arrays polyfills for old browsers.

\** wasm 23KB + javascript 59KB


![result](/docs/result.png)
- ![#76bee0](https://placehold.it/15/76bee0/000000?text=+) `TypeScript 2.8`
- ![#fdd71a](https://placehold.it/15/fdd71a/000000?text=+) `Haxe 3.4.7`
- ![#91be71](https://placehold.it/15/91be71/000000?text=+) `Dart 1.24.3`
- ![#d15a5c](https://placehold.it/15/d15a5c/000000?text=+) `Dart2 2.0.0-dev.58.0`
- ![#D28FB5](https://placehold.it/15/D28FB5/000000?text=+) `Wasm 1.0 with emsdk 1.38.4`
