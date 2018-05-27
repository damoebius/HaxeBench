# HaxeBench
Haxe, Dart or Typescript performances comparison.

An updated comparison from http://www.infognition.com/blog/2014/comparing_flash_haxe_dart_asmjs_and_cpp.html

- Haxe : 3.4.7
- TypeScript : 2.8
- Dart : 1.24.3
- Dart2 : 2.0.0-dev.58.0

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


# results

On Chrome 66, i5-5300U CPU @ 2.30GHz

| lang  | compilation time | run time | size | minified size |
| ------------- | ------------- |------------- |------------- |------------- |
| Haxe  | 0.281s  | 7.97s  | 27KB*  | 13KB  |
| TypeScript  | 1.97s  | 8.94s  | 12KB  | 7KB |
| Dart  | 5.56s  | 11.418s  | 344KB  | 136KB |
| Dart2  | 4.06s  | 11.411s  | 264KB  | 106KB |

\*includes typed arrays polyfills for old browsers.

![result](/docs/result.png)
- ![#76bee0](https://placehold.it/15/76bee0/000000?text=+) `TypeScript`
- ![#fdd71a](https://placehold.it/15/fdd71a/000000?text=+) `Haxe`
- ![#91be71](https://placehold.it/15/91be71/000000?text=+) `Dart`
- ![#d15a5c](https://placehold.it/15/d15a5c/000000?text=+) `Dart2`
