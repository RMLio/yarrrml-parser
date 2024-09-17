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

const idlabfn = 'https://w3id.org/imec/idlab/function#';

// map function names used in code to function id's
const fnMap = new Map();
fnMap.set('createtrue', idlabfn + 'explicitCreate');
fnMap.set('createfalse', idlabfn + 'implicitCreate');
fnMap.set('updatetrue', idlabfn + 'explicitUpdate');
fnMap.set('updatefalse', idlabfn + 'implicitUpdate');
fnMap.set('deletetrue', idlabfn + 'explicitDelete');
fnMap.set('deletefalse', idlabfn + 'implicitDelete');



function expand(input) {
  const output = {};

  extend(true, output, input);

  replaceAll('mappings', output);
  expandMappings(output);
  expandAuthors(output);
  expandSourcesInDocument(output);
  expandTargetsInDocument(output);
  expandChangeDetections(output);
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

function expandTargetsInMapping(mapping) {
  // Replace shortcuts
  replaceAll('targets', mapping);

  // Collect targets in Subject Maps
  if (mapping.subjects) {
    mapping.subjects.forEach(subject => {
      replaceAll('targets', subject)
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
            replaceAll('targets', p);
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
            replaceAll('targets', o);
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

            if (o.language) {
              replaceAll('targets', o.language);
              if (o.language && o.language.targets) {
                if (Array.isArray(o.language.targets)) {
                  for (let i = 0; i < o.language.targets.length; i++) {
                    const target = o.language.targets[i];
                    if (Array.isArray(target)) {
                      o.language.targets[i] = convertArrayTargetInObject(target);
                    }
                  }
                } else if (typeof o.language.targets === 'string') {
                  o.language.targets = [o.language.targets]
                } else {
                  Logger.error(`object language "${JSON.stringify(o.language, null, 2)}": no (valid) target is defined.`);
                }
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
      replaceAll('targets', g);
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

    if (mapping.predicateobjects.length !== 0) {
      mapping.predicateobjects.forEach(po => {
        expandGraphs(po);
      });

      expandPredicates(mapping.predicateobjects);
      expandObjects(mapping.predicateobjects, mappingKey);
      expandConditionsOfPOs(mapping.predicateobjects);
    }
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
  const value = defaultType === 'iri' ? (termMapDescription.type === 'blank' ? null : termMapDescription) : (termMapDescription.function ? termMapDescription : termMapDescription.value);
  const from = termMapDescription.function ? 'function' : 'subject';
  const type = termMapDescription.type ? termMapDescription.type : defaultType;
  const datatype = termMapDescription.datatype;
  const language = termMapDescription.language;
  const targets = termMapDescription.targets;

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

  if (targets) {
    termMapDescription.targets = targets;
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

function expandChangeDetections (document) {
  if (document.mappings !== undefined && document.mappings !== null) {

    // This will store versions of the original mappings
    // possibly copied and modified by change detection operators
    let newMappings = {};

    const mappings = Object.keys(document.mappings);
    for (let i = 0; i < mappings.length; i++) {
      const mappingKey = mappings[i];
      // merge the mappings resulting from the change detection
      newMappings = {...newMappings, ...processChangeDetection(document, mappingKey)};
    }
    document.mappings = newMappings;
  }
}

function processChangeDetection(document, mappingKey) {
  let newMappings = {};
  const mapping = document.mappings[mappingKey];
  if (mapping) {
    if (mapping && mapping.changeDetection) { // ...then we have some InRML stuff here!
      const changeDetection = mapping.changeDetection;

      // loop over operations
      Object.keys(changeDetection).forEach(operation_name => {
        Logger.debug(`Found change detection operation "${operation_name}"`);
        let operation = changeDetection[operation_name];
        let isExplicit = operation.explicit || operation.explicit === undefined || operation.explicit === null;
        Logger.debug(`  operation type explicit? ${isExplicit}`);

        // clone the original mapping; make changes to the clone.
        let newMapping = structuredClone(mapping);
        delete newMapping.changeDetection

        if (operation_name === 'delete') {
          // check if there are PO mappingAdds
          const poAddDefined = operation.mappingAdd !== undefined && (operation.mappingAdd.po !== undefined || operation.mappingAdd.predicateobjects !== undefined);

          // delete all PO mappings except the ones with predicate `rdf:type`
          let newPOMappings = [];
          if (!poAddDefined) {
            for (const poMapping of newMapping.predicateobjects) {
              let newPO = {};
              for (const predicate of poMapping.predicates) {
                if (predicate === 'a' || predicate === 'rdf:type' || predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                  newPO.predicates = [predicate];
                  newPO.objects = poMapping.objects;
                  newPOMappings.push(newPO);
                  break;
                }
              }
            }
          }
          newMapping.predicateobjects = newPOMappings;
        }

        // process the things to be removed from the mapping
        if (operation.mappingRemove) {
          processMappingRemove(document, newMapping, operation.mappingRemove);
        }
        // process the things to be added to the mapping
        if (operation.mappingAdd) {
          processMappingAdd(document, newMapping, operation.mappingAdd);
        }

        for (const subjectIndex in newMapping.subjects) {
          let mappingSubject = newMapping.subjects[subjectIndex];

          // extract targets, if any
          const targets = mappingSubject.targets;
          if (targets !== undefined) {
            delete mappingSubject.targets;
          }

          let value;
          if (typeof mappingSubject === 'string') {
            value = mappingSubject;
          } else if (mappingSubject.value) {
            value = mappingSubject.value;
          } else { // it must be a function
            value = mappingSubject;
          }

          // build change detection function (for each subject)
          const functionName = fnMap.get(operation_name + isExplicit);
          let parameters = [
            {
              parameter: idlabfn + 'iri',
              value: value,
              from: 'subject',
              type: 'iri',
            }
          ];
          if (functionName === idlabfn + 'implicitUpdate' && operation.watchedProperties) {
            const wpArray = typeof operation.watchedProperties === 'string' ? [operation.watchedProperties] : operation.watchedProperties;
            const wpString = _toWatchedPropertiesString(wpArray);
            parameters.push({
              parameter: idlabfn + 'watchedProperty',
              value: wpString,
              from: 'subject',
              type: 'literal'
            });
          }

          // replace original subject with this function
          let newSubject = {
            function: functionName,
            parameters: parameters,
            type: 'iri'
          }

          if (targets !== undefined) {
            newSubject.targets = targets;
          }

          newMapping.subjects[subjectIndex] = newSubject;
        }

        // add the new mapping to the list of new mappings
        newMappings[mappingKey + '-' + operation_name] = newMapping;

      });
    } else {
      newMappings[mappingKey] = mapping;
    }
  }
  return newMappings;
}

function processMappingRemove(document, mapping, mappingRemove) {
  processMappingChange(document, mapping, mappingRemove, false);
}

function mappingRemoveForKey (document, mapping, mappingRemove, mappingKey) {
  // normalize: convert a string into an array of one string
  const removeValues = typeof (mappingRemove[mappingKey]) === 'string' ? [mappingRemove[mappingKey]] : mappingRemove[mappingKey];
  let newObjects = [];

  // Only iterate if it's iterable
  for (const removeValue of removeValues) {
    // Iterate over the mapping's [sources or graphs] (called 'objects' from now on) and adjust.
    // Note that inlining a referred object is important because other mappings may also refer to that object!
    for (let object of mapping[mappingKey]) {
      if (typeof object === 'string') {
        // is 'removeValue' the object name by coincidence?
        if (object !== removeValue) {
          if (document[mappingKey] !== undefined && document[mappingKey] !== null) {
            // it's a reference! so make it inline and process as if it's inline.
            // Find the referred object, if any.
            const referredObject = document[mappingKey][object];
            if (referredObject !== undefined && referredObject !== null) {
              object = structuredClone(referredObject);
              delete object[removeValue];
              // Inline referred object (= replace reference with copy of original)
              newObjects.push(object);
            }
          } else {
            // it's not a reference, so don't remove
            newObjects.push(object);
          }
        } // else remove!
      } else {
        delete object[removeValue];
        // Inline referred object (= replace reference with copy of original)
        newObjects.push(object);
      }
    }
  }
  return newObjects;
}

function mappingRemovePO(mapping, mappingRemove) {
  // remove every matching combination of predicates and objects
  if (mappingRemove.predicateobjects.length === 0) {
    delete mapping.predicateobjects;
  } else {
    for (const poArr of mappingRemove.predicateobjects) {
      const predicates = poArr.predicates;
      const objects = poArr.objects;
      for (const predicate of predicates) {
        const predicateId = getId(predicate);
        for (const object of objects) {
          const objId = getId(object);
          removePOMapping(predicateId, objId, mapping);
        }
      }
    }
  }
}

function getId(termMap) {
  // an term mapping gets identified by a `value` or a `function` or ....
  let id;
  if (typeof termMap === 'string') {
    id = termMap;
  } else if (Object.hasOwn(termMap, 'value')) {
    id = termMap.value;
  } else if (Object.hasOwn(termMap, 'function')) {
    id = termMap.function;
  } else if (Object.hasOwn(termMap, 'access')) {
    id = termMap.access;
  }
  return id;
}

/**
 * Given a predicate and an object ID, search for corresponding PO mappings and remove them.
 * @param idOfPredicateToRemove
 * @param idOfObjectToRemove
 * @param mapping
 */
function removePOMapping(idOfPredicateToRemove, idOfObjectToRemove, mapping) {
  let newPOMapping = [];

  for (const poArr of mapping.predicateobjects) {
    for (const predicate of poArr.predicates) {
      for (const object of poArr.objects) {
        const predicateId = getId(predicate);
        const objectId = getId(object);
        if (predicateId !== idOfPredicateToRemove || objectId !== idOfObjectToRemove) {
          predicates = [predicate];
          objects = [object];
          newPOMapping.push({predicates, objects});
        }
      }
    }
  }

  // replace the new PO mapping in the original mapping, or delete if empty:
  if (newPOMapping.length > 0) {
    mapping.predicateobjects = newPOMapping;
  } else {
    delete mapping.predicateobjects;
  }
}

function mappingRemoveSubjects(mapping, mappingRemove) {
  let mappingRemoveSubjects = new Set(mappingRemove.subjects);

  // if the set of subjects to remove is empty, delete all subjects
  if (mappingRemoveSubjects.size === 0) {
    delete mapping.subjects;
    return;
  }

  // in a first iteration, we remove targets defined in mappingRemove (if any)
  for (const subject of mappingRemoveSubjects) {
    const subjectId = getId(subject);
    if (subjectId === undefined) {
      // then there's probably a sub-key we want to remove from all subjects.
      if (Object.hasOwn(subject, 'targets')) {
        for (let mappingSubject of mapping.subjects) {  // subjects still to process
          delete mappingSubject.targets;
        }
        mappingRemoveSubjects.delete(subject);
      }
    }
  }

  if (mappingRemoveSubjects.size > 0) {
    // in a second iteration, keep only the subjects that are specified in mappingRemove (if any)
    let newSubjects = [];

    for (const subject of mappingRemoveSubjects) {
      const subjectId = getId(subject);
      for (const mappingSubject of mapping.subjects) {
        const mappingSubjectId = getId(mappingSubject);
        if (subjectId !== mappingSubjectId) {
          newSubjects.push(mappingSubject);
        }
      }
    }

    // replace the new subject mapping in the original mapping, or delete if empty:
    if (newSubjects.length > 0) {
      mapping.subjects = newSubjects;
    } else {
      delete mapping.subjects;
    }
  }

}

function processMappingAdd(document, mapping, mappingAdd) {
  processMappingChange(document, mapping, mappingAdd, true);
}

function processMappingChange(document, mapping, mappingAddOrRemove, isAdd) {
  const mappingKey = isAdd ? 'mappingAdd' : 'mappingRemove';

  replaceAll('sources', mappingAddOrRemove);
  if (mappingAddOrRemove.sources !== undefined && mappingAddOrRemove.sources !== null) {
    expandSourcesInMapping(mappingAddOrRemove, mappingKey);
    mapping.sources = isAdd ? mappingAddForKey(document, mapping, mappingAddOrRemove, 'sources')
        : mappingRemoveForKey(document, mapping, mappingAddOrRemove, 'sources');
    if (mapping.sources.length === 0) {
      delete mapping.sources;
    }
  }

  replaceAll('subjects', mappingAddOrRemove);
  if (mappingAddOrRemove.subjects !== undefined && mappingAddOrRemove.subjects !== null) {
    expandSubjects(mappingAddOrRemove, mappingKey);
    expandTargetsInMapping(mappingAddOrRemove);
    if (isAdd) {
      mapping.subjects = mappingAddForKey(document, mapping, mappingAddOrRemove, 'subjects');
    } else {
      mappingRemoveSubjects(mapping, mappingAddOrRemove);
    }
  }

  replaceAll('graphs', mappingAddOrRemove);
  if (mappingAddOrRemove.graphs !== undefined && mappingAddOrRemove.graphs !== null) {
    expandGraphs(mappingAddOrRemove);
    mapping.graphs = isAdd ? mappingAddForKey(document, mapping, mappingAddOrRemove, 'graphs')
        : mappingRemoveForKey(document, mapping, mappingAddOrRemove, 'graphs');
    if (mapping.graphs.length === 0) {
      delete mapping.graphs;
    }
  }

  replaceAll('predicateobjects', mappingAddOrRemove);
  if (mappingAddOrRemove.predicateobjects !== undefined && mappingAddOrRemove.predicateobjects !== null) {
    expandPredicateObjects(mappingAddOrRemove, mappingKey);
    if (isAdd) {
      mapping.predicateobjects = addPOMappings(mapping, mappingAddOrRemove.predicateobjects);
    } else {
      mappingRemovePO(mapping, mappingAddOrRemove);
    }
  }

}

function mappingAddForKey(document, mapping, mappingAdd, mappingKey) {
  // normalize: convert a string into an array of one string
  const addValues = typeof (mappingAdd[mappingKey]) === 'string' ? [mappingAdd[mappingKey]] : mappingAdd[mappingKey];
  let newObjects = Object.hasOwn(mapping, mappingKey)? structuredClone(mapping[mappingKey]) : [];

  // in a first iteration: add all necessary sources (if any)
  for (const addValue of addValues) {
    if (typeof addValue === 'string' && document[mappingKey] !== undefined && document[mappingKey] != null) {
      // it's a reference
      const referredObject = document[mappingKey][addValue];
      if (referredObject !== undefined && referredObject !== null) {
        newObjects.push(structuredClone(referredObject));
      }
    } else {
      const objectId = getId(addValue);
      if (objectId !== undefined) {
        newObjects.push(addValue);
      }
    }
  }

  // in a second iteration: add sub-keys (if any)
  for (const addValue of addValues) {
    if (typeof addValue === 'object') {
      const objectId = getId(addValue);
      if (objectId === undefined) {
        // the sub-keys need to be added to all sources
        for (let objectIndex in newObjects) {
          let object = newObjects[objectIndex];
          if (typeof object === 'string') {
            // if object is a string, then should be a reference to an object. Inline it first
            if (document[mappingKey] !== undefined && document[mappingKey] != null) {
              // it IS a reference!
              const referredObject = document[mappingKey][object];
              if (referredObject !== undefined && referredObject !== null) {
                object = structuredClone(referredObject);
                newObjects[objectIndex] = object;
              }
            } else if (mappingKey === 'subjects') {
              // for subjects, a string is a shortcut to the `value` sub-key of a `subject` object.
              // so now we create a subject object.
              object = { value: object};
            }
          }
          for (const key of Object.keys(addValue)) {
            object[key] = addValue[key];
          }
          newObjects[objectIndex] = object;
        }
      }
    }
  }

  return newObjects;
}

function addPOMappings(mapping, newPOMappings) {
  let newPOs = []
  if (mapping.predicateobjects) {
    // Just add, without checking anything.
    // in the ideal world, this could be optimized by merging PO maps wherever possible.
    newPOs = structuredClone(mapping.predicateobjects);
    for (const newPOMapping of newPOMappings) {
      newPOs.push(newPOMapping);
    }
  } else {
    newPOs = newPOMappings;
  }
  return newPOs;
}

// helper function to put watched properties into one string to pass to generateUniqueIRI function
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

module.exports = expand;
