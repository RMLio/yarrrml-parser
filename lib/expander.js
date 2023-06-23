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
  rewriteLDESes(output);
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
        expandPredicateObjects(mapping, mappingKey);
        expandGraphs(mapping);
        expandTargetsInMapping(mapping);
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
      if (mapping.subjects.endsWith('~ldes')) {
        mapping.subjects = mapping.subjects.slice(0, -5)
        Logger.debug('LDES annotation found');
        mapping.subjects = expandLDES(mapping.subjects);
      }
      mapping.subjects = [mapping.subjects]
    } else if (Array.isArray(mapping.subjects)) {
      for (let i = 0; i < mapping.subjects.length; i++) {
        if (typeof mapping.subjects[i] === 'object') {
          mapping.subjects[i] = expandLDES(mapping.subjects[i])
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

function expandTargetsInMapping(mapping) {
  // Replace shortcuts
  replaceAll('targets', mapping);

  // Collect targets in Subject Maps
  if (mapping.subjects) {
    mapping.subjects.forEach(subject => {
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

        expandFunction(po.objects[j], true);

        //condition
        replaceAll('conditions', po.objects[j]);

        if (po.objects[j].conditions) {

          if (typeof po.objects[j].conditions === 'object' && !Array.isArray(po.objects[j].conditions)) {
            po.objects[j].conditions = [po.objects[j].conditions];
          }

          po.objects[j].conditions.forEach(c => {
            expandFunction(c, true);
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

function expandFunction(input, canHaveObject = false) {
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
          value: '' + e[1] ,// turn ints into strings
          from: "subject"
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
            input.parameters[i].from = canHaveObject ? e[2] : "subject";
          } else {
            Logger.error(`\`from\` has to have the value "s", "subject", "o", or "object`);
          }
        } else {
          if (e[0] === 'str1') {
            input.parameters[i].from = "subject"
          } else if (e[0] === 'str2') {
            input.parameters[i].from = canHaveObject ? "object" : "subject";
          } else {
            // I know this can be written shorter, but makes for a bit more clearer code
            input.parameters[i].from = "subject"
          }
        }
      } else {
        replaceAll('parameter', e);
        replaceAll('value', e);
        e.from = "subject"
      }

      if (e.value instanceof Object) {
        expandFunction(e.value, canHaveObject);
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

/**
 * Interpret a condition description as a function description
 * @param {object} conditions expanded condition descriptions as described in the YARRRML document
 * @param {object} termMapDescription term map description
 * @param {string | undefined} defaultType default term type of the resulting to be generated term
 * @returns term map description using a nested 'trueCondition' function instead of a condition description
 */
function conditionToFunction(conditions, termMapDescription, defaultType = undefined) {
  // TODO it's very weird that it's either value or complete map
  value = defaultType === 'iri' ? (termMapDescription.type === 'blank' ? null : termMapDescription) : (termMapDescription.function ? termMapDescription : termMapDescription.value);
  from = termMapDescription.function ? 'function' : 'subject';
  type = termMapDescription.type ? termMapDescription.type : defaultType;
  datatype = termMapDescription.datatype;
  language = termMapDescription.language;
  termMapDescription = {
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
    termMapDescription.datatype = datatype;
  }
  if (language) {
    termMapDescription.language = language;
  }

  return termMapDescription;
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

function expandLDES(subject) {
  let ldes = {};
  if (subject !== undefined) {
    if (typeof subject === 'string') {
        ldes.memberSubject = subject;
        subject = {
          value: subject,
        };
    } else if (typeof subject === 'object' && subject !== null) {
      if (subject.ldes !== undefined) {
        if (subject.ldes !== null) {
          ldes = subject.ldes;
        }
        ldes.memberSubject = subject.value
      } else {
        // there is no LDES
        return subject;
      }
    }
  } else {
    // no subject, no LDES
    return subject;
  }

  // the 'shape' key is just copied...

  if (ldes.id === undefined || ldes.id === null) {
    ldes.id = 'http://example.org/eventstream';
  }

  // TODO: watchedProperties: allow shortcut watchedProperties: <property str> ?
  if (ldes.watchedProperties === undefined) {
    ldes.watchedProperties = [];
  } else {
    // just check if it's an array
    if (!Array.isArray(ldes.watchedProperties)) {
      Logger.error('LDES `watchedProperties` must be an array.');
    }
  }

  // TODO: versionOfPath: allow shortcut versionOfPath: <predicate> ?
  if (ldes.versionOfPath !== undefined && ldes.versionOfPath !== null) {

    let newVersionOfPath = {};
    if (Array.isArray(ldes.versionOfPath)) {
      if (ldes.versionOfPath.length === 0) {
        newVersionOfPath.predicate = 'http://purl.org/dc/terms/isVersionOf';
        newVersionOfPath.object = ldes.memberSubject;
        if (!newVersionOfPath.object.endsWith('~iri')) {
          newVersionOfPath.object += '~iri';
        }
      } else if (ldes.versionOfPath.length === 1) {
        newVersionOfPath.predicate = ldes.versionOfPath[0];
        // fill in member subject for now, check if predicate exists later on
        newVersionOfPath.object = ldes.memberSubject;
        if (!newVersionOfPath.object.endsWith('~iri')) {
          newVersionOfPath.object += '~iri';
        }
      } else if (ldes.versionOfPath.length === 2) {
        newVersionOfPath.predicate = ldes.versionOfPath[0];
        newVersionOfPath.object = ldes.versionOfPath[1];
        if (!newVersionOfPath.object.endsWith('~iri')) {
          newVersionOfPath.object += '~iri';
        }
      } else {
        Logger.error('LDES `versionOfPath` must be an array of maximum two strings.');
      }
    } else {
      Logger.error('LDES `versionOfPath` must be an array.');
    }
    const expandedpos = expandPredicateAndObject(newVersionOfPath.predicate, newVersionOfPath.object);
    newVersionOfPath.predicate = expandedpos[0];
    newVersionOfPath.object = expandedpos[1];
    ldes.versionOfPath = newVersionOfPath;
  } else {
    ldes.versionOfPath = null;
  }

  // TODO: timestampPath: allow shortcut timestampPath: <predicate> ?
  if (ldes.timestampPath !== undefined && ldes.timestampPath !== null) {
    let newTimestampPath = {};
    if (Array.isArray(ldes.timestampPath)) {
      if (ldes.timestampPath.length >= 1) {
        newTimestampPath.predicate = ldes.timestampPath[0];
        newTimestampPath.object = null;
        newTimestampPath.oDataType = null;
        // TODO the predicate and object have to be present as predicateobject mapping; check later?
        if (ldes.timestampPath.length >= 2) {
          newTimestampPath.object = ldes.timestampPath[1];
          // TODO: add predicateobjectmapping if not exists
          if (ldes.timestampPath.length === 3) {
            newTimestampPath.oDataType = ldes.timestampPath[2];
          } else {
            Logger.error('LDES `timestampPath` must be an array of maximum three strings.');
          }
        }
      } else {
        Logger.error('LDES `timestampPath` must be an array of minimum one string.');
      }
    } else {
      Logger.error('LDES timestampPath must be an array.');
    }
    const expandedpos = expandPredicateAndObject(newTimestampPath.predicate, newTimestampPath.object);
    newTimestampPath.predicate = expandedpos[0];
    newTimestampPath.object = expandedpos[1];
    ldes.timestampPath = newTimestampPath;
  } else {
    ldes.timestampPath = null;
  }

  if (ldes.memberIDFunction !== undefined && ldes.memberIDFunction !== null) {
    expandFunction(ldes.memberIDFunction);
  } else {
    // use the default generateUniqueIRI function, so prepare parameters
    const watchedPropertiesStr = _toWatchedPropertiesString(ldes.watchedProperties);

    ldes.memberIDFunction = {
      function: idlabfn + 'generateUniqueIRI',
      parameters: [
        {
          parameter: idlabfn + 'iri',
          value: ldes.memberSubject,
          from: 'subject',
          type: 'iri',
        },
        {
          parameter: idlabfn + 'watchedProperty',
          value: watchedPropertiesStr,
          from: 'subject',
          type: 'literal'
        }
      ],
    };
  }

  if (ldes.shape === undefined) {
    ldes.shape = null;
  }

  subject.ldes = ldes;
  return subject;

}

/**
 * This rewrites the mappings so that LDES specific triples can be generated
 * according to the CURRENT implementation in RMLMapper. If that implementation changes,
 * and it will, then this function definitely needs to change.
 * (see https://dylanvanassche.be/assets/pdf/eswc2022-rml-ldes.pdf)
 * @param document the YARRRML document to rewrite LDES stuff for.
 */
function rewriteLDESes(document) {
  if (document.mappings !== undefined && document.mappings !== null) {
    for (let mapping of Object.values(document.mappings)) {
      for (let subject of mapping.subjects) {
        if (subject.ldes !== null && subject.ldes !== undefined) {
          const ldes = subject.ldes;
          if (subject.targets !== null && subject.targets !== undefined) {
            for (let target of subject.targets) {
              // if the target is of type string, then it's a reference to a target definition
              let realTarget = typeof target === 'string' ? document.targets[target] : target;
              // make the target an LDES target!
              realTarget.ldes = {
                id: ldes.id,
                versionOfPath: ldes.versionOfPath,
                timestampPath: ldes.timestampPath,
                shape: ldes.shape
              };
            }

            // check / add LDES-related predicate-object mappings for versionOfPath
            if (ldes.versionOfPath !== null) {
              // check if predicate & object mappings exist. If not, add them.
              addLDESSpecificPredicateObjects(ldes.versionOfPath.predicate, ldes.versionOfPath.object, mapping.predicateobjects);
            }

            // check / add LDES-related predicate-object mappings for timestampPath
            if (ldes.timestampPath !== null) {
              // check if predicate & object mappings exist. If not, add them.
              addLDESSpecificPredicateObjects(ldes.timestampPath.predicate, ldes.timestampPath.object, mapping.predicateobjects);
            }

            // remove ldes properties object from subject
            delete subject.ldes;

            // replace the subject with the LDES member id function
            subject.function = ldes.memberIDFunction.function;
            subject.parameters = ldes.memberIDFunction.parameters;
            delete subject.value;

          } else { // If there are no targets, we have to add an LDES target!
            // TODO: for the current implementation of LDES in RML, there HAS to be a target.
            // This will change in the upcoming new implementation
            Logger.error('The current RML LDES generation mappings require a target at subject mapping level. ' +
                'This will change in the future.');
          }
        }
      }
    }
  }


}

function addLDESSpecificPredicateObjects(predicate, object, predicateobjects) {
  let found = false;
  for (let predicateobject of predicateobjects) {
    for (let i = 0; i < predicateobject.predicates.length; i++) {
      // if the predicate exists, the object must be the same if the given object is not null
      if (predicateobject.predicates[i] === predicate) {
        found = true;
        if (object !== null && predicateobject.objects[i] !== object) {
          const objectToUse = predicateobject.objects[i];
          Logger.warn(`The versionOf or timestampPath predicate ${predicate} expects an object mapping ${object}, but is ${objectToUse}. Using the existing ${objectToUse}.`);
        }
      }
    }
  }
  if (!found) {
    predicateobjects.push({
      predicates: [predicate],
      objects: [object]
    });
  }
}

// helper function to put LDES watched properties into one string to pass to generateUniqueIRI function
function _toWatchedPropertiesString(watchedPropertiesArray) {
  let resultStr = '';
  if (watchedPropertiesArray.length > 0) {
    const watchedProperty = _parseTemplate(watchedPropertiesArray[0]);
    resultStr = watchedProperty.concat('=$(').concat(watchedProperty).concat(')');
  }
  for (let i = 1; i < watchedPropertiesArray.length; i++) {
    const watchedProperty = _parseTemplate(watchedPropertiesArray[i]);
    const wpStr = '&'.concat(watchedProperty).concat('=$(').concat(watchedProperty).concat(')');
    resultStr = resultStr.concat(wpStr);
  }
  return resultStr;
}

// TODO: Almost literally copied from abstract-generator.js. Is there an elegant way of re-using that function?
function _parseTemplate(t) {
  t = '' + t; // Make sure it's a string.
  t = t.replace(/\\\\/g, '@@@BACKWARD-SLASH@@@'); // We want to preserve real backward slashes.
  t = t.replace(/\\\(/g, '@@@BRACKET-OPEN@@@'); // Same for opening brackets.
  t = t.replace(/\\\)/g, '@@@BRACKET-CLOSE@@@'); // Same for closing brackets.
  t = t.replace(/\$\(([^)]*)\)/g, "$1");
  t = t.replace(/@@@BRACKET-CLOSE@@@/g, ')');
  t = t.replace(/@@@BRACKET-OPEN@@@/g, '(');
  t = t.replace(/@@@BACKWARD-SLASH@@@/g, '/');

  return t;
}

function expandPredicateAndObject(predicate, object) {
  const predicateobjects = [{
    predicates: [predicate],
    objects: [object]
  }];

  expandPredicates(predicateobjects);
  if (object !== null) {
    expandObjects(predicateobjects);
    return [predicateobjects[0].predicates[0], predicateobjects[0].objects[0]];
  } else {
    return [predicateobjects[0].predicates[0], null];
  }
}

module.exports = expand;
