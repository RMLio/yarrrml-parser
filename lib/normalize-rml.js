const prefixes = {
  rr: 'http://www.w3.org/ns/r2rml#',
  rml: 'http://semweb.mmlab.be/ns/rml#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
};
const TERMS = {
  a: prefixes.rdf + 'type'
};

/**
 * normalize RML quads in the store, by modifying the existing store, and then write them semi-pretty using the writer.
 * @param store N3.Store
 * @param writer N3.Writer
 */
function writeNormalizeRml(store, writer) {
  normalizeRml(store, function () {
    let parsedBlankSubjects = {};
    writeBlanks(store, parsedBlankSubjects);
    let quads = store.getQuads();
    quads.forEach(function (quad) {
      if (parsedBlankSubjects[quad.subject]) {
        return;
      }
      if (parsedBlankSubjects[quad.object]) {
        writer.addQuad(quad.subject, quad.predicate, writer.blank(parsedBlankSubjects[quad.object]));
        return;
      }
      writer.addTriple(quad);
    });
  });
}

/**
 * normalize RML quads in the store, by modifying the existing store, callback cb is fired when done.
 * @param store
 * @param cb
 */
function normalizeRml(store, cb) {
  let triples;

  //subject
  triples = store.getTriples(null, prefixes.rr + 'subject', null);
  store.removeTriples(triples);
  triples.forEach(function (triple) {
    const bNode = store.createBlankNode();
    store.addTriple(triple.subject, prefixes.rr + 'subjectMap', bNode);
    store.addTriple(bNode, prefixes.rr + 'constant', triple.object);
  });

  //class
  triples = store.getTriples(null, prefixes.rr + 'class', null);
  store.removeTriples(triples);
  triples.forEach(function (triple) {
    const poMap = store.createBlankNode();
    let tripleMaps = store.getTriples(null, prefixes.rr + 'subjectMap', triple.subject);
    tripleMaps.forEach(function(tripleMap) {
      store.addTriple(tripleMap.subject, prefixes.rr + 'predicateObjectMap', poMap);
      const pMap = store.createBlankNode();
      store.addTriple(poMap, prefixes.rr + 'predicateMap', pMap);
      store.addTriple(pMap, prefixes.rr + 'constant', TERMS.a);
      const oMap = store.createBlankNode();
      store.addTriple(poMap, prefixes.rr + 'objectMap', oMap);
      store.addTriple(oMap, prefixes.rr + 'constant', triple.object);
    });
  });

  //predicate
  triples = store.getTriples(null, prefixes.rr + 'predicate', null);
  store.removeTriples(triples);
  triples.forEach(function (triple) {
    const pMap = store.createBlankNode();
    store.addTriple(triple.subject, prefixes.rr + 'predicateMap', pMap);
    store.addTriple(pMap, prefixes.rr + 'constant', triple.object);
  });

  //object
  triples = store.getTriples(null, prefixes.rr + 'object', null);
  store.removeTriples(triples);
  triples.forEach(function (triple) {
    const pMap = store.createBlankNode();
    store.addTriple(triple.subject, prefixes.rr + 'objectMap', pMap);
    store.addTriple(pMap, prefixes.rr + 'constant', triple.object);
  });

  // logicalTable
  triples = store.getTriples(null, prefixes.rr + 'logicalTable', null);
  triples.forEach(function (triple) {
    store.addTriple(triple.subject, 'a', prefixes.rr + 'TriplesMap');
    store.addTriple(triple.object, 'a', prefixes.rr + 'LogicalTable');
  });

  // subjectMap
  triples = store.getTriples(null, prefixes.rr + 'subjectMap', null);
  triples.forEach(function (triple) {
    store.addTriple(triple.subject, TERMS.a, prefixes.rr + 'TriplesMap');
    store.addTriple(triple.object, TERMS.a, prefixes.rr + 'SubjectMap');
  });

  // poMap
  triples = store.getTriples(null, prefixes.rr + 'predicateObjectMap', null);
  triples.forEach(function (triple) {
    store.addTriple(triple.subject, TERMS.a, prefixes.rr + 'TriplesMap');
    store.addTriple(triple.object, TERMS.a, prefixes.rr + 'PredicateObjectMap');
  });

  // pMap
  triples = store.getTriples(null, prefixes.rr + 'predicateMap', null);
  triples.forEach(function (triple) {
    store.addTriple(triple.subject, TERMS.a, prefixes.rr + 'PredicateObjectMap');
    store.addTriple(triple.object, TERMS.a, prefixes.rr + 'PredicateMap');
  });

  // oMap
  triples = store.getTriples(null, prefixes.rr + 'objectMap', null);
  triples.forEach(function (triple) {
    store.addTriple(triple.subject, TERMS.a, prefixes.rr + 'PredicateObjectMap');
    store.addTriple(triple.object, TERMS.a, prefixes.rr + 'ObjectMap');
  });

  // refOMap
  triples = store.getTriples(null, prefixes.rr + 'parentTriplesMap', null);
  triples.forEach(function (triple) {
    store.removeTriple(triple.subject, TERMS.a, prefixes.rr + 'ObjectMap');
    store.addTriple(triple.subject, TERMS.a, prefixes.rr + 'RefObjectMap');
    store.addTriple(triple.object, TERMS.a, prefixes.rr + 'TriplesMap');
  });

  //graphMap
  triples = store.getTriples(null, prefixes.rr + 'graphMap', null);
  triples.forEach(function (triple) {
    store.addTriple(triple.object, TERMS.a, prefixes.rr + 'GraphMap');
  });

  //termmaps
  triples = store.getTriples(null, TERMS.a, prefixes.rr + 'SubjectMap');
  triples.forEach(function (triple) {
    store.addTriple(triple.subject, TERMS.a, prefixes.rr + 'TermMap');
  });
  triples = store.getTriples(null, TERMS.a, prefixes.rr + 'PredicateMap');
  triples.forEach(function (triple) {
    store.addTriple(triple.subject, TERMS.a, prefixes.rr + 'TermMap');
  });
  triples = store.getTriples(null, TERMS.a, prefixes.rr + 'ObjectMap');
  triples.forEach(function (triple) {
    store.addTriple(triple.subject, TERMS.a, prefixes.rr + 'TermMap');
  });

  // TODO graphMap

  //IRI or Literal
  // quads = store.getTriples(null, TERMS.a, prefixes.rr + 'ObjectMap');
  // quads.forEach(function (triple) {
  //   let termtypetriples = store.getTriples(triple.subject, prefixes.rr + 'termType', null);
  //   if (termtypetriples.length === 0) {
  //     store.addTriple(triple.subject, prefixes.rr + 'termType', prefixes.rr + 'IRI');
  //   }
  // });

  //column
  triples = store.getTriples(null, prefixes.rr + 'column', null);
  triples.forEach(function (triple) {
    store.removeTriple(triple.subject, prefixes.rr + 'termType', prefixes.rr + 'IRI');
    store.addTriple(triple.subject, prefixes.rr + 'termType', prefixes.rr + 'Literal');
  });

  //language
  triples = store.getTriples(null, prefixes.rr + 'language', null);
  triples.forEach(function (triple) {
    store.removeTriple(triple.subject, prefixes.rr + 'termType', prefixes.rr + 'IRI');
    store.addTriple(triple.subject, prefixes.rr + 'termType', prefixes.rr + 'Literal');
  });

  //datatype
  triples = store.getTriples(null, prefixes.rr + 'datatype', null);
  triples.forEach(function (triple) {
    store.removeTriple(triple.subject, prefixes.rr + 'termType', prefixes.rr + 'IRI');
    store.addTriple(triple.subject, prefixes.rr + 'termType', prefixes.rr + 'Literal');
  });


  cb();
}

function writeBlanks(store, blanks) {
  let triples = store.getTriples(null, TERMS.a, prefixes.rr + 'ObjectMap');
  triples.forEach(function (triple) {
    let oMaps = store.getTriples(null, prefixes.rr + 'objectMap', triple.subject);
    if (oMaps.length > 1) {
      return;
    }
    let myBlanks = [];
    let oStuff = store.getTriples(triple.subject, null, null);
    oStuff.forEach(function (oTriple) {
      myBlanks.push({predicate: oTriple.predicate, object: oTriple.object});
    });
    blanks[triple.subject] = myBlanks;
  });
  triples = store.getTriples(null, TERMS.a, prefixes.rr + 'PredicateMap');
  triples.forEach(function (triple) {
    let pMaps = store.getTriples(null, prefixes.rr + 'predicateMap', triple.subject);
    if (pMaps.length > 1) {
      return;
    }
    let myBlanks = [];
    let oStuff = store.getTriples(triple.subject, null, null);
    oStuff.forEach(function (oTriple) {
      myBlanks.push({predicate: oTriple.predicate, object: oTriple.object});
    });
    blanks[triple.subject] = myBlanks;
  });
}

module.exports = {
  normalizeRml: normalizeRml,
  writeNormalizeRml: writeNormalizeRml
};
