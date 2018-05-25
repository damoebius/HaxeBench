# HaxeBench
Haxe, Dart or Typescript performances comparaison.

An updated comparaison from http://www.infognition.com/blog/2014/comparing_flash_haxe_dart_asmjs_and_cpp.html

## setup

```bash
npm install
npm run build
```

## run

To run the benchmark open one of this urls in your browser :

haxe : http://localhost/spihaxejs.html

typescript : http://localhost/spitsjs.html


# results

on Chrome 66, i5-5300U CPU @ 2.30GHz

| lang  | compilation time | run time | size | minified size |
| ------------- | ------------- |------------- |------------- |------------- |
| haxe  | 0.281s  | 7.97s  | 27ko  | 13ko  |
| typescript  | 1.97s  | 8.94s  | 12ko  | 7ko |

![result](/docs/result.png)

