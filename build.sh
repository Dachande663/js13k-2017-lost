# npm install uglify-js -g
# npm install html-minifier -g

rm -rf build.zip
rm -rf build
mkdir build
uglifyjs -c -m -o build/script.js script.js
uglifyjs -c -m -o build/app.js app.js
html-minifier --html5 --collapse-boolean-attributes --collapse-inline-tag-whitespace --collapse-whitespace --remove-attribute-quotes --remove-comments --remove-empty-attributes --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-style-link-type-attributes --remove-tag-whitespace --sort-attributes --sort-class-name --trim-custom-fragments --use-short-doctype -o build/index.html index.html
zip -r build.zip build
