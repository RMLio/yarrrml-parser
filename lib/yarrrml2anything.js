/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const YAML       = require('yamljs');
const expand     = require('./expander.js');
const namespaces = require('prefix-ns').asMap();
const rdfaVocs   = require('./rdfa-context.json')['@context'];

namespaces.ql   = 'http://semweb.mmlab.be/ns/ql#';
namespaces.fnml = 'http://semweb.mmlab.be/ns/fnml#';
namespaces.fno  = 'http://w3id.org/function/ontology#';

class YARRRML2Anything {

  constructor() {
    this.mappingsAndIRIs = {};
    this.referencingObjectMapDetails = {};
  }

  convert(yarrrml) {
    this.counter = {};

    try {
      const json = YAML.parse(yarrrml);
      //expand JSON
      const expandedJSON = expand(json);

      //convert to RML
      return this.convertExpandedJSON(expandedJSON);

      //return JSON.stringify(jsonld);
    } catch(e) {
      e.code = 'INVALID_YAML';
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

  generateMapping(triples, tmSubject, mapping, baseIRI, mappingName, sourceSubject) {

    triples.push({
      subject: tmSubject,
      predicate: namespaces.rdfs + 'label',
      object: `"${mappingName}"`
    });

    if (mapping.subjects) {
      mapping.subjects.forEach(subject => {
        const smSubject = baseIRI + this.getUniqueID('s');

        triples.push({
          subject: smSubject,
          predicate: namespaces.rdf + 'type',
          object: namespaces.rr + 'SubjectMap'
        });

        triples.push({
          subject: tmSubject,
          predicate: namespaces.rr + 'subjectMap',
          object: smSubject
        });

        if (typeof subject === "object") {
          this.generateFunctionTermMap(smSubject, subject, triples, baseIRI, sourceSubject, 'IRI');
        } else {
          triples.push({
            subject: smSubject,
            predicate: namespaces.rr + 'template',
            object: `"${YARRRML2Anything.expandPrefix(YARRRML2Anything.parseTemplate(subject))}"`
          });
        }
      });
    } else {
      //we are dealing with a blank node
      const smSubject = baseIRI + this.getUniqueID('s');
      triples.push({
        subject: smSubject,
        predicate: namespaces.rdf + 'type',
        object: namespaces.rr + 'SubjectMap'
      });

      triples.push({
        subject: tmSubject,
        predicate: namespaces.rr + 'subjectMap',
        object: smSubject
      });

      triples.push({
        subject: smSubject,
        predicate: namespaces.rr + 'termType',
        object: namespaces.rr + 'BlankNode'
      });
    }

    if (mapping.predicateobjects) {
      mapping.predicateobjects.forEach(po => {
        const pomSubject = baseIRI + this.getUniqueID('pom');

        triples.push({
          subject: pomSubject,
          predicate: namespaces.rdf + 'type',
          object: namespaces.rr + 'PredicateObjectMap'
        });

        triples.push({
          subject: tmSubject,
          predicate: namespaces.rr + 'predicateObjectMap',
          object: pomSubject
        });

        po.predicates.forEach(p => {
          const pmSubject = baseIRI + this.getUniqueID('pm');

          triples.push({
            subject: pmSubject,
            predicate: namespaces.rdf + 'type',
            object: namespaces.rr + 'PredicateMap'
          });

          triples.push({
            subject: pomSubject,
            predicate: namespaces.rr + 'predicateMap',
            object: pmSubject
          });

          if (p === 'a') {
            p = namespaces.rdf + 'type';
          } else {
            p = YARRRML2Anything.expandPrefix(p);
          }

          triples.push({
            subject: pmSubject,
            predicate: namespaces.rr + 'constant',
            object: p
          });
        });

        po.objects.forEach(o => {
          const omSubject = baseIRI + this.getUniqueID('om');

          triples.push({
            subject: pomSubject,
            predicate: namespaces.rr + 'objectMap',
            object: omSubject
          });

          if (o.function) {
            this.generateFunctionTermMap(omSubject, o, triples, baseIRI, sourceSubject, 'Literal');
          } else if (o.mapping) {
            //we are dealing with a parenttriplesmap
            this.saveReferencingObjectMapDetails(mappingName, omSubject, o);
          } else {
            YARRRML2Anything.generateNormalObjectMap(omSubject, o, triples);
          }
        });
      });
    }
  }

  static generateNormalObjectMap(omSubject, o, triples) {
    triples.push({
      subject: omSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rr + 'ObjectMap'
    });

    let predicate = namespaces.rr + 'template';

    if (YARRRML2Anything.parseTemplate(o.value) === o.value) {
      predicate = namespaces.rr + 'constant';
    }

    let object = `"${YARRRML2Anything.expandPrefix(YARRRML2Anything.parseTemplate(o.value))}"`;

    triples.push({
      subject: omSubject,
      predicate,
      object
    });

    switch (o.type) {
      case "literal":
        o.type = namespaces.rr + 'Literal';
        break;
      case 'iri':
        o.type = namespaces.rr + 'IRI'
    }

    triples.push({
      subject: omSubject,
      predicate: namespaces.rr + 'termType',
      object: o.type
    });

    if (o.datatype) {
      triples.push({
        subject: omSubject,
        predicate: namespaces.rr + 'datatype',
        object: YARRRML2Anything.expandPrefix(o.datatype)
      });
    }
  }

  generateAllReferencingObjectMap(triples, baseIRI) {
    Object.keys(this.referencingObjectMapDetails).forEach(mappingName => {
      const allDetails = this.referencingObjectMapDetails[mappingName];

      allDetails.forEach(details => {
        this.generateReferencingObjectMap(details.om, details.o, triples, baseIRI);
      });
    });
  };

  generateReferencingObjectMap(omSubject, o, triples, baseIRI) {
    triples.push({
      subject: omSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.rr + 'ObjectMap'
    });

    triples.push({
      subject: omSubject,
      predicate: namespaces.rr + 'parentTriplesMap',
      object: this.mappingsAndIRIs[o.mapping][0]
    });

    if (o.conditions) {
      o.conditions.forEach(condition => {
        if (condition.function === "equal") {
          const joinConditionSubject = baseIRI + this.getUniqueID('jc');

          triples.push({
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

            triples.push({
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

  generateFunctionTermMap(omSubject, o, triples, baseIRI, sourceSubject, termType) {
    triples.push({
      subject: omSubject,
      predicate: namespaces.rdf + 'type',
      object: namespaces.fnml + 'FunctionTermMap'
    });

    if (o.type === 'iri') {
      triples.push({
        subject: omSubject,
        predicate: namespaces.rr + 'termType',
        object: namespaces.rr + 'IRI'
      });
    } else {
      triples.push({
        subject: omSubject,
        predicate: namespaces.rr + 'termType',
        object: namespaces.rr + termType
      });
    }

    const fnSubject = baseIRI + this.getUniqueID('fn');
    const pomExecutesSubject = baseIRI + this.getUniqueID('pomexec');
    const pmExecutesSubject = baseIRI + this.getUniqueID('pmexec');
    const omExecutesSubject = baseIRI + this.getUniqueID('omexec');

    triples.push({
      subject: omSubject,
      predicate: namespaces.fnml + 'functionValue',
      object: fnSubject
    });

    if (sourceSubject) {
      this.generateFnSource(fnSubject, sourceSubject, triples);
    }

    triples.push({
      subject: fnSubject,
      predicate: namespaces.rr + 'predicateObjectMap',
      object: pomExecutesSubject
    });

    triples.push({
      subject: pomExecutesSubject,
      predicate: namespaces.rr + 'predicateMap',
      object: pmExecutesSubject
    });

    triples.push({
      subject: pmExecutesSubject,
      predicate: namespaces.rr + 'constant',
      object: namespaces.fno + 'executes'
    });

    triples.push({
      subject: pomExecutesSubject,
      predicate: namespaces.rr + 'objectMap',
      object: omExecutesSubject
    });

    let predicate = namespaces.rr + 'template';

    // if (YARRRML2Anything.parseTemplate(o.function) === o.function) {
    //   predicate = namespaces.rr + 'constant';
    // }

    let object = `"${YARRRML2Anything.expandPrefix(YARRRML2Anything.parseTemplate(o.function))}"`;

    triples.push({
      subject: omExecutesSubject,
      predicate,
      object
    });

    o.parameters.forEach(pm => {
      const pomSubject = baseIRI + this.getUniqueID('pom');
      const pmSubject = baseIRI + this.getUniqueID('pm');
      const omSubject = baseIRI + this.getUniqueID('om');

      triples.push({
        subject: fnSubject,
        predicate: namespaces.rr + 'predicateObjectMap',
        object: pomSubject
      });

      triples.push({
        subject: pomSubject,
        predicate: namespaces.rdf + 'type',
        object: namespaces.rr + 'PredicateObjectMap'
      });

      triples.push({
        subject: pomSubject,
        predicate: namespaces.rr + 'predicateMap',
        object: pmSubject
      });

      triples.push({
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

      triples.push({
        subject: pmSubject,
        predicate,
        object
      });

      triples.push({
        subject: pomSubject,
        predicate: namespaces.rr + 'objectMap',
        object: omSubject
      });

      triples.push({
        subject: omSubject,
        predicate: namespaces.rdf + 'type',
        object: namespaces.rr + 'ObjectMap'
      });

      predicate = namespaces.rr + 'template';

      if (YARRRML2Anything.parseTemplate(pm.value) === pm.value) {
        predicate = namespaces.rr + 'constant';
      }

      object = `"${YARRRML2Anything.expandPrefix(YARRRML2Anything.parseTemplate(pm.value))}"`;

      triples.push({
        subject: omSubject,
        predicate,
        object
      });
    });
  }

  generateFnSource(fnSubject, sourceSubject, triples) {
    throw new Error('Not implemented yet.');
  }

  static parseTemplate(t) {
    return t.replace(/\$\(([^)]*)\)/g, "{$1}");
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

    if (str.indexOf('http://') !== -1) {
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
    }

    return str;
  }

  addMappingIRI(mappingName, iri) {
    if (!this.mappingsAndIRIs[mappingName]) {
      this.mappingsAndIRIs[mappingName] = [];
    }

    this.mappingsAndIRIs[mappingName].push(iri);
  }
}

module.exports = YARRRML2Anything;