/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const assert = require('assert');
const toYARRRML = require('./yarrrml-generator.js');
const fs = require('fs');
const path = require('path');
const N3 = require('n3');

describe('RML2YARRRML', () => {
  //   it('#1', () => {
  //     const rml = [
  //       {subject: namespaces.ex + 'TM1', predicate: namespaces.rdf + 'type', object: namespaces.rr + 'TriplesMap'},
  //       {subject: namespaces.ex + 'TM1', predicate: namespaces.rdfs + 'label', object: '"person"'},
  //       {subject: namespaces.ex + 'TM1', predicate: namespaces.rr + 'subjectMap', object: namespaces.ex + 'SM1'},
  //       {subject: namespaces.ex + 'SM1', predicate: namespaces.rr + 'template', object: '"http://example.com/{ID}"'}
  //     ];
  //
  //     const yarrrml = `mappings:
  //   person:
  //     s: 'http://example.com/$(ID)'
  // `;
  //
  //     return toYARRRML(rml).then(str => {
  //       assert.equal(str, yarrrml);
  //     });
  //   });

  //   it('#2', () => {
  //     const rml = [
  //       {subject: namespaces.ex + 'TM1', predicate: namespaces.rdf + 'type', object: namespaces.rr + 'TriplesMap'},
  //       {subject: namespaces.ex + 'TM1', predicate: namespaces.rdfs + 'label', object: '"person"'},
  //       {subject: namespaces.ex + 'TM1', predicate: namespaces.rr + 'predicateObjectMap', object: namespaces.ex + 'POM1'},
  //       {subject: namespaces.ex + 'POM1', predicate: namespaces.rr + 'predicateMap', object: namespaces.ex + 'PM1'},
  //       {subject: namespaces.ex + 'PM1', predicate: namespaces.rr + 'constant', object: namespaces.foaf + 'name'},
  //       {subject: namespaces.ex + 'POM1', predicate: namespaces.rr + 'objectMap', object: namespaces.ex + 'OM1'},
  //       {subject: namespaces.ex + 'OM1', predicate: namespaces.rml + 'reference', object: '"Firstname"'},
  //     ];
  //
  //     const yarrrml = `mappings:
  //   person:
  //     po:
  //       - ['foaf:name', $(Firstname)]
  // `;
  //
  //     return toYARRRML(rml).then(str => {
  //       //console.log(str);
  //       assert.equal(str, yarrrml);
  //     });
  //   });

  it('Works for simple mappings', async () => {
    const str = await toYARRRMLFromFile(path.resolve(__dirname, '../test/rml2yarrrml/1_simple/mapping.rml.ttl'));
    const output = fs.readFileSync(path.resolve(__dirname, '../test/rml2yarrrml/1_simple/mapping.yarrrml.yml'), 'utf8');
    assert.strictEqual(str.replace(/\r\n|\r|\n/g, '\n'), output.replace(/\r\n|\r|\n/g, '\n'));
  });

  it('Works for regular joins across mappings', async () => {
    const str = await toYARRRMLFromFile(path.resolve(__dirname, '../test/rml2yarrrml/2_joins/mapping.rml.ttl'));
    const output = fs.readFileSync(path.resolve(__dirname, '../test/rml2yarrrml/2_joins/mapping.yarrrml.yml'), 'utf8');
    assert.strictEqual(str.replace(/\r\n|\r|\n/g, '\n'), output.replace(/\r\n|\r|\n/g, '\n'));
  });
});

async function toYARRRMLFromFile(rmlFilePath) {
  const rml = await fs.promises.readFile(rmlFilePath, 'utf8');
  const { quads, prefixes } = await parseTurtleN3Promise(rml);
  return await toYARRRML(quads, prefixes);
}

async function parseTurtleN3Promise(turtleString) {
  return new Promise((resolve, reject) => {
    const parser = new N3.Parser();
    const quads = [];

    parser.parse(turtleString, (err, quad, prefixes) => {
      if (err) {
        return reject(err);
      }
      if (quad) {
        quads.push(quad);
      } else {
        return resolve({ quads, prefixes });
      }
    })
  })
}
