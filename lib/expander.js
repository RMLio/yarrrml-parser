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
      const subject = mapping.subjects[i];
      mapping.subjects[i] = {
        function: idlabfn + 'trueCondition',
        parameters: [
          {
            parameter: idlabfn + 'strBoolean',
            value: mapping.conditions,
            from: 'function'
          }, {
            parameter: idlabfn + 'str',
            value: subject.type === 'blank' ? null : subject,
            from: subject.function !== undefined ? 'function' : 'subject',
            type: subject.type ? subject.type : 'iri'
          }
        ],
        type: subject.type ? subject.type : 'iri'
      };
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
      }
    } else if (typeof mapping.sources === "string") {
      mapping.sources = [mapping.sources];
    } else {
      Logger.error(`mapping "${mappingKey}": no (valid) source is defined.`);
    }
  } else {
    Logger.error(`mapping "${mappingKey}": no source is defined.`);
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
        const o = po.objects[j];
        // TODO same as in expandSubjects function
        po.objects[j] = {
          function: idlabfn + 'trueCondition',
          parameters: [
            {
              parameter: idlabfn + 'strBoolean',
              value: po.conditions,
              from: 'function'
            }, {
              parameter: idlabfn + 'str',
              value: o.function ? o : o.value,
              type: o.type,
              from: o.function ? 'function' : 'subject'
            }
          ],
          type: o.type
        };

        if (o.datatype) {
          po.objects[j].datatype = o.datatype;
        }
      }

      delete po.conditions;
    }
  }
}

/**
 * This method returns a new object with the conditions expanded.
 * @param o An object of a Predicate Object.
 */
function expandConditionsOfObject(o) {
  if (o.conditions) {

    // TODO same as in expandSubjects function
    const newObj = {
      function: idlabfn + 'trueCondition',
      parameters: [
        {
          parameter: idlabfn + 'strBoolean',
          value: o.conditions[0],
          from: 'function'
        }, {
          parameter: idlabfn + 'str',
          value: o.function ? o : o.value,
          type: o.type,
          from: o.function ? 'function' : 'subject'
        }
      ],
      type: o.type
    };

    if (o.datatype) {
      newObj.datatype = o.datatype;
    }

    return newObj;
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

function replaceAll(wanted, value) {
  //console.log(wanted);
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
