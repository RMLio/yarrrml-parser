/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const N3 = require('n3');
const YAML   = require('yamljs');
const namespaces = require('prefix-ns').asMap();
const rdfaVocs = require('./rdfa-context.json')['@context'];
const Q = require('q');
const { DataFactory } = N3;
const {namedNode} = DataFactory;

namespaces.fnml = 'http://semweb.mmlab.be/ns/fnml#';
namespaces.fno = 'http://w3id.org/function/ontology#';

let counter = 0;
let store;

function convertRMLtoYAML(rml) {
  const deferred = Q.defer();

  store = N3.Store();
  store.addQuads(rml);

  const yarrrml = {
    mappings: {}
  };

  const triplesMaps = store.getQuads(null, namedNode(namespaces.rdf + 'type'), namedNode(namespaces.rr + 'TriplesMap')).map(a => a.subject);

  triplesMaps.forEach(tm => {
    const temps = store.getQuads(null, namedNode(namespaces.fnml + 'functionValue'), tm).map(a => a.subject);

    if (temps.length === 0) {
      //determine label
      const labels = store.getQuads(tm, namedNode(namespaces.rdfs + 'label'), null).map(a => a.object);
      let mappingName;

      if (labels.length > 0) {
        mappingName = labels[0].value;
      } else {
        mappingName = 'mapping' + getUniqueID();
      }

      //determine subjects
      const subjectmaps = store.getQuads(tm, namedNode(namespaces.rr + 'subjectMap'), null).map(a => a.object);
      let subjects = [];
      const predicateobjects = [];

      subjectmaps.forEach(sm => {
        const template = store.getQuads(sm, namedNode(namespaces.rr + 'template'), null).map(a => a.object)[0];

        subjects.push(convertR2RMLTemplateToYARRRMLTemplate(template.value));
      });

      if (subjects.length === 1) {
        subjects = subjects[0];
      }

      const predicateObjectMaps = store.getQuads(tm, namedNode(namespaces.rr + 'predicateObjectMap'), null).map(a => a.object);

      predicateObjectMaps.forEach(pom => {
        let functionUsed = false;
        let predicates = [];
        let objects = [];
        const predicateMaps = store.getQuads(pom, namedNode(namespaces.rr + 'predicateMap'), null).map(a => a.object);

        predicateMaps.forEach(pm => {
          let pred = getYARRRMLTemplateFromTermMap(pm);

          if (pred === 'rdf:type') {
            pred = 'a';
          }

          predicates.push(pred);
        });

        const objectMaps = store.getQuads(pom, namedNode(namespaces.rr + 'objectMap'), null).map(a => a.object);

        objectMaps.forEach(om => {
          let object;
          const functionValues = store.getQuads(om, namedNode(namespaces.fnml + 'functionValue'), null).map(a => a.object);
          const termtypes = store.getQuads(om, namedNode(namespaces.rr + 'termType'), null).map(a => a.object);

          if (functionValues.length > 0) {
            functionUsed = true;
            const poms = store.getQuads(functionValues[0], namedNode(namespaces.rr + 'predicateObjectMap'), null).map(a => a.object);

            object = {};

            poms.forEach(pom => {
              processFnPOM(pom, object);
            });
          } else {
            object = getYARRRMLTemplateFromTermMap(om);

            if (termtypes.length !== 0 && termtypes[0].value === namespaces.rr + 'IRI') {
              object += '~iri';
            } else {
              const langs = store.getQuads(om, namedNode(namespaces.rr + 'language'), null).map(a => a.object.value + '~lang');

              if (langs.length > 0) {
                object = [object, langs[0]];
              } else {
                const datatypes = store.getQuads(om, namedNode(namespaces.rr + 'datatype'), null).map(a => a.object);

                if (datatypes.length > 0) {
                  object = [object, collapseNamespace(datatypes[0])];
                }
              }
            }
          }

          objects.push(object);
        });

        if (predicates.length === 1) {
          predicates = predicates[0];
        }

        if (objects.length === 1) {
          objects = objects[0];
        }

        if (functionUsed) {
          predicateobjects.push({p: predicates, o: objects});
        } else {
          predicateobjects.push([predicates, objects]);
        }
      });

      yarrrml.mappings[mappingName] = {};

      if (subjects.length !== 0) {
        yarrrml.mappings[mappingName].s = subjects;
      }

      if (predicateobjects.length !== 0) {
        yarrrml.mappings[mappingName].po = predicateobjects;
      }
    }
  });

  deferred.resolve(YAML.stringify(yarrrml, 4, 2));

  return deferred.promise;
}

function processFnPOM(pom, object) {
  const pm = store.getQuads(pom, namedNode(namespaces.rr + 'predicateMap'), null).map(a => a.object)[0];
  const om = store.getQuads(pom, namedNode(namespaces.rr + 'objectMap'), null).map(a => a.object)[0];
  const predicate = getYARRRMLTemplateFromTermMap(pm);
  const o = getYARRRMLTemplateFromTermMap(om);

  if (predicate === namespaces.fno + 'executes') {
    object.fn = o;
  } else {
    if (!object.pms) {
      object.pms = [];
    }

    object.pms.push([predicate, o]);
  }
}

function convertR2RMLTemplateToYARRRMLTemplate(template) {
  return template.replace(/\{([^)]*)\}/g, "$($1)");
}

function getYARRRMLTemplateFromTermMap(tm) {
  const constants = store.getQuads(tm, namedNode(namespaces.rr + 'constant'), null).map(a => a.object);
  const references = store.getQuads(tm, namedNode(namespaces.rml + 'reference'), null).map(a => a.object);

  if (constants.length > 0) {
    let c = constants[0].value;

    return collapseNamespace(c);
  } else if (references.length > 0) {
    return `$(${references[0].value})`;
  } else {
    const template = store.getQuads(tm, namedNode(namespaces.rr + 'template'), null).map(a => a.object)[0].value;
    return convertR2RMLTemplateToYARRRMLTemplate(template);
  }
}

function collapseNamespace(str) {
  let i = 0;
  let prefixes = Object.keys(rdfaVocs);

  while (i < prefixes.length && str.indexOf(rdfaVocs[prefixes[i]]) === -1) {
    i ++;
  }

  if (i < prefixes.length) {
    return str.replace(rdfaVocs[prefixes[i]], prefixes[i] +  ':');
  } else {
    return str;
  }
}

function getUniqueID() {
  const temp = counter;
  counter ++;

  return temp;
}

module.exports = convertRMLtoYAML;