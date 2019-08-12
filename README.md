# YARRRML Parser

This library allows to convert [YARRRML](https://w3id.org/yarrrml) rules to [RML](http://rml.io) or [R2RML](https://www.w3.org/TR/r2rml/) rules.

## Install

- `npm i -g @rmlio/yarrrml-parser`

## Usage

### CLI

There are two CLI functions, `yarrrml-parser` and `yarrrml-generator`.
Using the `--help` flag will show all possible commands.

#### yarrrml-parser

If you want to generate RML rules from a YARRRML document, 
you do the following: `yarrrml-parser -i rules.yml`.
The rules will be written to standard output.
If you want to write them to a file, you can add the `-o` option.
By default RML rules are generated,
if you want to generate R2RML rules add `-f R2RML`.

#### yarrrml-generator

If you want to generate YARRRML rules from an RML document, you do the following: `yarrrml-generator -i rules.rml.ttl`.
The rules will be written to standard output.
If you want to write them to a file, you can add the `-o` option.

### Library

`npm i --save @rmlio/yarrrml-parser`

```
let yarrrml = require('@rmlio/yarrrml-parser/lib/rml-generator');

const yaml = "[yarrrml string]";
const y2r = new yarrrml();
const triples = y2r.convert(yaml);
```

## License
This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/) and released under the [MIT license](http://opensource.org/licenses/MIT).
