const assert = require('assert');
const convertYAMLtoRML = require('./rml-generator.js');
const convertYAMLtoR2RML = require('./r2rml-generator.js');
const fs = require("fs");
const N3 = require("n3");
const makeReadable = require("./readable-rml.js").makeReadable;
const { isomorphic } = require("rdf-isomorphic");
const Logger = require('./logger');

const ttlRead = require('@graphy/content.ttl.read');
const ttlWrite = require('@graphy/content.ttl.write');
const dataset = require('@graphy/memory.dataset.fast');
const { Readable } = require('stream')
const namespaces = require('./namespaces').asMap();

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
      logCanonical(rmlQuads, y2r.getPrefixes(), y2r.getBaseIRI()).then(() => {
        try {
          assert(isomorphic(yamlQuads, rmlQuads), true);
        } catch (e) {
          assert.equal(yamlQuads.map(q => quadToBadString(q)).sort().join('\n'), rmlQuads.map(q => quadToBadString(q)).sort().join('\n'));
        }
        cb();
      }).catch(cb)
    }
  });
}

function quadToBadString(quad) {
  return `<${quad.subject.value}> <${quad.predicate.value}> <${quad.object.value}>`
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
      logCanonical(rmlQuads, y2r.getPrefixes(), y2r.getBaseIRI()).then(() => {
        try {
          assert(isomorphic(yamlQuads, rmlQuads), true);
        } catch (e) {
          assert.deepStrictEqual(yamlQuads.map(q => q.toString()).sort(), rmlQuads.map(q => q.toString()).sort());
        }
        cb();
      })
    }
  });
}

/**
 * Log canonicalized turtle from quads and (optional) prefixes and base
 * @param {*} triples 
 * @param {*} prefixes 
 * @param {*} base 
 * @returns 
 */
async function logCanonical(triples, prefixes = {}, base = null) {
  let myPrefixes = {
    rr: namespaces.rr,
    rdf: namespaces.rdf,
    rdfs: namespaces.rdfs,
    fnml: namespaces.fnml,
    fno: namespaces.fno,
    d2rq: namespaces.d2rq,
    void: namespaces.void,
    dc: namespaces.dc,
    foaf: namespaces.foaf,
    rml: namespaces.rml,
    ql: namespaces.ql,
  };
  if (base) {
    myPrefixes[''] = base;
  }
  myPrefixes = Object.assign({}, myPrefixes, prefixes);

  let result = await quadsToTurtle(triples, myPrefixes);
  result = await canonicalize(result);
  // Uncomment below if you want to inspect generated RML
  // console.error(result)
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
 * Create a turtle string from quads and (optional) prefixes
 * @param {*} triples 
 * @param {*} prefixes 
 * @returns 
 */
async function quadsToTurtle(triples = [], prefixes = {}) {
  return new Promise((resolve, reject) => {
    const writer = new N3.Writer({ prefixes });

    writer.addQuads(triples);
    writer.end(async (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
      return;
    });
  });
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

/**
 * transform Quads to uniform Turtle (making it easier to compare as strings)
 * @param {Quad[]} quads 
 * @returns {Promise<string>} Turtle string
 */
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
