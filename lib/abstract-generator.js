/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const YAML = require('yamljs');
const expand = require('./expander.js');
const namespaces = require('prefix-ns').asMap();
const rdfaVocs = require('./rdfa-context.json')['@context'];
const {DataFactory} = require('n3');
const {namedNode, literal, quad} = DataFactory;
const Logger = require('./logger');

namespaces.ql = 'http://semweb.mmlab.be/ns/ql#';
namespaces.fnml = 'http://semweb.mmlab.be/ns/fnml#';
namespaces.fno = 'https://w3id.org/function/ontology#';

class AbstractGenerator {

  constructor(options = null) {
    this.mappingsAndIRIs = {};
    this.referencingObjectMapDetails = {};
    this.prefixes = {};
    this.baseIRI = 'http://mapping.example.com/';
    this.quads = [];
    this.options = {...{class: false, externalReferences: {}, includeMetadata: true}, ...options}
    this.externalReferences = this.options.externalReferences;
    this.authors = [];
    Logger.clear();
  }

  /**
   * This method converts YARRRML to another set of rules.
   * @param yarrrml {string|array} This is either an array of objects {yarrrml, file} that need to be converted or
   * a single YARRRML string.
   */
  convert(yarrrml) {
    // To make it backwards compatible.
    if (typeof yarrrml === 'string' || yarrrml instanceof String) {
      yarrrml = [{yarrrml}];
    }

    this.counter = {};
    const expandedJSONs = [];

    for (const el of yarrrml) {
      const {yarrrml, file} = el;

      let json;

      try {
        json = YAML.parse(yarrrml);
      } catch (e) {
        e.code = 'INVALID_YAML';
        e.file = file
        throw e;
      }

      try {
        const expandedJSON = expand(json);
        if (expandedJSON.external) {
          this.externalReferences = {...this.externalReferences, ...expandedJSON.external};
        }

        if (expandedJSON.authors) {
          this.authors = this.authors.concat(expandedJSON.authors);
        }

        expandedJSONs.push(expandedJSON);
      } catch (e) {
        e.code = 'INVALID_YARRRML';
        throw e;
      }
    }

    const combinedExpandedJSON = this._combineExpandedJSONs(expandedJSONs);
    this.prefixes = combinedExpandedJSON.prefixes;
    this.externalReferences = {...this.externalReferences, ...this.options.externalReferences};

    //convert to RML
    return this.convertExpandedJSON(combinedExpandedJSON);
  }

  convertExpandedJSON(yarrrml) {
    if (yarrrml.prefixes) {
      Object.keys(yarrrml.prefixes).forEach(prefix => {
        rdfaVocs[prefix] = yarrrml.prefixes[prefix];
      });
    }

    if (this.options.includeMetadata) {
      this._generateDatasetDescription(this.authors);
    }
  }

  /**
   * This method combines multiple expanded JSONs in a single one.
   * @param expandedJSONs An array of expanded JSONs that need to be combined.
   * @returns {{mappings: {}, prefixes: {}, sources: {}}} The combined expanded JSON.
   * @private
   */
  _combineExpandedJSONs(expandedJSONs) {
    const result = {mappings: {}, prefixes: {}, sources: {}};

    for (const json of expandedJSONs) {
      this._addSourceValuesToTarget(json.mappings, result.mappings, 'Mapping');
      this._addSourceValuesToTarget(json.prefixes, result.prefixes, 'Prefix');
      this._addSourceValuesToTarget(json.sources, result.sources, 'Source');

      if (json.base) {
        if (result.base) {
          Logger.warn(`Base is multiple times defined. Using only "${result.base}".`);
        } else {
          result.base = json.base;
        }
      }
    }

    return result;
  }

  /**
   * This method adds all key-values from a source object to a target object.
   * Warning messages are outputted if a key already exists in the target object.
   * In this case the value in the target object for that key is preserved.
   * @param sourceObj {object} The object from which the key-value pairs are read.
   * @param targetObj {object} The object to which the non-existing key-value pairs are added.
   * @param messageValue {string} The type of key. This is used in the warning message.
   * @private
   */
  _addSourceValuesToTarget(sourceObj, targetObj, messageValue) {
    for (const key in sourceObj) {
      if (targetObj[key]) {
        Logger.warn(`${messageValue} with key "${key}" is multiple times defined. Using only fist occurrence.`);
      } else {
        targetObj[key] = sourceObj[key];
      }
    }
  }

  generateMapping(tmSubject, mapping, mappingName, sourceSubject) {

    this.quads.push(quad(
      tmSubject,
      namedNode(namespaces.rdfs + 'label'),
      literal(mappingName)
    ));

    const subjectMaps = []

    mapping.subjects.forEach(subject => {
      const smSubject = namedNode(this.baseIRI + this.getUniqueID('s'));

      this.quads.push(quad(
        smSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.rr + 'SubjectMap')
      ));

      this.quads.push(quad(
        tmSubject,
        namedNode(namespaces.rr + 'subjectMap'),
        smSubject
      ));

      if (typeof subject === "object") {
        if (subject.function) {
          this.generateFunctionTermMap(smSubject, subject, sourceSubject, subject.type === 'iri' ? 'IRI' : 'BlankNode');
        } else {
          this.quads.push(quad(
            smSubject,
            namedNode(namespaces.rr + 'termType'),
            namedNode(namespaces.rr + 'BlankNode')
          ));
        }
      } else {
        const {predicate, object} = this.getAppropriatePredicateAndObjectForValue(subject);
        this.quads.push(quad(
          smSubject,
          predicate,
          object
        ));
      }

      if (mapping.graphs) {
        mapping.graphs.forEach(graph => {
          this.generateGraphMap(smSubject, graph, sourceSubject);
        });
      }
      subjectMaps.push(smSubject);
    });

    if (mapping.predicateobjects) {
      mapping.predicateobjects.forEach(po => {

        if (this.options.class && // flag
          po.predicates.length === 1 && // only one predicate
          po.predicates[0].indexOf('$(') === -1 && // without template, ie, a constant value
          ['a', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'].indexOf(AbstractGenerator.expandPrefix(po.predicates[0])) !== -1 && // is `a` or `rdf:type`
          po.objects.filter(o => o.function).length === 0 && // no functions
          po.objects.filter(o => o.mapping).length === 0 // no mappings
        ) {
          subjectMaps.forEach(sMap => {
            po.objects.forEach(o => {
              const {object} = this.getAppropriatePredicateAndObjectForValue(o.value, true);
              this.quads.push(quad(
                sMap,
                namedNode(namespaces.rr + 'class'),
                object
              ));
            });
          });
          return;
        }

        const pomSubject = namedNode(this.baseIRI + this.getUniqueID('pom'));


        this.quads.push(quad(
          pomSubject,
          namedNode(namespaces.rdf + 'type'),
          namedNode(namespaces.rr + 'PredicateObjectMap')
        ));

        this.quads.push(quad(
          tmSubject,
          namedNode(namespaces.rr + 'predicateObjectMap'),
          pomSubject
        ));

        let isPredicateRDFTYPE = false;

        po.predicates.forEach(p => {
          const pmSubject = namedNode(this.baseIRI + this.getUniqueID('pm'));

          this.quads.push(quad(
            pmSubject,
            namedNode(namespaces.rdf + 'type'),
            namedNode(namespaces.rr + 'PredicateMap')
          ));

          this.quads.push(quad(
            pomSubject,
            namedNode(namespaces.rr + 'predicateMap'),
            pmSubject
          ));

          let appropriatePO;

          if (p === 'a') {
            appropriatePO = {
              object: namedNode(namespaces.rdf + 'type'),
              predicate: namedNode(namespaces.rr + 'constant')
            };
            isPredicateRDFTYPE = true;
          } else {
            appropriatePO = this.getAppropriatePredicateAndObjectForValue(p, true);
          }

          this.quads.push(quad(
            pmSubject,
            appropriatePO.predicate,
            appropriatePO.object
          ));
        });

        po.objects.forEach(o => {
          const omSubject = namedNode(this.baseIRI + this.getUniqueID('om'));

          this.quads.push(quad(
            pomSubject,
            namedNode(namespaces.rr + 'objectMap'),
            omSubject
          ));

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
    this.quads.push(quad(
      omSubject,
      namedNode(namespaces.rdf + 'type'),
      namedNode(namespaces.rr + 'ObjectMap')
    ));

    switch (o.type) {
      case 'iri':
        o.type = namedNode(namespaces.rr + 'IRI');
        break;
      case 'blank':
        o.type = namedNode(namespaces.rr + 'BlankNode');
        break;
      case 'literal':
      default:
        o.type = namedNode(namespaces.rr + 'Literal');
        break;
    }

    if (o.value) {
      const {predicate, object} = this.getAppropriatePredicateAndObjectForValue(o.value);

      this.quads.push(quad(
        omSubject,
        predicate,
        object
      ));
    }

    this.quads.push(quad(
      omSubject,
      namedNode(namespaces.rr + 'termType'),
      o.type
    ));

    if (o.datatype) {
      this.quads.push(quad(
        omSubject,
        namedNode(namespaces.rr + 'datatype'),
        namedNode(AbstractGenerator.expandPrefix(o.datatype))
      ));
    } else if (o.language) {
      this.generateLanguageTerms(omSubject, o.language);
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
    this.quads.push(quad(
      omSubject,
      namedNode(namespaces.rdf + 'type'),
      namedNode(namespaces.rr + 'ObjectMap')
    ));

    this.quads.push(quad(
      omSubject,
      namedNode(namespaces.rr + 'parentTriplesMap'),
      this.mappingsAndIRIs[o.mapping][0]
    ));

    if (o.conditions) {
      o.conditions.forEach(condition => {
        this.generateCondition(condition, omSubject);
      });
    }
  }

  generateCondition(condition, omSubject) {
    const joinConditionSubject = namedNode(this.baseIRI + this.getUniqueID('jc'));

    this.quads.push(quad(
      omSubject,
      namedNode(namespaces.rr + 'joinCondition'),
      joinConditionSubject
    ));

    condition.parameters.forEach(parameter => {
      let predicate;

      if (AbstractGenerator.expandPrefix(parameter.parameter) === 'str1') {
        predicate = namedNode(namespaces.rr + 'child');
      } else {
        predicate = namedNode(namespaces.rr + 'parent');
      }

      this.quads.push(quad(
        joinConditionSubject,
        predicate,
        literal(parameter.value.substr(2).slice(0, -1))
      ));
    });
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
    if (o.function === 'equal') {
      this.convertEqualToIDLabEqual(o);
    }

    this.quads.push(quad(
      omSubject,
      namedNode(namespaces.rdf + 'type'),
      namedNode(namespaces.fnml + 'FunctionTermMap')
    ));

    if (o.type === 'iri') {
      this.quads.push(quad(
        omSubject,
        namedNode(namespaces.rr + 'termType'),
        namedNode(namespaces.rr + 'IRI')
      ));
    } else if (termType) {
      this.quads.push(quad(
        omSubject,
        namedNode(namespaces.rr + 'termType'),
        namedNode(namespaces.rr + termType)
      ));
    }

    if (o.datatype) {
      this.quads.push(quad(
        omSubject,
        namedNode(namespaces.rr + 'datatype'),
        namedNode(AbstractGenerator.expandPrefix(o.datatype))
      ));
    } else if (o.language) {
      this.generateLanguageTerms(omSubject, o.language);
    }

    const fnSubject = namedNode(this.baseIRI + this.getUniqueID('fn'));
    const pomExecutesSubject = namedNode(this.baseIRI + this.getUniqueID('pomexec'));
    const pmExecutesSubject = namedNode(this.baseIRI + this.getUniqueID('pmexec'));
    const omExecutesSubject = namedNode(this.baseIRI + this.getUniqueID('omexec'));

    this.quads.push(quad(
      omSubject,
      namedNode(namespaces.fnml + 'functionValue'),
      fnSubject
    ));

    if (sourceSubject) {
      this.generateFnSource(fnSubject, sourceSubject);
    }

    this.quads.push(quad(
      fnSubject,
      namedNode(namespaces.rr + 'predicateObjectMap'),
      pomExecutesSubject
    ));

    this.quads.push(quad(
      pomExecutesSubject,
      namedNode(namespaces.rr + 'predicateMap'),
      pmExecutesSubject
    ));

    this.quads.push(quad(
      pmExecutesSubject,
      namedNode(namespaces.rr + 'constant'),
      namedNode(namespaces.fno + 'executes')
    ));

    this.quads.push(quad(
      pomExecutesSubject,
      namedNode(namespaces.rr + 'objectMap'),
      omExecutesSubject
    ));

    const {predicate, object} = this.getAppropriatePredicateAndObjectForValue(o.function);

    this.quads.push(quad(
      omExecutesSubject,
      predicate,
      object
    ));

    this.quads.push(quad(
      omExecutesSubject,
      namedNode(namespaces.rr + 'termType'),
      namedNode(namespaces.rr + 'IRI')
    ));

    if (o.parameters) {
      o.parameters.forEach(pm => {
        const pomSubject = namedNode(this.baseIRI + this.getUniqueID('pom'));
        const pmSubject = namedNode(this.baseIRI + this.getUniqueID('pm'));
        const omSubject = namedNode(this.baseIRI + this.getUniqueID('om'));

        this.quads.push(quad(
          fnSubject,
          namedNode(namespaces.rr + 'predicateObjectMap'),
          pomSubject
        ));

        this.quads.push(quad(
          pomSubject,
          namedNode(namespaces.rdf + 'type'),
          namedNode(namespaces.rr + 'PredicateObjectMap')
        ));

        this.quads.push(quad(
          pomSubject,
          namedNode(namespaces.rr + 'predicateMap'),
          pmSubject
        ));

        this.quads.push(quad(
          pmSubject,
          namedNode(namespaces.rdf + 'type'),
          namedNode(namespaces.rr + 'PredicateMap')
        ));

        const {predicate, object} = this.getAppropriatePredicateAndObjectForValue(pm.parameter, true);

        this.quads.push(quad(
          pmSubject,
          predicate,
          object
        ));

        this.quads.push(quad(
          pomSubject,
          namedNode(namespaces.rr + 'objectMap'),
          omSubject
        ));

        this.quads.push(quad(
          omSubject,
          namedNode(namespaces.rdf + 'type'),
          namedNode(namespaces.rr + 'ObjectMap')
        ));


        if (pm.from === 'subject') {
          if (pm.type === 'blank') {
            this.quads.push(quad(
              omSubject,
              namedNode(namespaces.rr + 'termType'),
              namedNode(namespaces.rr + 'BlankNode')
            ));
          } else {
            const {predicate, object} = this.getAppropriatePredicateAndObjectForValue(pm.value);

            this.quads.push(quad(
              omSubject,
              predicate,
              object
            ));

            const termTypeObject = pm.type === 'iri' ? 'IRI' : 'Literal';

            this.quads.push(quad(
              omSubject,
              namedNode(namespaces.rr + 'termType'),
              namedNode(namespaces.rr + termTypeObject)
            ));
          }
        } else if (pm.from === 'function') {
          this.generateFunctionTermMap(omSubject, pm.value, sourceSubject);
        } else {
          const parentTermMapSubject = namedNode(this.baseIRI + this.getUniqueID('ptm'));

          this.quads.push(quad(
            omSubject,
            namedNode(namespaces.rml + 'parentTermMap'),
            parentTermMapSubject
          ));

          const {predicate, object} = this.getAppropriatePredicateAndObjectForValue(pm.value);

          this.quads.push(quad(
            parentTermMapSubject,
            predicate,
            object
          ));
        }
      });
    }
  }

  generateGraphMap(subject, graph, sourceSubject) {
    const graphMapSubject = namedNode(this.baseIRI + this.getUniqueID('gm'));

    this.quads.push(quad(
      subject,
      namedNode(namespaces.rr + 'graphMap'),
      graphMapSubject
    ));

    this.quads.push(quad(
      graphMapSubject,
      namedNode(namespaces.rdf + 'type'),
      namedNode(namespaces.rr + 'GraphMap')
    ));

    if (typeof graph === "object") {
      this.generateFunctionTermMap(graphMapSubject, graph, sourceSubject, 'IRI');
    } else {
      const {predicate, object} = this.getAppropriatePredicateAndObjectForValue(graph);

      this.quads.push(quad(
        graphMapSubject,
        predicate,
        object
      ));
    }
  }

  generateFnSource(fnSubject, sourceSubject) {
    throw new Error('Not implemented yet.');
  }

  /**
   * This method creates quads for the void dataset representing the rules with
   * the authors as contributors.
   * @param authors - An array of authors that will be added as contributors.
   */
  _generateDatasetDescription(authors) {
    this.datasetIRI = namedNode(this.baseIRI + this.getUniqueID('rules'));

    this.quads.push(quad(
      this.datasetIRI,
      namedNode(namespaces.rdf + 'type'),
      namedNode(namespaces.void + 'Dataset')
    ));

    for (const author of authors) {
      if (author.webid) {
        this.quads.push(quad(
          this.datasetIRI,
          namedNode(namespaces.dcterms + 'contributor'),
          namedNode(author.webid)
        ));
      } else {
        const personIRI = namedNode(this.baseIRI + this.getUniqueID('person'));

        this.quads.push(quad(
          this.datasetIRI,
          namedNode(namespaces.dcterms + 'contributor'),
          personIRI
        ));

        this.quads.push(quad(
          personIRI,
          namedNode(namespaces.dcterms + 'contributor'),
          namedNode(namespaces.foaf + 'Person')
        ));

        if (author.name) {
          this.quads.push(quad(
            personIRI,
            namedNode(namespaces.rdfs + 'label'),
            literal(author.name)
          ));
        }

        if (author.email) {
          this.quads.push(quad(
            personIRI,
            namedNode(namespaces.foaf + 'mbox'),
            namedNode(`mailto:${author.email}`)
          ));
        }

        if (author.website) {
          this.quads.push(quad(
            personIRI,
            namedNode(namespaces.foaf + 'homepage'),
            namedNode(author.website)
          ));
        }
      }
    }
  }

  static parseTemplate(t) {
    t = '' + t; // Make sure it's a string.
    t = t.replace(/\\\\/g, '@@@BACKWARD-SLASH@@@'); // We want to preserve real backward slashes.
    t = t.replace(/\\\(/g, '@@@BRACKET-OPEN@@@'); // Same for opening brackets.
    t = t.replace(/\\\)/g, '@@@BRACKET-CLOSE@@@'); // Same for closing brackets.
    t = t.replace(/\$\(([^)]*)\)/g, "{$1}");
    t = t.replace(/@@@BRACKET-CLOSE@@@/g, ')');
    t = t.replace(/@@@BRACKET-OPEN@@@/g, '(');
    t = t.replace(/@@@BACKWARD-SLASH@@@/g, '/');

    return t;
  }

  static escapeTemplate(t) {
    return ('' + t).replace('{', '\\{').replace('}', '\\}');
  }

  static countReference(t) {
    t = '' + t;
    const match = t.match(/\{([^\}]*)\}/g);

    if (match === null) {
      return 0;
    } else {
      return match.length;
    }
  }

  static hasConstantPart(t) {
    return ('' + t).replace(/\{([^\}]*)\}/g, "").length > 0;
  }

  static getFirstReference(t) {
    t = '' + t;
    const a = t.match(/\{([^\}]*)\}/g);

    return a[0].substr(1, a[0].length - 2);
  }

  /**
   * This function replaces all external references in a given string.
   * @param {string} str - The string in which the external references have to be replaced with their values.
   */
  _replaceExternalReferences(str) {
    str = '' + str;
    const refs = str.match(/\{([^\}]*)\}/g);

    if (refs) {
      for (const ref of refs) {
        if (ref.startsWith('{_')) {
          const refWithoutBrackets = ref.substr(2, ref.length - 3);
          const externalRefValue = this.externalReferences[refWithoutBrackets];

          if (externalRefValue) {
            str = str.replace(ref, externalRefValue);
          } else {
            Logger.info(`No external reference is found for ${ref}. It is not replaced.`);
          }
        }
      }
    }

    return str;
  }

  getUniqueID(prefix = '') {
    if (!prefix) {
      prefix = 'id';
    }

    if (!this.counter[prefix]) {
      this.counter[prefix] = 0;
    }
    const id = '' + this.counter[prefix];
    this.counter[prefix]++;

    return `${prefix}_${id.padStart(3, '0')}`;
  }

  static expandPrefix(str) {
    if (!(typeof (str) === 'string' || str instanceof String)) {
      return str;
    }

    if (str.indexOf('http://') !== -1 || str.indexOf('https://') !== -1) {
      return str;
    }

    str = str.replace(/\\:/g, '@@@@____@@@@');

    const splits = str.split(':');

    if (splits.length === 1) {
      return str.replace(/@@@@____@@@@/g, ':');
    }

    if (splits[1].charAt(0) === ' ') {
      return str.replace('@@@@____@@@@', ':');
    }

    if (rdfaVocs[splits[0]]) {
      return rdfaVocs[splits[0]] + splits[1].replace(/@@@@____@@@@/g, ':');
    } else {
      Logger.error(`prefix "${splits[0]}" was not found.`);
      return str.replace(/@@@@____@@@@/g, ':');
    }
  }

  addMappingIRI(mappingName, iri) {
    if (!this.mappingsAndIRIs[mappingName]) {
      this.mappingsAndIRIs[mappingName] = [];
    }

    this.mappingsAndIRIs[mappingName].push(iri);

    if (this.datasetIRI) {
      // Add the Triples Map to the void dataset.
      this.quads.push(quad(
        this.datasetIRI,
        namedNode(namespaces.void + 'exampleResource'),
        iri
      ));
    }
  }

  getPrefixes() {
    return this.prefixes;
  }

  getBaseIRI() {
    return this.baseIRI;
  }

  getAppropriatePredicateAndObjectForValue(value, isIRI = false) {
    let predicate = namedNode(namespaces.rr + 'template');
    const escapedValue = AbstractGenerator.escapeTemplate(value);
    const parsedValue = AbstractGenerator.parseTemplate(escapedValue);
    let object;

    if (AbstractGenerator.countReference(parsedValue) === 1 && !AbstractGenerator.hasConstantPart(parsedValue)) {
      object = this._replaceExternalReferences(parsedValue);

      if (object === parsedValue) {
        object = object.replace(/\\_/g, '_');
        object = AbstractGenerator.getFirstReference(object);
        object = AbstractGenerator.expandPrefix(object)
        object = literal(object);
        predicate = this.getReferenceOnlyPredicate();
      } else {
        object = literal(object);
        predicate = namedNode(namespaces.rr + 'constant');
      }
    } else if (parsedValue === escapedValue) {
      predicate = namedNode(namespaces.rr + 'constant');
      object = this._replaceExternalReferences(AbstractGenerator.expandPrefix(value));

      if (isIRI) {
        object = namedNode(object);
      } else {
        object = literal(object);
      }
    } else {
      const expandedValue = AbstractGenerator.expandPrefix(parsedValue);
      object = this._replaceExternalReferences(expandedValue);
      object = object.replace(/\\_/g, '_');
      object = literal(object);
    }

    return {predicate, object};
  }

  /**
   * This method converts the equal function to a an IDLab equal function.
   * @param fn The function that needs to be converted.
   */
  convertEqualToIDLabEqual(fn) {
    fn.function = 'http://example.com/idlab/function/equal';

    fn.parameters.forEach(pm => {
      if (pm.parameter === 'str1') {
        pm.parameter = 'http://users.ugent.be/~bjdmeest/function/grel.ttl#valueParameter';
      } else if (pm.parameter === 'str2') {
        pm.parameter = 'http://users.ugent.be/~bjdmeest/function/grel.ttl#valueParameter2';
      }
    });
  }

  /**
   * Get Logger instance
   * @return {Logger}
   */
  getLogger() {

    return Logger;
  }

}

module.exports = AbstractGenerator;
