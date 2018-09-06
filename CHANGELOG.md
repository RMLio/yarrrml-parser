# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

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

[0.2.0]: https://github.com/RMLio/yarrrml-parser/compare/v0.1.6...v0.2.0
[0.1.6]: https://github.com/RMLio/yarrrml-parser/compare/v0.1.5...v0.1.6
