const assert = require('assert');
const convertYAMLtoRML = require('./yarrrml2rml.js');
const fs = require("fs");
const N3 = require("n3");
const makeReadable = require("./readable-rml.js").makeReadable;
const jsonld = require('jsonld');
const Readable = require('stream').Readable;
const rdfExt = require('rdf-ext');
const N3Parser = require('rdf-parser-n3');
const JsonLdSerializerExt = require('rdf-serializer-jsonld-ext');
rdfExt.parsers = rdfExt.parsers || new rdfExt.Parsers();
rdfExt.serializers = rdfExt.serializers || new rdfExt.Serializers();
rdfExt.parsers['text/turtle'] = N3Parser;
rdfExt.serializers['application/json+ld'] = new JsonLdSerializerExt({outputFormat: 'string'});

function compareY2RFiles(ymlPath, ttlPath, cb) {
  const yaml = fs.readFileSync(ymlPath, 'utf8');
  const ttl = fs.readFileSync(ttlPath, 'utf8');
  compareY2RData(yaml, ttl, cb);
}

function compareY2RData(yaml, ttl, cb) {
  const y2r = new convertYAMLtoRML();
  const yamlTriples = y2r.convert(yaml);
  logReadable(yamlTriples, y2r.baseIRI, (err, result) => {
    const rmlTriples = [];
    const parser = N3.Parser();
    parser.parse(ttl, function (error, triple, prefixes) {
      if (triple)
        rmlTriples.push(triple);
      else {
        logReadable(rmlTriples, y2r.baseIRI, (err, rmlResult) => {
          return compareRDF(result, rmlResult, cb);
        });
      }
    });
  });
}

function compareRDF(ttl1, ttl2, cb) {
  jsonld.fromRDF(ttl1, {format: 'text/turtle'}, function (err, json1) {
    jsonld.fromRDF(ttl2, {format: 'text/turtle'}, function (err, json2) {
      jsonld.normalize(json1, {
        algorithm: 'URDNA2015',
        format: 'application/nquads'
      }, function (err, normalized1) {
        jsonld.normalize(json2, {
          algorithm: 'URDNA2015',
          format: 'application/nquads'
        }, function (err, normalized2) {
          try {
            assert.equal(normalized1, normalized2);
          } catch (e) {
            return cb(e);
          }
          return cb();
        });
      });
    });
  });
}

function logReadable(triples, base = null, cb = (err, result) => {
  console.log(result);
}) {
  let prefixes = {
    rr: 'http://www.w3.org/ns/r2rml#',
    rml: 'http://semweb.mmlab.be/ns/rml#',
    ql: 'http://semweb.mmlab.be/ns/ql#'
  };
  if (base) {
    prefixes[''] = base;
  }
  let writer = N3.Writer({prefixes});
  makeReadable(triples, writer);
  writer.end(cb);
}

module.exports = {
  compareY2RFiles,
  compareY2RData
};
