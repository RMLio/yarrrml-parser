const assert = require('assert');
const convertYAMLtoRML = require('./rml-generator.js');
const convertYAMLtoR2RML = require('./r2rml-generator.js');
const fs = require("fs");
const N3 = require("n3");
const makeReadable = require("./readable-rml.js").makeReadable;
const rdfExt = require('rdf-ext');
const N3Parser = require('rdf-parser-n3');
const JsonLdSerializerExt = require('@rdfjs/serializer-jsonld-ext');
rdfExt.parsers = rdfExt.parsers || new rdfExt.Parsers();
rdfExt.serializers = rdfExt.serializers || new rdfExt.Serializers();
rdfExt.parsers['text/turtle'] = N3Parser;
rdfExt.serializers['application/json+ld'] = new JsonLdSerializerExt({ outputFormat: 'string' });
const { isomorphic } = require("rdf-isomorphic");
const Logger = require('./logger');

const ttlRead = require('@graphy/content.ttl.read');
const ttlWrite = require('@graphy/content.ttl.write');
const dataset = require('@graphy/memory.dataset.fast');
const { Readable } = require('stream')

function compareY2RFiles(ymlPaths, ttlPath, options, cb) {
  const yamls = [];

  if (typeof ymlPaths === 'string' || ymlPaths instanceof String) {
    ymlPaths = [ymlPaths];
  }

  for (const ymlPath of ymlPaths) {
    const yarrrml = fs.readFileSync(ymlPath, 'utf8');
    yamls.push({ yarrrml });
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
    if (error) {
      throw new Error(`Could not parse the test turtle file: ${error}`);
    }
    if (quad)
      rmlQuads.push(quad);
    else {
      try {
        assert(isomorphic(yamlQuads, rmlQuads), true);
      } catch (e) {
        try {
          assert.deepStrictEqual(yamlQuads, rmlQuads);
        } catch (e) {
          (async function () {
            const prettyExpected = await quadsToPrettyTurtle(rmlQuads);
            const prettyResult = await quadsToPrettyTurtle(yamlQuads);
            try {
              assert.equal(prettyResult, prettyExpected);
            } catch (e) {
              console.log('==RESULT==')
              console.log(prettyResult)
              console.log('--EXPECTED--')
              console.log(prettyExpected)
              console.log('====')
              cb(e)
            }
          })().then(() => { cb() }).catch(cb)
        }
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
  let writer = new N3.Writer({ prefixes });
  makeReadable(triples, writer);
  compareY2RFiles
  writer.end(cb);
}

/**
 * Create a pretty-printed turtle string from an ugly turtle string
 * @param {*} ttlString 
 * @returns 
 */
async function canonicalize(ttlString) {
  const stream = Readable.from([ttlString]);
  const outStreamPretty = stream
    .pipe(ttlRead())
    .pipe(dataset({
      canonicalize: false,
    }))
    .pipe(ttlWrite());
  return streamToString(outStreamPretty);
}

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}

async function quadsToPrettyTurtle(quads) {
  return new Promise((resolve, reject) => {
    const writer = new N3.Writer();

    writer.addQuads(quads);
    writer.end(async (error, result) => {
      result = await canonicalize(result);
      // resolve promise
      resolve(result);
    });
  });
}

module.exports = {
  canonicalize,
  compareY2RFiles,
  compareY2R2RFiles,
};
