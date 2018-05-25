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
| Haxe  | 0.281s  | 7.97s  | 27ko  | 13ko  |
| TypeScript  | 1.97s  | 8.94s  | 12ko  | 7ko |
| Dart  | 5.56s  | 11.418s  | 344ko  | 136ko |
| Dart2  | 4.06s  | 11.411s  | 264ko  | 106ko |

![result](/docs/result.png)

