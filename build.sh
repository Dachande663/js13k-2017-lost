#!/bin/bash

# npm install uglify-js -g
# npm install html-minifier -g

rm -rf build.zip
rm -rf build
mkdir build

uglifyjs -c -m -o build/script.js script.js
uglifyjs -c -m -o build/app.js app.js
html-minifier --html5 --collapse-boolean-attributes --collapse-inline-tag-whitespace --collapse-whitespace --remove-attribute-quotes --remove-comments --remove-empty-attributes --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-style-link-type-attributes --remove-tag-whitespace --sort-attributes --sort-class-name --trim-custom-fragments --use-short-doctype -o build/index.html index.html
zip -q -r build.zip build

FILESIZE=$(stat -f%z build.zip)
MAXFILESIZE=13312
PERCENTUSED=$(bc -l <<< $FILESIZE/$MAXFILESIZE*100)
printf "Final size: %d of %d bytes (%.2f%%)\n" $FILESIZE $MAXFILESIZE $PERCENTUSED
