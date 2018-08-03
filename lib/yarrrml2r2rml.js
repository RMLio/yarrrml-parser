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

    if (yarrrml.base) {
      this.baseIRI = yarrrml.base;
    }

    const sourcesIRIMap = {};

    if (yarrrml.sources) {
      Object.keys(yarrrml.sources).forEach(sourceName => {
        sourcesIRIMap[sourceName] = this.generateSource(yarrrml.sources[sourceName], undefined, sourceName);
      });
    }

    Object.keys(yarrrml.mappings).forEach(mappingName => {
      const mapping = yarrrml.mappings[mappingName];

      if (mapping.sources) {
        mapping.sources.forEach(source => {
          const tmSubject = this.baseIRI + mappingName + this.getUniqueID();
          let sourceSubject;

          if (typeof source === 'string') {
            sourceSubject = sourcesIRIMap[source];

            triples.push({
              subject: tmSubject,
              predicate: namespaces.rml + 'logicalSource',
              object: sourceSubject
            });
          } else {
            sourceSubject = this.generateSource(source, tmSubject);
          }

          this.generateMapping(tmSubject, mapping, mappingName, sourceSubject);
        });
      } else {
        const tmSubject = this.baseIRI + mappingName;
        this.generateMapping(tmSubject, mapping);
      }
    });

    return triples;
  }

  generateMapping(tmSubject, mapping, mappingName, sourceSubject) {
    this.triples.push({
      subject: tmSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rml + 'TriplesMap'
    });

    super.generateMapping(tmSubject, mapping, mappingName, sourceSubject);
  }

  generateSource(source, tmSubject, sourceName) {
    const sSubject = this.baseIRI + this.getUniqueID();

    if (tmSubject) {
      this.triples.push({
        subject: tmSubject,
        predicate: namespaces.rr + 'logicalTable',
        object: sSubject
      });
    }

    this.triples.push({
      subject: sSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rr + 'LogicalTable'
    });

    if (sourceName) {
      this.triples.push({
        subject: sSubject,
        predicate: namespaces.rdfs + 'label',
        object: `"${sourceName}"`
      });
    }

    this.triples.push({
      subject: sSubject,
      predicate: namespaces.rr + 'sqlQuery',
      object: `"${source.query}"`
    });


    let object = formulations.query[source.queryFormulation];

    this.triples.push({
      subject: sSubject,
      predicate: namespaces.rr + 'sqlVersion',
      object
    });

    return sSubject;
  }

  generateFnSource(fnSubject, sourceSubject) {
    this.triples.push({
      subject: fnSubject,
      predicate: namespaces.rr + 'logicalTable',
      object: sourceSubject
    });
  }
}

module.exports = YARRRML2R2RML;