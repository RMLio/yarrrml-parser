/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const getNamespace = require('./namespaces');
const YARRRML2Anything = require('./abstract-generator.js');
const formulations = require('./formulations.json');
const { DataFactory } = require('n3');
const {namedNode, literal, quad} = DataFactory;

class R2RMLGenerator extends YARRRML2Anything {

  constructor(options = null) {
    super(options);
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
      return this.quads;
    }

    Object.keys(yarrrml.mappings).forEach(mappingName => {
      const mapping = yarrrml.mappings[mappingName];

      if (mapping.sources) {
        mapping.sources = [].concat(mapping.sources);
        mapping.sources.forEach(source => {
          const tmSubject = namedNode(this.baseIRI + this.getUniqueID('map_' + mappingName));
          this.addMappingIRI(mappingName, tmSubject);

          let sourceSubject;

          if (typeof source === 'string') {
            sourceSubject = sourcesIRIMap[source];

            this.quads.push(quad(
              tmSubject,
              namedNode(getNamespace('rr') + 'logicalTable'),
              sourceSubject
            ));
          } else {
            sourceSubject = this.generateSource(source, tmSubject);
          }

          this.generateMapping(tmSubject, mapping, mappingName, sourceSubject);
        });
      } else {
        const tmSubject = namedNode(this.baseIRI + mappingName);
        this.generateMapping(tmSubject, mapping, mappingName);
      }
    });

    this.generateAllReferencingObjectMap();
    return this.quads;
  }

  generateMapping(tmSubject, mapping, mappingName, sourceSubject) {
    this.quads.push(quad(
      tmSubject,
      namedNode(getNamespace('rdf') + 'type'),
      namedNode(getNamespace('rr') + 'TriplesMap')
    ));

    super.generateMapping(tmSubject, mapping, mappingName, sourceSubject);
  }

  generateSource(source, tmSubject, sourceName) {
    const sSubject = namedNode(this.baseIRI + this.getUniqueID('source'));

    if (tmSubject) {
      this.quads.push(quad(
        tmSubject,
        namedNode(getNamespace('rr') + 'logicalTable'),
        sSubject
      ));
    }

    this.quads.push(quad(
      sSubject,
      namedNode(getNamespace('rdf') + 'type'),
      namedNode(getNamespace('rr') + 'LogicalTable')
    ));

    if (sourceName) {
      this.quads.push(quad(
        sSubject,
        namedNode(getNamespace('rdfs') + 'label'),
        literal(sourceName)
      ));
    }

    if (source.table) {
      this.quads.push(quad(
        sSubject,
        namedNode(getNamespace('rr') + 'tableName'),
        literal(source.table)
      ));
    }

    if (source.query) {
      this.quads.push(quad(
        sSubject,
        namedNode(getNamespace('rr') + 'sqlQuery'),
        literal(source.query.replace(/\s+/g, ' ').trim())
      ));
    }

    if (source.queryFormulation) {
      let object = namedNode(formulations.query[source.queryFormulation]);

      this.quads.push(quad(
        sSubject,
        namedNode(getNamespace('rr') + 'sqlVersion'),
        object
      ));
    }

    return sSubject;
  }

  generateFnSource(fnSubject, sourceSubject) {
    this.quads.push(quad(
      fnSubject,
      namedNode(getNamespace('rr') + 'logicalTable'),
      sourceSubject
    ));
  }

  getReferenceOnlyPredicate() {
    return namedNode(getNamespace('rr') + 'column');
  }

  generateLanguageTerms(objectMap, value) {
    this.quads.push(quad(
      objectMap,
      namedNode(getNamespace('rr') + 'language'),
      literal(value)
    ));
  }
}

module.exports = R2RMLGenerator;
