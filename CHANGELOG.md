# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## [1.2.3] - 2021-05-28

### Fixed

- Fix N3 outdated constructor (see [issue 115](https://github.com/RMLio/yarrrml-parser/issues/115))
- updated commander

## [1.2.2] - 2021-02-23

### Added
- Logger to catch convert errors (see [issue 102](https://github.com/RMLio/yarrrml-parser/issues/102))

### Fixed
- Fix invalid input argument type array, in fs.watchFile()
- Fix N3 addTriples() is not a function, in fs.watchFile()
- Cannot find module rml2yarrrml when running yarrrml-generator (see [issue 106](https://github.com/RMLio/yarrrml-parser/issues/106))
    - Language with template not converted to Language Map  (see [issue 107](https://github.com/RMLio/yarrrml-parser/issues/107))

### Changed
- Update dev deps
- Update deps

## [1.2.1] - 2020-09-04

### Fixed
- Fix docker build command in README (see [issue 91](https://github.com/RMLio/yarrrml-parser/issues/91))
- Test example5 is invalid YARRRML (see [issue 93](https://github.com/RMLio/yarrrml-parser/issues/93))
- Mapping TSV files (see [issue 95](https://github.com/RMLio/yarrrml-parser/issues/95))

### Changed
- Update dev deps

## [1.2.0] - 2020-08-17

### Added
- rr:class flag (see [issue 73](https://github.com/RMLio/yarrrml-parser/issues/73))
- Allow multiple input files for the CLI  (see [issue 34](https://github.com/RMLio/yarrrml-parser/issues/34))
- reference formulation for CSS  (see [issue 37](https://github.com/RMLio/yarrrml-parser/issues/37))
- Allow multiple input files for the CLI  (see [issue 34](https://github.com/RMLio/yarrrml-parser/issues/34))
- Overwrite references  (see [issue 35](https://github.com/RMLio/yarrrml-parser/issues/35))
- Support authors (see [issue 87](https://github.com/RMLio/yarrrml-parser/issues/87))

### Fixed
- Condition on mapping when subject has function fails (see [issue 75](https://github.com/RMLio/yarrrml-parser/issues/75))
- Create blank node as object (see [issue 59](https://github.com/RMLio/yarrrml-parser/issues/59))
- Condition on mapping with blank node as subject gives error (see [issue 31](https://github.com/RMLio/yarrrml-parser/issues/31))

### Changed
- Pad suffixes to keep ordering (see [issue 78](https://github.com/RMLio/yarrrml-parser/issues/78))

## [1.1.1] - 2020-05-11

### Fixed
- equal shortcut does not work everywhere (see [issue 51](https://github.com/RMLio/yarrrml-parser/issues/51))
- Conditional predicate-object with datatype (see [issue 69](https://github.com/RMLio/yarrrml-parser/issues/69))

## [1.1.0] - 2020-04-02

### Added
- Issue template for question (see [issue 48](https://github.com/RMLio/yarrrml-parser/issues/48))
- Explain how to install locally for development (see [issue 45](https://github.com/RMLio/yarrrml-parser/issues/45))
- Add function shortcut (see [issue 57](https://github.com/RMLio/yarrrml-parser/issues/57))

### Fixed
- Function with empty parameter list works, but without parameters doesn't get parsed properly  (see [issue 53](https://github.com/RMLio/yarrrml-parser/issues/53))
- Add quotes around rules specific part in error/warning message  (see [issue 52](https://github.com/RMLio/yarrrml-parser/issues/52))

## [1.0.2] - 2020-01-17

### Added
- Test for subject with two references in template
- Issue templates (see [issue 43](https://github.com/RMLio/yarrrml-parser/issues/43))

### Fixed
- Join condition with two references in child/parent is incorrectly parsed (see [issue 44](https://github.com/RMLio/yarrrml-parser/issues/44))

## [1.0.1] - 2020-01-10

### Fixed
- Joining on equal condition with constant value (see [issue 39](https://github.com/RMLio/yarrrml-parser/issues/39))

## [1.0.0] - 2020-01-06

### Added
- Support for RDBs via D2RQ (see [issue 36](https://github.com/RMLio/yarrrml-parser/issues/36))

### Fixed
- FnO namespace

## [0.3.11] - 2019-12-02

### Fixed
- Object is number (see [issue 32](https://github.com/RMLio/yarrrml-parser/issues/32))

## [0.3.10] - 2019-10-28

### Fixed
- Escape brackets (see [issue 27](https://github.com/RMLio/yarrrml-parser/issues/27))

## [0.3.9] - 2019-10-22

### Fixed
- Restore escaped colons (see [issue 25](https://github.com/RMLio/yarrrml-parser/issues/25))

## [0.3.8] - 2019-09-26

### Fixed
- Not all escaped characters were considered when expanding prefix (see [issue 23](https://github.com/RMLio/yarrrml-parser/issues/23))

## [0.3.7] - 2019-08-14

### Added
- Tests for R2RML

### Fixed
- Names of classes and files
- Support one function on subjects directly (= no need to put it in an array)
- Datatype on function result (see [issue 12](https://github.com/RMLio/yarrrml-parser/issues/12))
- Condition on a single object (see [issue 21](https://github.com/RMLio/yarrrml-parser/issues/21))

## [0.3.6] - 2019-08-12

### Fixed
- Condition and function on the same predicate object (see [issue 17](https://github.com/RMLio/yarrrml-parser/issues/17))

## [0.3.5] - 2019-08-05

## Added
- Support templates on predicates

## [0.3.4] - 2019-08-05

### Adding
- Shortcuts for `mappings`

## [0.3.3] - 2019-06-19

### Fixed
- updated mocha to 6.1.4 (security issue with 6.1.3)

## [0.3.2] - 2019-04-15

### Changed
- updated package versions
- removed winston logger

## [0.3.1] - 2019-02-28

### Added
- support condition on mappings (IRIs only), predicateobjects

## [0.3.0] - 2018-12-07

### Added
- rml2yarrrml bin

### Changed
- splitted general bin

## [0.2.3] - 2018-11-07

### Added
- support recursive functions with join conditions

### Fixed
- recursive functions were broken due to changes in [0.2.0]

## [0.2.2] - 2018-10-23

### Fixed
- use rml:reference with Subject Map when needed

## [0.2.1] - 2018-09-26

### Fixed
- correctly process `~iri` and `~literal` for parameter values of functions

## [0.2.0] - 2018-09-06

### Added
- support functions with join conditions

### Changed
- use rml:reference where needed
- updated dependencies

### Fixed
- templates can use `{}` and will be escaped

## [0.1.6] - 2018-08-22

### Added
- Allow sources to also use a string (not only array) to refer to a source

## 0.1.5 - 2018-08-13

### Added
- clearer error when invalid YAML
- warn when source is not defined
- warn when po is not complete
- fix failing test
- support for recursive functions

[1.2.3]: https://github.com/RMLio/yarrrml-parser/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/RMLio/yarrrml-parser/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/RMLio/yarrrml-parser/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/RMLio/yarrrml-parser/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/RMLio/yarrrml-parser/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/RMLio/yarrrml-parser/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/RMLio/yarrrml-parser/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/RMLio/yarrrml-parser/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.11...v1.0.0
[0.3.11]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.10...v0.3.11
[0.3.10]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.9...v0.3.10
[0.3.9]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.8...v0.3.9
[0.3.8]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.7...v0.3.8
[0.3.7]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/RMLio/yarrrml-parser/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/RMLio/yarrrml-parser/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/RMLio/yarrrml-parser/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/RMLio/yarrrml-parser/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/RMLio/yarrrml-parser/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/RMLio/yarrrml-parser/compare/v0.1.6...v0.2.0
[0.1.6]: https://github.com/RMLio/yarrrml-parser/compare/v0.1.5...v0.1.6
