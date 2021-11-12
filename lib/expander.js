/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const extend = require('extend');
const parseAuthor = require('parse-author');
const Logger = require('./logger');

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
  targets: ['target', 't'],
  conditions: ['c', 'condition'],
  graphs: ['g', 'graph'],
  mappings: ['m', 'mapping']
};

const idlabfn = 'http://example.com/idlab/function/';


function expand(input) {
  const output = {};

  extend(true, output, input);

  replaceAll('mappings', output);
  expandMappings(output);
  expandAuthors(output);
  expandSourcesInDocument(output);
  expandTargetsInDocument(output);

  return output;
}

function expandMappings(input) {
  if (input.mappings) {
    const mappings = Object.keys(input.mappings);

    for (let i = 0; i < mappings.length; i++) {
      const mappingKey = mappings[i];
      const mapping = input.mappings[mappingKey];

      if (mapping) {
        expandSubjects(mapping, mappingKey);
        expandSourcesInMapping(mapping, mappingKey);
        expandTargetsInMapping(mapping, mappingKey);
        expandPredicateObjects(mapping, mappingKey);
        expandGraphs(mapping);
      } else {
        Logger.warn(`mapping "${mappingKey}": no rules are provided. Skipping.`);
        delete input.mappings[mappingKey];
      }
    }
  } else {
    Logger.error('A YARRRML document should have at least the key "mappings".');
  }
}

function expandSubjects(mapping, mappingKey) {
  replaceAll('subjects', mapping);

  if (mapping.subjects) {
    if (typeof mapping.subjects === 'string') {
      mapping.subjects = [mapping.subjects]
    } else if (Array.isArray(mapping.subjects)) {
      for (let i = 0; i < mapping.subjects.length; i++) {
        if (typeof mapping.subjects[i] === 'object') {
          expandFunction(mapping.subjects[i]);

          if (!mapping.subjects[i].type) {
            mapping.subjects[i].type = 'iri'
          }
        }
      }
    } else {
      expandFunction(mapping.subjects);

      if (!mapping.subjects.type) {
        mapping.subjects.type = 'iri'
      }

      mapping.subjects = [mapping.subjects];
    }
  } else {
    mapping.subjects = [{type: 'blank'}];
  }

  replaceAll('conditions', mapping);

  if (mapping.conditions) {
    expandFunction(mapping.conditions);

    for (let i = 0; i < mapping.subjects.length; i++) {
      mapping.subjects[i] = conditionToFunction(mapping.conditions, mapping.subjects[i], 'iri')
      delete mapping.conditions;
    }
  }
}

function expandSourcesInMapping(mapping, mappingKey) {
  replaceAll('sources', mapping);

  if (mapping.sources) {
    if (Array.isArray(mapping.sources)) {
      for (let i = 0; i < mapping.sources.length; i++) {
        const source = mapping.sources[i];

        if (Array.isArray(source)) {
          mapping.sources[i] = convertArraySourceInObject(source);
        }

        if (typeof source == 'object' && source.security && source.security === 'none' ) {
          source.security = [ { type: 'none'} ]
        } else if (typeof mapping.sources === 'string') {
          mapping.sources = [mapping.sources];
        }
      }
    } else if (typeof mapping.sources === 'string') {
      mapping.sources = [mapping.sources];
    } else {
      Logger.error(`mapping "${mappingKey}": no (valid) source is defined.`);
    }
  } else {
    Logger.error(`mapping "${mappingKey}": no source is defined.`);
  }
}

function expandTargetsInMapping(mapping, mappingKey) {
  let targets = [];

  // Replace shortcuts
  replaceAll('targets', mapping);

  // Collect targets in Subject Maps
  if (mapping.subjects) {
    mapping.subjects.forEach((subject) => {
      if (subject.targets) {
        if (Array.isArray(subject.targets)) {
          for (let i = 0; i < subject.targets.length; i++) {
            const target = subject.targets[i];
            if (Array.isArray(target)) {
              subject.targets[i] = convertArrayTargetInObject(target);
            }
          }
        }
        else if (typeof subject.targets === 'string') {
          subject.targets = [subject.targets]
        }
        else {
          Logger.error(`subject "${JSON.stringify(subject, null, 2)}": no (valid) target is defined.`);
        }
      }
    });
  }

  // Collect targets in Predicate and Object Maps
  if (mapping.predicateobjects) {
    mapping.predicateobjects.forEach((po) => {
      if (po.predicates) {
        if (Array.isArray(po.predicates)) {
          // Predicates
          po.predicates.forEach((p) => {
            if (p.targets) {
              if (Array.isArray(p.targets)) {
                for (let i = 0; i < p.targets.length; i++) {
                  const target = p.targets[i];
                  if (Array.isArray(target)) {
                    p.targets[i] = convertArrayTargetInObject(target);
                  }
                }
              }
              else if (typeof p.targets === 'string') {
                p.targets = [p.targets]
              }
              else {
                Logger.error(`predicate "${JSON.stringify(p, null, 2)}": no (valid) target is defined.`);
              }
            }
          });
        }

        if (Array.isArray(po.objects)) {
          // Objects
          po.objects.forEach((o) => {
            if (o.targets) {
              if (Array.isArray(o.targets)) {
                for (let i = 0; i < o.targets.length; i++) {
                  const target = o.targets[i];
                  if (Array.isArray(target)) {
                    o.targets[i] = convertArrayTargetInObject(target);
                  }
                }
              }
              else if (typeof o.targets === 'string') {
                o.targets = [o.targets]
              }
              else {
                Logger.error(`object "${JSON.stringify(o, null, 2)}": no (valid) target is defined.`);
              }
            }

            if (o.language && o.language.targets) {
              if (Array.isArray(o.language.targets)) {
                for (let i = 0; i < o.language.targets.length; i++) {
                  const target = o.language.targets[i];
                  if (Array.isArray(target)) {
                    o.language.targets[i] = convertArrayTargetInObject(target);
                  }
                }
              }
              else if (typeof o.language.targets === 'string') {
                o.language.targets = [o.language.targets]
              }
              else {
                Logger.error(`object language "${JSON.stringify(o.language, null, 2)}": no (valid) target is defined.`);
              }
            }
          });
        }
      }
    });
  }

  // Extract inline targets for graph maps
  if (mapping.graphs) {
    mapping.graphs.forEach((g) => {
      if (g.targets) {
        if (Array.isArray(g.targets)) {
          for (let i = 0; i < g.targets.length; i++) {
            const target = g.targets[i];
            if (Array.isArray(target)) {
              g.targets[i] = convertArrayTargetInObject(target);
            }
          }
        }
        else if (typeof g.targets === 'string') {
          g.targets = [g.targets]
        }
        else {
          Logger.error(`graph "${JSON.stringify(g, null, 2)}": no (valid) target is defined.`);
        }
      }
    });
  }
}

function expandSourcesInDocument(document) {
  replaceAll('sources', document);

  if (document.sources) {
    const sourceKeys = Object.keys(document.sources);

    for (let i = 0; i < sourceKeys.length; i++) {
      const source = document.sources[sourceKeys[i]];

      if (Array.isArray(source)) {
        document.sources[sourceKeys[i]] = convertArraySourceInObject(source);
      }

      if (typeof source == 'object' && source.security && source.security == 'none' ) {
        source.security = [ { type: 'none'} ]
      }
    }
  }
}

function expandTargetsInDocument(document) {
  replaceAll('targets', document);

  if (document.targets) {
    const targetKeys = Object.keys(document.targets);

    for (let i = 0; i < targetKeys.length; i++) {
      const target = document.targets[targetKeys[i]];

      if (Array.isArray(target)) {
        document.targets[targetKeys[i]] = convertArrayTargetInObject(target);
      }
    }
  }
}

function expandPredicateObjects(mapping, mappingKey) {
  replaceAll('predicateobjects', mapping);

  if (mapping.predicateobjects) {
    for (let i = 0; i < mapping.predicateobjects.length; i++) {
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
    expandObjects(mapping.predicateobjects, mappingKey);
    expandConditionsOfPOs(mapping.predicateobjects);
  } else {
    Logger.error(`mapping "${mappingKey}": no pos are defined.`);
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

function expandObjects(predicateobjects, mappingKey) {
  for (let i = 0; i < predicateobjects.length; i++) {
    const po = predicateobjects[i];
    replaceAll('objects', po);

    if (typeof po.objects === 'string' || typeof po.objects === 'number') {
      po.objects = ['' + po.objects];
    } else if (typeof po.objects === 'object' && !Array.isArray(po.objects)) {
      po.objects = [po.objects]
    }

    if (!po.objects || po.objects.length === 0) {
      Logger.warn(`mapping "${mappingKey}": po with predicate(s) "${po.predicates}" does not have an object defined. Skipping.`);
      predicateobjects.splice(i, 1);
      i--;
    } else {
      for (let j = 0; j < po.objects.length; j++) {
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
        } else if (Array.isArray(po.objects[j])) {
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

          if (po.objects[j].value && !po.objects[j].mapping) {
            po.objects[j] = expandConditionsOfObject(po.objects[j]);
          }
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
    }
  }
}

function expandFunction(input) {
  replaceAll('function', input);
  replaceAll('parameters', input);

  if (input.function && isFunctionShortcut(input.function)) {
    const result = expandFunctionShortcut(input.function);
    input.function = result.function;
    input.parameters = result.parameters;
  }

  if (input.parameters) {
    for (let i = 0; i < input.parameters.length; i++) {
      const e = input.parameters[i];

      if (Array.isArray(e)) {
        input.parameters[i] = {
          parameter: e[0],
          value: '' + e[1] // turn ints into strings
        };

        if (input.parameters[i].value.indexOf('~iri') === -1) {
          input.parameters[i].type = 'literal';
        } else {
          input.parameters[i].type = 'iri';
          input.parameters[i].value = input.parameters[i].value.replace('~iri', '');
        }

        if (e.length > 2) {
          if (e[2] === "s") {
            e[2] = "subject";
          } else if (e[2] === "o") {
            e[2] = "object";
          }

          if (e[2] === "subject" || e[2] === "object") {
            input.parameters[i].from = e[2];
          } else {
            const e = new Error(`\`from\` has to have the value "s", "subject", "o", or "object`);
            e.code = 'INVALID_YAML';
            throw e;
          }
        } else {
          input.parameters[i].from = "subject"
        }
      } else {
        replaceAll('parameter', e);
        replaceAll('value', e);
      }

      if (e.value instanceof Object) {
        expandFunction(e.value);
        e.from = 'function';
      }
    }
  }
}

function isFunctionShortcut(str) {
  return str.indexOf('(') !== -1 && str.indexOf(')') > str.indexOf('(');
}

function expandFunctionShortcut(functionStr) {
  const fn = functionStr.substr(0, functionStr.indexOf('('));
  const prefix = fn.substr(0, fn.indexOf(':'));
  const parameterStr = functionStr.substr(functionStr.indexOf('(')+1, functionStr.length -  functionStr.indexOf('(') - 2);
  const parameters = parameterStr.split(',');
  const temp = [];

  parameters.forEach(p => {
    const split = p.split('=');
    let parameter = split[0].trim();
    if (parameter.indexOf(':') === -1) {
      parameter = prefix + ':' + parameter;
    }

    let value = split[1].trim();

    if (value[0] === '"' && value[value.length - 1] === '"') {
      value = value.substr(1, value.length - 2);
    }

    temp.push({value, parameter, from: 'subject', type: 'literal'});
  });

  return {function: fn, parameters: temp};
}

function expandGraphs(mapping) {
  replaceAll('graphs', mapping);

  if (mapping.graphs) {
    if (typeof mapping.graphs === 'string') {
      mapping.graphs = [mapping.graphs]
    } else if (Array.isArray(mapping.graphs)) {
      for (let i = 0; i < mapping.graphs.length; i++) {
        if (typeof mapping.graphs[i] === 'object') {
          expandFunction(mapping.graphs[i]);
        }
      }
    }
  }
}

function expandConditionsOfPOs(predicateobjects) {
  for (let i = 0; i < predicateobjects.length; i++) {
    const po = predicateobjects[i];
    replaceAll('conditions', po);

    if (po.conditions) {
      expandFunction(po.conditions);

      for (let j = 0; j < po.objects.length; j++) {
        po.objects[j] = conditionToFunction(po.conditions, po.objects[j])
      }

      delete po.conditions;
    }
  }
}

function conditionToFunction(conditions, map, defaultType = undefined) {
  // TODO it's very weird that it's either value or complete map
  value = defaultType === 'iri' ? (map.type === 'blank' ? null : map) : (map.function ? map : map.value);
  from = map.function ? 'function' : 'subject';
  type = map.type ? map.type : defaultType;
  datatype = map.datatype;
  language = map.language;
  map = {
    function: idlabfn + 'trueCondition',
    parameters: [
      {
        parameter: idlabfn + 'strBoolean',
        value: conditions,
        from: 'function'
      }, {
        parameter: idlabfn + 'str',
        value: value,
        type: type,
        from: from
      }
    ],
    type: type
  };

  if (datatype) {
    map.datatype = datatype;
  }
  if (language) {
    map.language = language;
  }

  return map;
}

/**
 * This method returns a new object with the conditions expanded.
 * @param o An object of a Predicate Object.
 */
function expandConditionsOfObject(o) {
  if (o.conditions) {
    return conditionToFunction(o.conditions[0], o)
  } else {
    return o;
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
    Logger.warn('reference formulation not specified')
  }

  return result;
}


function convertArrayTargetInObject(target) {
  const splits = target[0].split('~');
  let result;

  if (splits.length > 1) {
    // Access and type are required
    result = {
      access: splits[0],
      type: splits[1],
    };

    // Serialization is default N-Quads
    if (Array.isArray(target)) {
      if (target.length > 1) {
        result['serialization'] = target[1];
      }
      else {
        result['serialization'] = 'nquads';
      }

      // Compression is optional
      if (target.length > 2) {
        result['compression'] = target[2]
      }
    }
  } else {
    result = {
      access: target,
      type: 'void'
    }
  }

  return result;
}

function replaceAll(wanted, value) {
  shortcuts[wanted].forEach(shortcut => {

    if (value[shortcut]) {
      replace(shortcut, wanted, value);
    }
  });
}

function replace(oldName, newName, value) {
  value[newName] = value[oldName];
  delete value[oldName];
}

/**
 * This method expands authors.
 * @param input - The JSON object of the YARRRML rules.
 */
function expandAuthors(input) {
  if (input.authors) {
    let authors = input.authors;

    if (typeof authors === 'string' || authors instanceof String) {
      authors = [authors];
      input.authors = authors;
    }

    for (let i = 0; i < authors.length; i ++) {
      const author = authors[i];

      if (typeof author === 'string' || author instanceof String) {
        const parsedAuthor = parseAuthor(author);

        // This is a WebID.
        if (parsedAuthor.name && parsedAuthor.name.includes('://')) {
          authors[i] = {webid: author};
        } else {
          if (parsedAuthor.url) {
            parsedAuthor.website = parsedAuthor.url;
          }

          delete parsedAuthor.url;
          authors[i] = parsedAuthor;
        }
      }
    }
  }
}

module.exports = expand;
