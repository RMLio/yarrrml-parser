/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const assert = require('assert');
const toYARRRML = require('./yarrrml-generator.js');
const namespaces = require('prefix-ns').asMap();
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

  it('Works for rml2yarrrml_1', (done) => {
    const rml = fs.readFileSync(path.resolve(__dirname, '../test/rml2yarrrml_1/mapping_reverse.ttl'), 'utf8');
    const parser = new N3.Parser();
    const quads = [];

    parser.parse(rml, (err, quad, prefixes) => {
      if (quad) {
        quads.push(quad);
      } else {
        toYARRRML(quads, prefixes).then(str => {
          const output = fs.readFileSync(path.resolve(__dirname, '../test/rml2yarrrml_1/mappings.yarrrml'), 'utf8');
          try {
          assert.strictEqual(str.replace(/\r\n|\r|\n/g, '\n'), output.replace(/\r\n|\r|\n/g, '\n'));
          } catch (e)
          {
            return done(e);
          }
          return done();
        });
      }
    });
  });
});
