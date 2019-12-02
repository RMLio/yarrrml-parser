# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

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
