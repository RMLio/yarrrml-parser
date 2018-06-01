/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const namespaces = require('prefix-ns').asMap();
const YARRRML2Anything = require('./yarrrml2anything.js');
const formulations = require('./formulations.json');

namespaces.ql = 'http://semweb.mmlab.be/ns/ql#';

class YARRRML2R2RML extends YARRRML2Anything {

  constructor() {
    super();
  }

  convertExpandedJSON(yarrrml) {
    super.convertExpandedJSON(yarrrml);

    const triples = [];

    if (! yarrrml.base) {
      yarrrml.base = "http://mapping.example.com/";
    }

    const baseIRI = yarrrml.base;
    const sourcesIRIMap = {};

    if (yarrrml.sources) {
      Object.keys(yarrrml.sources).forEach(sourceName => {
        sourcesIRIMap[sourceName] = this.generateSource(triples, yarrrml.sources[sourceName], baseIRI, undefined, sourceName);
      });
    }

    Object.keys(yarrrml.mappings).forEach(mappingName => {
      const mapping = yarrrml.mappings[mappingName];

      if (mapping.sources) {
        mapping.sources.forEach(source => {
          const tmSubject = baseIRI + mappingName + this.getUniqueID();
          let sourceSubject;

          if (typeof source === 'string') {
            sourceSubject = sourcesIRIMap[source];

            triples.push({
              subject: tmSubject,
              predicate: namespaces.rml + 'logicalSource',
              object: sourceSubject
            });
          } else {
            sourceSubject = this.generateSource(triples, source, baseIRI, tmSubject);
          }

          this.generateMapping(triples, tmSubject, mapping, baseIRI, mappingName, sourceSubject);
        });
      } else {
        const tmSubject = baseIRI + mappingName;
        this.generateMapping(triples, tmSubject, mapping, baseIRI);
      }
    });

    return triples;
  }

  generateMapping(triples, tmSubject, mapping, baseIRI, mappingName, sourceSubject) {
    triples.push({
      subject: tmSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rml + 'TriplesMap'
    });

    super.generateMapping(triples, tmSubject, mapping, baseIRI, mappingName, sourceSubject);
  }

  generateSource(triples, source, baseIRI, tmSubject, sourceName) {
    const sSubject = baseIRI + this.getUniqueID();

    if (tmSubject) {
      triples.push({
        subject: tmSubject,
        predicate: namespaces.rr + 'logicalTable',
        object: sSubject
      });
    }

    triples.push({
      subject: sSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rr + 'LogicalTable'
    });

    if (sourceName) {
      triples.push({
        subject: sSubject,
        predicate: namespaces.rdfs + 'label',
        object: `"${sourceName}"`
      });
    }

    triples.push({
      subject: sSubject,
      predicate: namespaces.rr + 'sqlQuery',
      object: `"${source.query}"`
    });


    let object = formulations.query[source.queryFormulation];

    triples.push({
      subject: sSubject,
      predicate: namespaces.rr + 'sqlVersion',
      object
    });

    return sSubject;
  }

  generateFnSource(fnSubject, sourceSubject, triples) {
    triples.push({
      subject: fnSubject,
      predicate: namespaces.rr + 'logicalTable',
      object: sourceSubject
    });
  }
}

module.exports = YARRRML2R2RML;