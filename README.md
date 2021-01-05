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
By default, the parser generates RML rules.
If you want to generate R2RML rules add `-f R2RML`.
If you want to use `rr:class` instead of Predicate Object Maps, use the `-c` flag.
You can use multiple input files too: `yarrrml-parser -i rules-1.yml -i rules-2.yml`.
They are converted to a single RML document.
Note that the keys in `prefixes`, `sources`, and `mappings` have to be unique across all files.
`base` can only be set once.
You find an [`test/multiple-input-files`](test/multiple-input-files).
You can overwrite external references via the `-e`.
An external reference starts with `_`.
For example, `-e name=John` will replace all occurrences of `$(_name)` with `John`.
Repeat `-e` for multiple references.
When you do not provide a value for an external reference,
the reference will not be replaced.
You find an example in [`test/template-escape`](test/template-escape).
If you want to use for example `$(_name)` as both an external reference and a normal reference,
then you add a `\` for the latter resulting in `$(\_name)` for the latter.

#### yarrrml-generator

If you want to generate YARRRML rules from an RML document, you do the following: `yarrrml-generator -i rules.rml.ttl`.
The rules will be written to standard output.
If you want to write them to a file, you can add the `-o` option.

### Library

`npm i --save @rmlio/yarrrml-parser`

```javascript
let yarrrml = require('@rmlio/yarrrml-parser/lib/rml-generator');

const yaml = "[yarrrml string]";
const y2r = new yarrrml();
const triples = y2r.convert(yaml);

if ( y2r.getLogger().has('error') ) {
   const logs = y2r.getLogger().getAll();
   ...
}
```

## Development

- Clone this repo.
- Install the dependencies via `npm i`
- Update code, if needed.
- Run the tests via `npm test`
- Make the [CLI](#cli) (based on the code in the cloned repo)
available system-wide via `npm link` (optional).

## Docker

Run (from [DockerHub](https://hub.docker.com/repository/docker/rmlio/yarrrml-parser)):

```bash
docker run --rm -it -v $(pwd)/resources:/data rmlio/yarrrml-parser:latest -i /data/test.yarrr.yml
```

Build from source:

```bash
docker build -t yarrrml-parser .
```

## License

This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/) and released under the [MIT license](http://opensource.org/licenses/MIT).
