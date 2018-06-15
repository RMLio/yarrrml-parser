/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const namespaces = require('prefix-ns').asMap();
const YARRRML2Anything = require('./yarrrml2anything.js');
const formulations = require('./formulations.json');

namespaces.ql = 'http://semweb.mmlab.be/ns/ql#';

class YARRRML2RML extends YARRRML2Anything {

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
        sourcesIRIMap[sourceName] = this.generateSource(triples, yarrrml.sources[sourceName], this.baseIRI, undefined, sourceName);
      });
    }

    if (!yarrrml.mappings) {
      return triples;
    }

    Object.keys(yarrrml.mappings).forEach(mappingName => {
      const mapping = yarrrml.mappings[mappingName];

      if (mapping.sources) {
        mapping.sources = [].concat(mapping.sources);
        mapping.sources.forEach(source => {
          const tmSubject = this.baseIRI + this.getUniqueID('map_' + mappingName);
          this.addMappingIRI(mappingName, tmSubject);

          let sourceSubject;

          if (typeof source === 'string') {
            sourceSubject = sourcesIRIMap[source];

            triples.push({
              subject: tmSubject,
              predicate: namespaces.rml + 'logicalSource',
              object: sourcesIRIMap[source]
            });
          } else {
            sourceSubject = this.generateSource(triples, source, this.baseIRI, tmSubject);
          }

          this.generateMapping(triples, tmSubject, mapping, this.baseIRI, mappingName, sourceSubject);
        });
      } else {
        const tmSubject = this.baseIRI + mappingName;
        this.generateMapping(triples, tmSubject, mapping, this.baseIRI, mappingName);
      }
    });

    this.generateAllReferencingObjectMap(triples, this.baseIRI);
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
    const sSubject = baseIRI + this.getUniqueID('source');

    if (tmSubject) {
      triples.push({
        subject: tmSubject,
        predicate: namespaces.rml + 'logicalSource',
        object: sSubject
      });
    }

    triples.push({
      subject: sSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rml + 'LogicalSource'
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
      predicate: namespaces.rml + 'source',
      object: `"${source.access}"`
    });

    if (source.iterator) {
      triples.push({
        subject: sSubject,
        predicate: namespaces.rml + 'iterator',
        object: `"${source.iterator}"`
      });
    }

    let object = formulations.reference[source.referenceFormulation];

    triples.push({
      subject: sSubject,
      predicate: namespaces.rml + 'referenceFormulation',
      object
    });

    return sSubject;
  }

  generateFnSource(fnSubject, sourceSubject, triples) {
    triples.push({
      subject: fnSubject,
      predicate: namespaces.rml + 'logicalSource',
      object: sourceSubject
    });
  }

}

module.exports = YARRRML2RML;