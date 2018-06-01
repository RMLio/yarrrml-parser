# YARRRML Parser

This library allows to convert [YARRRML](https://w3id.org/yarrrml) rules to [RML](http://rml.io) or []R2RML](https://www.w3.org/TR/r2rml/) rules.

## Install

- clone repo
- install via `npm i`
- create links via `npm link` (might need `sudo`)

## Usage

If you want to generate RML rules from a YARRRML document, you do the following: `yarrrml -i rules.yml`.
The rules will be written to standard output.
If you want to write them to a file, you can add the `-o` option.

## License
This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/) and released under the [MIT license](http://opensource.org/licenses/MIT).