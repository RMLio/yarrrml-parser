const assert = require('assert');
const convertYAMLtoRML = require('./yarrrml2rml.js');
const fs = require("fs");
const N3 = require("n3");
const makeReadable = require("./readable-rml.js").makeReadable;
const rdfExt = require('rdf-ext');
const N3Parser = require('rdf-parser-n3');
const JsonLdSerializerExt = require('rdf-serializer-jsonld-ext');
rdfExt.parsers = rdfExt.parsers || new rdfExt.Parsers();
rdfExt.serializers = rdfExt.serializers || new rdfExt.Serializers();
rdfExt.parsers['text/turtle'] = N3Parser;
rdfExt.serializers['application/json+ld'] = new JsonLdSerializerExt({outputFormat: 'string'});
const {isomorphic} = require("rdf-isomorphic");

function compareY2RFiles(ymlPath, ttlPath, cb) {
  const yaml = fs.readFileSync(ymlPath, 'utf8');
  const ttl = fs.readFileSync(ttlPath, 'utf8');
  compareY2RData(yaml, ttl, cb);
}

function compareY2RData(yaml, ttl, cb) {
  const y2r = new convertYAMLtoRML();
  const yamlQuads = y2r.convert(yaml);
  const rmlQuads = [];
  const parser = N3.Parser();

  parser.parse(ttl, function (error, quad, prefixes) {
    if (quad)
      rmlQuads.push(quad);
    else {
      assert(isomorphic(yamlQuads, rmlQuads), true);
      cb();
    }
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
