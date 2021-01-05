const assert = require('assert');
const convertYAMLtoRML = require('./rml-generator.js');
const convertYAMLtoR2RML = require('./r2rml-generator.js');
const fs = require("fs");
const path = require('path');
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
const Logger = require('./logger');

function compareY2RFiles(ymlPaths, ttlPath, options, cb) {
  const yamls = [];

  if (typeof ymlPaths === 'string' || ymlPaths instanceof String) {
    ymlPaths = [ymlPaths];
  }

  for (const ymlPath of ymlPaths) {
    const yarrrml = fs.readFileSync(ymlPath, 'utf8');
    yamls.push({yarrrml});
  }

  const ttl = fs.readFileSync(ttlPath, 'utf8');
  compareY2RData(yamls, ttl, options, cb);
}

function compareY2R2RFiles(ymlPath, ttlPath, options, cb) {
  const yaml = fs.readFileSync(ymlPath, 'utf8');
  const ttl = fs.readFileSync(ttlPath, 'utf8');
  compareY2R2RData(yaml, ttl, options, cb);
}

function compareY2RData(yaml, ttl, options, cb) {
  const y2r = new convertYAMLtoRML(options);
  const yamlQuads = y2r.convert(yaml);
  const rmlQuads = [];
  const parser = new N3.Parser();

  parser.parse(ttl, function (error, quad, prefixes) {
    if (quad)
      rmlQuads.push(quad);
    else {
      try {
        assert(isomorphic(yamlQuads, rmlQuads), true);
      } catch (e) {
        assert.deepStrictEqual(yamlQuads,rmlQuads);
        assert(false, true);
      }
      cb();
    }
  });
}

function compareY2R2RData(yaml, ttl, options, cb) {
  const y2r = new convertYAMLtoR2RML(options);
  const yamlQuads = y2r.convert(yaml);
  const rmlQuads = [];
  const parser = new N3.Parser();

  parser.parse(ttl, function (error, quad, prefixes) {
    if (quad)
      rmlQuads.push(quad);
    else {
      try {
        assert(isomorphic(yamlQuads, rmlQuads), true);
      } catch (e) {
        assert.deepStrictEqual(yamlQuads, rmlQuads);
        assert(false, true);
      }
      cb();
    }
  });
}

function logReadable(triples, base = null, cb = (err, result) => {
  Logger.log(result);
}) {
  let prefixes = {
    rr: 'http://www.w3.org/ns/r2rml#',
    rml: 'http://semweb.mmlab.be/ns/rml#',
    ql: 'http://semweb.mmlab.be/ns/ql#'
  };
  if (base) {
    prefixes[''] = base;
  }
  let writer = new N3.Writer({prefixes});
  makeReadable(triples, writer);
  compareY2RFiles
  writer.end(cb);
}

module.exports = {
  compareY2RFiles,
  compareY2R2RFiles,
};
