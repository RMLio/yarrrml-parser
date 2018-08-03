/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const jsont  = require('json-transforms');
const extend = require('extend');

const shortcuts = {
  subjects: ['s', 'subject'],
  predicates: ['p', 'predicate'],
  objects: ['o', 'object'],
  predicateobjects: ['po', 'predicateobject'],
  inversepredicates: ['iv', 'inversepredicate'],
  value: ['v'],
  function: ['f', 'fn'],
  parameters: ['pms'],
  parameter: ['pm'],
  sources: ['source', 's'],
  conditions: ['c', 'condition'],
  graphs: ['g', 'graph']
};

function expand(input) {
  const output = {};

  extend(true, output, input);

  expandMappings(output);
  expandSourcesInDocument(output);

  return output;
}

function expandMappings(input) {
  if (input.mappings) {
    const mappings = Object.keys(input.mappings);

    mappings.forEach(mappingKey => {
      const mapping = input.mappings[mappingKey];
      expandSubjects(mapping);
      expandSourcesInMapping(mapping);
      expandPredicateObjects(mapping);
      expandGraphs(mapping);
    })
  }
}

function expandSubjects(mapping) {
  replaceAll('subjects', mapping);

  if (mapping.subjects) {
    if (typeof mapping.subjects === 'string') {
      mapping.subjects = [mapping.subjects]
    } else if (Array.isArray(mapping.subjects)) {
      for (let i = 0; i < mapping.subjects.length; i ++) {
        if (typeof mapping.subjects[i] === 'object') {
          expandFunction(mapping.subjects[i]);
        }
      }
    }
  }
}

function expandSourcesInMapping(mapping) {
  replaceAll('sources', mapping);

  if (mapping.sources && Array.isArray(mapping.sources)) {
    for (let i = 0; i < mapping.sources.length; i ++) {
      const source = mapping.sources[i];

      if (Array.isArray(source)) {
        mapping.sources[i] = convertArraySourceInObject(source);
      }
    }
  }
}

function expandSourcesInDocument(document) {
  replaceAll('sources', document);

  if (document.sources) {
    const sourceKeys = Object.keys(document.sources);

    for (let i = 0; i < sourceKeys.length; i ++) {
      const source = document.sources[sourceKeys[i]];

      if (Array.isArray(source)) {
        document.sources[sourceKeys[i]] = convertArraySourceInObject(source);
      }
    }
  }
}

function expandPredicateObjects(mapping) {
  replaceAll('predicateobjects', mapping);

  if (mapping.predicateobjects) {
    for (let i = 0; i < mapping.predicateobjects.length; i ++) {
      const po = mapping.predicateobjects[i];

      if (Array.isArray(po)) {
        const newPO = {
          predicates: po[0],
          objects: po[1],
        };

        if (po.length === 3) {
          if (po[2].indexOf('~lang') !== -1) {
            newPO.language = po[2].replace('~lang', '');
          } else {
            newPO.datatype = po[2];
          }
        }

        mapping.predicateobjects[i] = newPO;
      }
    }

    mapping.predicateobjects.forEach(po => {
      expandGraphs(po);
    });

    expandPredicates(mapping.predicateobjects);
    expandObjects(mapping.predicateobjects);
  }
}

function expandPredicates(predicateobjects) {
  predicateobjects.forEach(po => {
    replaceAll('predicates', po);

    if (typeof po.predicates === 'string') {
      po.predicates = [po.predicates];
    }
  });
}

function expandObjects(predicateobjects) {
  predicateobjects.forEach(po => {
    replaceAll('objects', po);

    if (typeof po.objects === 'string') {
      po.objects = [po.objects];
    } else if (typeof po.objects === 'object' && !Array.isArray(po.objects)) {
      po.objects = [po.objects]
    }

    for (let j = 0; j < po.objects.length; j ++) {
      if (typeof po.objects[j] === 'string') {
        if (po.predicates.indexOf('a') === -1 && po.objects[j].indexOf('~iri') === -1) {
          po.objects[j] = {
            value: po.objects[j],
            type: 'literal'
          }
        } else {
          po.objects[j] = {
            value: po.objects[j].replace('~iri', ''),
            type: 'iri'
          }
        }
      } else if (Array.isArray(po.objects[j])){
        let newPO;
        if (po.objects[j][0].indexOf('~iri') === -1) {
          newPO = {
            value: po.objects[j][0],
            type: 'literal'
          }
        } else {
          newPO = {
            value: po.objects[j][0].replace('~iri', ''),
            type: 'iri'
          }
        }

        if (po.objects[j].length > 1) {
          if (po.objects[j][1].indexOf('~lang') === -1) {
            newPO.datatype = po.objects[j][1];
          } else {
            newPO.language = po.objects[j][1].replace('~lang', '');
          }
        }

        po.objects[j] = newPO;
      }

      if (!po.objects[j].datatype && po.datatype) {
        po.objects[j].datatype = po.datatype;
      }

      if (!po.objects[j].language && po.language) {
        po.objects[j].language = po.language;
      }

      replaceAll('value', po.objects[j]);
      replaceAll('inversepredicates', po.objects[j]);

      expandFunction(po.objects[j]);


      //condition
      replaceAll('conditions', po.objects[j]);

      if (po.objects[j].conditions) {

        if (typeof po.objects[j].conditions === 'object' && !Array.isArray(po.objects[j].conditions)) {
          po.objects[j].conditions = [po.objects[j].conditions];
        }

        po.objects[j].conditions.forEach(c => {
          expandFunction(c);
        });
      }

      if (po.objects[j].mapping && Array.isArray(po.objects[j].mapping)) {
        po.objects[j].mapping.forEach(m => {
          const anotherObject = JSON.parse(JSON.stringify(po.objects[j]));
          anotherObject.mapping = m;
          po.objects.push(anotherObject);
        });

        po.objects.splice(j, 1);
      }
    }

    delete po.datatype;
    delete po.language;
  });
}

function expandFunction(input) {
  replaceAll('function', input);
  replaceAll('parameters', input);

  if (input.parameters) {
    for (let i = 0; i < input.parameters.length; i ++) {
      const e = input.parameters[i];

      if (Array.isArray(e)) {
        input.parameters[i] = {
          parameter: e[0],
          value: e[1]
        }
      } else {
        replaceAll('parameter', e);
        replaceAll('value', e);
      }
    }
  }
}

function expandGraphs(mapping) {
  replaceAll('graphs', mapping);

  if (mapping.graphs) {
    if (typeof mapping.graphs === 'string') {
      mapping.graphs = [mapping.graphs]
    }
  }
}

function convertArraySourceInObject(source) {
  const splits = source[0].split('~');
  let result;

  if (splits.length > 1) {
    result = {
      access: splits[0],
      referenceFormulation: splits[1],
      iterator: source[1]
    };
  } else {
    console.log('reference formulation not specified');
  }

  return result;
}

function replaceAll(wanted, value) {
  //console.log(wanted);
  //console.log(value);

  shortcuts[wanted].forEach(shortcut => {
    //console.log(shortcut);

    if (value[shortcut]) {
      replace(shortcut, wanted, value);
    }
  });
}

function replace(oldName, newName, value) {
  value[newName] = value[oldName];
  delete value[oldName];
}

module.exports = expand;