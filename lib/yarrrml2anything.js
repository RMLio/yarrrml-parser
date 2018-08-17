/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const YAML       = require('yamljs');
const expand     = require('./expander.js');
const namespaces = require('prefix-ns').asMap();
const rdfaVocs   = require('./rdfa-context.json')['@context'];

namespaces.ql   = 'http://semweb.mmlab.be/ns/ql#';

class YARRRML2Anything {

  constructor() {
    this.mappingsAndIRIs = {};
    this.referencingObjectMapDetails = {};
    this.prefixes = {};
    this.baseIRI = 'http://mapping.example.com/';
    this.triples = [];
  }

  convert(yarrrml) {
    this.counter = {};
    let json;

    try {
      json = YAML.parse(yarrrml);
    } catch(e) {
      e.code = 'INVALID_YAML';
      throw e;
    }

    try {
      //expand JSON
      const expandedJSON = expand(json);

      if (expandedJSON.prefixes) {
        this.prefixes = expandedJSON.prefixes;
      }

      //convert to RML
      return this.convertExpandedJSON(expandedJSON);

      //return JSON.stringify(jsonld);
    } catch(e) {
      e.code = 'INVALID_YARRRML';
      throw e;
    }
  }

  convertExpandedJSON(yarrrml) {
    if (yarrrml.prefixes) {
      Object.keys(yarrrml.prefixes).forEach(prefix => {
        rdfaVocs[prefix] = yarrrml.prefixes[prefix];
      });
    }
  }

  generateMapping(tmSubject, mapping, mappingName, sourceSubject) {

    this.triples.push({
      subject: tmSubject,
      predicate: namespaces.rdfs + 'label',
      object: `"${mappingName}"`
    });

    if (mapping.subjects) {
      mapping.subjects.forEach(subject => {
        const smSubject = this.baseIRI + this.getUniqueID('s');

        this.triples.push({
          subject: smSubject,
          predicate: namespaces.rdf + 'type',
          object: namespaces.rr + 'SubjectMap'
        });

        this.triples.push({
          subject: tmSubject,
          predicate: namespaces.rr + 'subjectMap',
          object: smSubject
        });

        if (typeof subject === "object") {
          this.generateFunctionTermMap(smSubject, subject, sourceSubject, 'IRI');
        } else {
          this.triples.push({
            subject: smSubject,
            predicate: namespaces.rr + 'template',
            object: `"${YARRRML2Anything.expandPrefix(YARRRML2Anything.parseTemplate(subject))}"`
          });
        }

        if (mapping.graphs) {
          mapping.graphs.forEach(graph => {
            this.generateGraphMap(smSubject, graph, sourceSubject);
          });
        }
      });
    } else {
      //we are dealing with a blank node
      const smSubject = this.baseIRI + this.getUniqueID('s');
      this.triples.push({
        subject: smSubject,
        predicate: namespaces.rdf + 'type',
        object: namespaces.rr + 'SubjectMap'
      });

      this.triples.push({
        subject: tmSubject,
        predicate: namespaces.rr + 'subjectMap',
        object: smSubject
      });

      this.triples.push({
        subject: smSubject,
        predicate: namespaces.rr + 'termType',
        object: namespaces.rr + 'BlankNode'
      });
    }

    if (mapping.predicateobjects) {
      mapping.predicateobjects.forEach(po => {
        const pomSubject = this.baseIRI + this.getUniqueID('pom');

        this.triples.push({
          subject: pomSubject,
          predicate: namespaces.rdf + 'type',
          object: namespaces.rr + 'PredicateObjectMap'
        });

        this.triples.push({
          subject: tmSubject,
          predicate: namespaces.rr + 'predicateObjectMap',
          object: pomSubject
        });

        let isPredicateRDFTYPE = false;

        po.predicates.forEach(p => {
          const pmSubject = this.baseIRI + this.getUniqueID('pm');

          this.triples.push({
            subject: pmSubject,
            predicate: namespaces.rdf + 'type',
            object: namespaces.rr + 'PredicateMap'
          });

          this.triples.push({
            subject: pomSubject,
            predicate: namespaces.rr + 'predicateMap',
            object: pmSubject
          });

          if (p === 'a') {
            p = namespaces.rdf + 'type';
            isPredicateRDFTYPE = true;
          } else {
            p = YARRRML2Anything.expandPrefix(p);
          }

          this.triples.push({
            subject: pmSubject,
            predicate: namespaces.rr + 'constant',
            object: p
          });
        });

        po.objects.forEach(o => {
          const omSubject = this.baseIRI + this.getUniqueID('om');

          this.triples.push({
            subject: pomSubject,
            predicate: namespaces.rr + 'objectMap',
            object: omSubject
          });

          if (o.function) {
            if (isPredicateRDFTYPE) {
              o.type = 'iri';
            }

            this.generateFunctionTermMap(omSubject, o, sourceSubject, 'Literal');
          } else if (o.mapping) {
            //we are dealing with a parenttriplesmap
            this.saveReferencingObjectMapDetails(mappingName, omSubject, o);
          } else {
            this.generateNormalObjectMap(omSubject, o);
          }
        });

        if (po.graphs) {
          po.graphs.forEach(graph => {
            this.generateGraphMap(pomSubject, graph, sourceSubject);
          });
        }
      });
    }
  }

  generateNormalObjectMap(omSubject, o) {
    this.triples.push({
      subject: omSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rr + 'ObjectMap'
    });

    let predicate = namespaces.rr + 'template';

    if (YARRRML2Anything.parseTemplate(o.value) === o.value) {
      predicate = namespaces.rr + 'constant';
    }

    let object = `"${YARRRML2Anything.expandPrefix(YARRRML2Anything.parseTemplate(o.value))}"`;

    this.triples.push({
      subject: omSubject,
      predicate,
      object
    });

    switch (o.type) {
      case 'iri':
        o.type = namespaces.rr + 'IRI';
        break;
      case "literal":
      default:
        o.type = namespaces.rr + 'Literal';
        break;
    }

    this.triples.push({
      subject: omSubject,
      predicate: namespaces.rr + 'termType',
      object: o.type
    });

    if (o.datatype) {
      this.triples.push({
        subject: omSubject,
        predicate: namespaces.rr + 'datatype',
        object: YARRRML2Anything.expandPrefix(o.datatype)
      });
    } else if (o.language) {
      this.triples.push({
        subject: omSubject,
        predicate: namespaces.rr + 'language',
        object: `"${o.language}"`
      });
    }
  }

  generateAllReferencingObjectMap() {
    Object.keys(this.referencingObjectMapDetails).forEach(mappingName => {
      const allDetails = this.referencingObjectMapDetails[mappingName];

      allDetails.forEach(details => {
        this.generateReferencingObjectMap(details.om, details.o);
      });
    });
  };

  generateReferencingObjectMap(omSubject, o) {
    this.triples.push({
      subject: omSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rr + 'ObjectMap'
    });

    this.triples.push({
      subject: omSubject,
      predicate: namespaces.rr + 'parentTriplesMap',
      object: this.mappingsAndIRIs[o.mapping][0]
    });

    if (o.conditions) {
      o.conditions.forEach(condition => {
        if (condition.function === "equal") {
          const joinConditionSubject = this.baseIRI + this.getUniqueID('jc');

          this.triples.push({
            subject: omSubject,
            predicate: namespaces.rr + 'joinCondition',
            object: joinConditionSubject
          });

          condition.parameters.forEach(parameter => {
            let predicate;

            if (YARRRML2Anything.expandPrefix(parameter.parameter) === 'str1') {
              predicate = namespaces.rr + 'child';
            } else {
              predicate = namespaces.rr + 'parent';
            }

            this.triples.push({
              subject: joinConditionSubject,
              predicate,
              object: `"${parameter.value.substr(2).slice(0, -1)}"`
            });
          });
        }
      });
    }
  }

  saveReferencingObjectMapDetails(mappingName, om, o) {
    if (!this.referencingObjectMapDetails[mappingName]) {
      this.referencingObjectMapDetails[mappingName] = [];
    }

    this.referencingObjectMapDetails[mappingName].push({
      om, o
    });
  }

  generateFunctionTermMap(omSubject, o, sourceSubject, termType) {
    this.triples.push({
      subject: omSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.fnml + 'FunctionTermMap'
    });

    if (o.type === 'iri') {
      this.triples.push({
        subject: omSubject,
        predicate: namespaces.rr + 'termType',
        object: namespaces.rr + 'IRI'
      });
    } else if (termType) {
      this.triples.push({
        subject: omSubject,
        predicate: namespaces.rr + 'termType',
        object: namespaces.rr + termType
      });
    }

    const fnSubject = this.baseIRI + this.getUniqueID('fn');
    const pomExecutesSubject = this.baseIRI + this.getUniqueID('pomexec');
    const pmExecutesSubject = this.baseIRI + this.getUniqueID('pmexec');
    const omExecutesSubject = this.baseIRI + this.getUniqueID('omexec');

    this.triples.push({
      subject: omSubject,
      predicate: namespaces.fnml + 'functionValue',
      object: fnSubject
    });

    if (sourceSubject) {
      this.generateFnSource(fnSubject, sourceSubject);
    }

    this.triples.push({
      subject: fnSubject,
      predicate: namespaces.rr + 'predicateObjectMap',
      object: pomExecutesSubject
    });

    this.triples.push({
      subject: pomExecutesSubject,
      predicate: namespaces.rr + 'predicateMap',
      object: pmExecutesSubject
    });

    this.triples.push({
      subject: pmExecutesSubject,
      predicate: namespaces.rr + 'constant',
      object: namespaces.fno + 'executes'
    });

    this.triples.push({
      subject: pomExecutesSubject,
      predicate: namespaces.rr + 'objectMap',
      object: omExecutesSubject
    });

    let predicate = namespaces.rr + 'template';

    // if (YARRRML2Anything.parseTemplate(o.function) === o.function) {
    //   predicate = namespaces.rr + 'constant';
    // }

    let object = `"${YARRRML2Anything.expandPrefix(YARRRML2Anything.parseTemplate(o.function))}"`;

    this.triples.push({
      subject: omExecutesSubject,
      predicate,
      object
    });

    o.parameters.forEach(pm => {
      const pomSubject = this.baseIRI + this.getUniqueID('pom');
      const pmSubject = this.baseIRI + this.getUniqueID('pm');
      const omSubject = this.baseIRI + this.getUniqueID('om');

      this.triples.push({
        subject: fnSubject,
        predicate: namespaces.rr + 'predicateObjectMap',
        object: pomSubject
      });

      this.triples.push({
        subject: pomSubject,
        predicate: namespaces.rdf + 'type',
        object: namespaces.rr + 'PredicateObjectMap'
      });

      this.triples.push({
        subject: pomSubject,
        predicate: namespaces.rr + 'predicateMap',
        object: pmSubject
      });

      this.triples.push({
        subject: pmSubject,
        predicate: namespaces.rdf + 'type',
        object: namespaces.rr + 'PredicateMap'
      });

      let predicate = namespaces.rr + 'template';
      let object = `${YARRRML2Anything.expandPrefix(YARRRML2Anything.parseTemplate(pm.parameter))}`;

      if (YARRRML2Anything.parseTemplate(pm.parameter) === pm.parameter) {
        predicate = namespaces.rr + 'constant';
      } else {
        object = `"${object}"`;
      }

      this.triples.push({
        subject: pmSubject,
        predicate,
        object
      });

      this.triples.push({
        subject: pomSubject,
        predicate: namespaces.rr + 'objectMap',
        object: omSubject
      });

      this.triples.push({
        subject: omSubject,
        predicate: namespaces.rdf + 'type',
        object: namespaces.rr + 'ObjectMap'
      });

      if (pm.value instanceof Object) {
        this.generateFunctionTermMap(omSubject, pm.value, sourceSubject);
      } else {
        predicate = namespaces.rr + 'template';

        if (YARRRML2Anything.parseTemplate(pm.value) === pm.value) {
          predicate = namespaces.rr + 'constant';
        }

        object = `"${YARRRML2Anything.expandPrefix(YARRRML2Anything.parseTemplate(pm.value))}"`;

        this.triples.push({
          subject: omSubject,
          predicate,
          object
        });
      }
    });
  }

  generateGraphMap(subject, graph, sourceSubject) {
    const graphMapSubject = this.baseIRI + this.getUniqueID('gm');

    this.triples.push({
      subject,
      predicate: namespaces.rr + 'graphMap',
      object: graphMapSubject
    });

    this.triples.push({
      subject: graphMapSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rr + 'GraphMap'
    });

    if (typeof graph === "object") {
      this.generateFunctionTermMap(graphMapSubject, graph, sourceSubject, 'IRI');
    } else {
      this.triples.push({
        subject: graphMapSubject,
        predicate: namespaces.rr + 'template',
        object: `"${YARRRML2Anything.expandPrefix(YARRRML2Anything.parseTemplate(graph))}"`
      });
    }
  }

  generateFnSource(fnSubject, sourceSubject) {
    throw new Error('Not implemented yet.');
  }

  static parseTemplate(t) {
    return ('' + t).replace(/\$\(([^)]*)\)/g, "{$1}");
  }

  getUniqueID(prefix = '') {
    if (!prefix) {
      prefix = 'id';
    }

    if (!this.counter[prefix]) {
      this.counter[prefix] = 0;
    }
    const id = this.counter[prefix];
    this.counter[prefix]++;

    return `${prefix}_${id}`;
  }

  static expandPrefix(str) {
    if (!(typeof(str) === 'string' || str instanceof String)) {
      return str;
    }

    if (str.indexOf('http://') !== -1 || str.indexOf('https://') !== -1) {
      return str;
    }

    const splits = str.split(':');

    if (splits.length === 1) {
      return str;
    }

    if (splits[1].charAt(0) === ' ') {
      return str;
    }

    if (rdfaVocs[splits[0]]) {
      return rdfaVocs[splits[0]] + splits[1];
    } else {
      console.error(`prefix ${splits[0]} was not found.`);
    }

    return str;
  }

  addMappingIRI(mappingName, iri) {
    if (!this.mappingsAndIRIs[mappingName]) {
      this.mappingsAndIRIs[mappingName] = [];
    }

    this.mappingsAndIRIs[mappingName].push(iri);
  }

  getPrefixes() {
    return this.prefixes;
  }

  getBaseIRI() {
    return this.baseIRI;
  }
}

module.exports = YARRRML2Anything;