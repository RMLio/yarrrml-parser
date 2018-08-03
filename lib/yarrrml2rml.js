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

    if (yarrrml.base) {
      this.baseIRI = yarrrml.base;
    }

    const sourcesIRIMap = {};

    if (yarrrml.sources) {
      Object.keys(yarrrml.sources).forEach(sourceName => {
        sourcesIRIMap[sourceName] = this.generateSource(yarrrml.sources[sourceName], undefined, sourceName);
      });
    }

    if (!yarrrml.mappings) {
      return this.triples;
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

            this.triples.push({
              subject: tmSubject,
              predicate: namespaces.rml + 'logicalSource',
              object: sourcesIRIMap[source]
            });
          } else {
            sourceSubject = this.generateSource(source, tmSubject);
          }

          this.generateMapping(tmSubject, mapping, mappingName, sourceSubject);
        });
      } else {
        const tmSubject = this.baseIRI + mappingName;
        this.generateMapping(tmSubject, mapping, mappingName);
      }
    });

    this.generateAllReferencingObjectMap();
    return this.triples;
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
    const sSubject = this.baseIRI + this.getUniqueID('source');

    if (tmSubject) {
      this.triples.push({
        subject: tmSubject,
        predicate: namespaces.rml + 'logicalSource',
        object: sSubject
      });
    }

    this.triples.push({
      subject: sSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rml + 'LogicalSource'
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
      predicate: namespaces.rml + 'source',
      object: `"${source.access}"`
    });

    if (source.iterator) {
      this.triples.push({
        subject: sSubject,
        predicate: namespaces.rml + 'iterator',
        object: `"${source.iterator}"`
      });
    }

    let object = formulations.reference[source.referenceFormulation];

    this.triples.push({
      subject: sSubject,
      predicate: namespaces.rml + 'referenceFormulation',
      object
    });

    return sSubject;
  }

  generateFnSource(fnSubject, sourceSubject) {
    this.triples.push({
      subject: fnSubject,
      predicate: namespaces.rml + 'logicalSource',
      object: sourceSubject
    });
  }

}

module.exports = YARRRML2RML;