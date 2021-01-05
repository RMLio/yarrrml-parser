/**
 * Created by pheyvaer on 07.04.17.
 */

const Logger = require('./logger');
let N3 = require('n3');
let Q = require('q');
let prefixNS = require('prefix-ns');

let namespaces = prefixNS.asMap();

let ignoredForBlankNodes = [
  namespaces.rr + 'class',
  namespaces.rr + 'predicate',
  namespaces.rr + 'parentTriplesMap',
  namespaces.rr + 'constant',
  namespaces.rdf + 'type',
  namespaces.rr + 'termType',
  namespaces.rml + 'referenceFormulation',
  namespaces.rr + 'datatype'
];

function makeBlankNode(subject, store, writer) {
  let blankNodes = [];
  let triples = store.getTriples(subject, null, null);
  //console.log(quads);

  triples.forEach(function (triple) {
    let object;
    if (N3.Util.isLiteral(triple.object) || ignoredForBlankNodes.indexOf(triple.predicate) !== -1) {
      object = triple.object;
    } else {
      if (triple.predicate === namespaces.rr + 'predicateMap') {
        let constants = store.getTriples(triple.object, namespaces.rr + 'constant', null);

        if (constants.length > 0) {
          //console.log('== constants ==');
          //console.log(constants);
          //console.log('==============');
          triple.predicate = namespaces.rr + 'predicate';
          object = constants[0].object;
        } else {
          object = makeBlankNode(triple.object, store, writer);
        }
      } else {
        object = makeBlankNode(triple.object, store, writer);
      }
    }

    Logger.error(object);
    if (triple.predicate !== namespaces.rdf + 'type') {
      blankNodes.push({
        predicate: triple.predicate,
        object: object
      });
    }
  });

  //console.log(blankNodes);

  return writer.blank(blankNodes);
}

function replaceTypePOMWithClass(store) {
  let triples = store.getTriples(null, namespaces.rr + 'subjectMap', null);

  triples.forEach(function (triple) {
    let poms = store.getTriples(triple.subject, namespaces.rr + 'predicateObjectMap', null);

    poms.forEach(function (pom) {
      let pms = store.getTriples(pom.object, namespaces.rr + 'predicateMap', null);
      let oms = store.getTriples(pom.object, namespaces.rr + 'objectMap', null);

      //console.log(pms);
      if (pms.length > 0 && oms.length > 0) {
        let types = store.getTriples(pms[0].object, namespaces.rr + 'constant', namespaces.rdf + 'type');
        let constants = store.getTriples(oms[0].object, namespaces.rr + 'constant', null);

        if (constants.length > 0 && types.length > 0) {
          let c = constants[0].object;

          store.removeTriples([pom, pms[0], constants[0]]);
          store.addTriple(triple.object, namespaces.rr + 'class', c);
        }
      }
    });
  });
}

function removeDefaultTermTypes(store) {
  //remove IRI from subjectmap
  let triples = store.getTriples(null, namespaces.rr + 'subjectMap', null);

  triples.forEach(function (triple) {
    store.removeTriples(store.getTriples(triple.object, namespaces.rr + 'termType', namespaces.rr + 'IRI'));
  });

  //remove Literal from objectMap
  triples = store.getTriples(null, namespaces.rr + 'objectMap', null);

  triples.forEach(function (triple) {
    store.removeTriples(store.getTriples(triple.object, namespaces.rr + 'termType', namespaces.rr + 'Literal'));
  });
}

function makeBlankNodesOfObjects(store, writer, subject, predicate) {
  let triples = store.getTriples(subject, predicate, null);
  Logger.error(subject);
  Logger.error(predicate);
  Logger.error(triples);

  triples.forEach(function (triple) {
    //console.log(triple.object);
    let blankNodes = makeBlankNode(triple.object, store, writer);

    if (blankNodes !== '[]') {
      writer.addTriple({
        subject: triple.subject,
        predicate: triple.predicate,
        object: blankNodes
      });
    }
  });
}

function makeReadableFromString(rmlTriples, writer) {
  let parser = N3.Parser();
  let triples = [];
  let deferred = Q.defer();

  parser.parse(rmlTriples,
    function (error, triple, prefixes) {
      if (triple)
        triples.push(triple);
      else {
        makeReadableFromArray(triples, writer);
        deferred.resolve(writer);
      }
    });

  return deferred.promise;
}

function makeReadableFromArray(rmlTriples, writer) {
  let store = N3.Store();

  store.addTriples(rmlTriples);

  replaceTypePOMWithClass(store);
  removeDefaultTermTypes(store);

  let triplemaps = store.getTriples(null, namespaces.rr + 'subjectMap', null);

  triplemaps.forEach(function (tm) {
    makeBlankNodesOfObjects(store, writer, tm.subject, namespaces.rml + 'logicalSource');
    makeBlankNodesOfObjects(store, writer, tm.subject, namespaces.rr + 'subjectMap');
    makeBlankNodesOfObjects(store, writer, tm.subject, namespaces.rr + 'predicateObjectMap');
  });
}

module.exports = {
  makeReadable: makeReadableFromArray,
};