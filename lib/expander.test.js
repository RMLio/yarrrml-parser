/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const assert = require('assert');
const expand = require('./expander.js');

describe('subjects', () => {
  it('shortcuts', () => {
    const input = {
      mappings: {
        person: {
          subject: ["http://example.com/{ID}"]
        },
        project: {
          s: ["http://example2.com/{ID}"]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          subjects: ["http://example.com/{ID}"]
        },
        project: {
          subjects: ["http://example2.com/{ID}"]
        }
      }
    };

    const output = expand(input);

    assert.deepEqual(output, expectedOutput);
  });

  it('string to array', () => {
    const input = {
      mappings: {
        person: {
          subjects: "http://example.com/{ID}"
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          subjects: ["http://example.com/{ID}"]
        }
      }
    };

    const output = expand(input);

    assert.deepEqual(output, expectedOutput);
  });

  it('function', () => {
    const input = {
      mappings: {
        person: {
          subjects: [
            {
              fn: 'ex:toLowerCase',
              pms: [
                ['ex:input', '$(name)']
              ]
            }
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          subjects: [
            {
              function: 'ex:toLowerCase',
              parameters: [
                {
                  parameter: 'ex:input',
                  value: '$(name)',
                  type: 'literal',
                  from: 'subject'
                }
              ]
            }
          ]
        }
      }
    };

    const output = expand(input);

    assert.deepEqual(output, expectedOutput);
  })
});

describe('predicateobjects', () => {
  it('shortcuts', () => {
    const input = {
      mappings: {
        person: {
          predicateobject: []
        },
        project: {
          po: []
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          predicateobjects: []
        },
        project: {
          predicateobjects: []
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('array to object (1)', () => {
    const input = {
      mappings: {
        person: {
          predicateobject: [
            ["foaf:firstName", "$(firstname)"]
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ["foaf:firstName"],
              objects: [
                {
                  value: "$(firstname)",
                  type: 'literal'
                }
              ]
            }
          ]
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('array to object (2)', () => {
    const input = {
      mappings: {
        person: {
          predicateobject: [
            [["foaf:name", "rdfs:label"], ["$(firstname)", '$(lastname)']]
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ["foaf:name", "rdfs:label"],
              objects: [
                {
                  value: "$(firstname)",
                  type: 'literal'
                },
                {
                  value: "$(lastname)",
                  type: 'literal'
                }
              ]
            }
          ]
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('object is iri', () => {
    const input = {
      mappings: {
        person: {
          predicateobject: [
            [["foaf:name", "rdfs:label"], ["$(firstname)~iri"]]
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ["foaf:name", "rdfs:label"],
              objects: [
                {
                  value: "$(firstname)",
                  type: 'iri'
                }
              ]
            }
          ]
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('datatype (1)', () => {
    const input = {
      mappings: {
        person: {
          predicateobjects: [
            ["foaf:firstName", "$(firstname)", 'xsd:string']
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ["foaf:firstName"],
              objects: [{
                value: "$(firstname)",
                type: 'literal',
                datatype: 'xsd:string'
              }]
            }
          ]
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('datatype (2)', () => {
    const input = {
      mappings: {
        person: {
          predicateobjects: [
            ["foaf:firstName", ["$(firstname)", '$(test)'], 'xsd:string'
            ]
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ["foaf:firstName"],
              objects: [{
                value: "$(firstname)",
                type: 'literal',
                datatype: 'xsd:string'
              }, {
                value: "$(test)",
                type: 'literal',
                datatype: 'xsd:string'
              }]
            }
          ]
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('language (1)', () => {
    const input = {
      mappings: {
        person: {
          predicateobjects: [
            ["foaf:firstName", "$(firstname)", 'en~lang']
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ["foaf:firstName"],
              objects: [{
                value: "$(firstname)",
                type: 'literal',
                language: 'en'
              }]
            }
          ]
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('language (2)', () => {
    const input = {
      mappings: {
        person: {
          predicateobjects: [
            ["foaf:firstName", ["$(firstname)", '$(test)'], 'en~lang'
            ]
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ["foaf:firstName"],
              objects: [{
                value: "$(firstname)",
                type: 'literal',
                language: 'en'
              }, {
                value: "$(test)",
                type: 'literal',
                language: 'en'
              }]
            }
          ]
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('language (3)', () => {
    const input = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ["foaf:firstName"],
              objects: [
                ["$(firstname)", 'en~lang'],
                ["$(test)", 'nl~lang']
              ]
            }
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ["foaf:firstName"],
              objects: [{
                value: "$(firstname)",
                type: 'literal',
                language: 'en'
              }, {
                value: "$(test)",
                type: 'literal',
                language: 'nl'
              }]
            }
          ]
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('sources in mappings', () => {
    const input = {
      mappings: {
        person: {
          sources: [
            ['data/person.json~jsonpath', '$'],
            ['data/person2.json~jsonpath', '$.persons[*]']
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          sources: [
            {
              access: 'data/person.json',
              referenceFormulation: 'jsonpath',
              iterator: '$'
            },
            {
              access: 'data/person2.json',
              referenceFormulation: 'jsonpath',
              iterator: '$.persons[*]'
            }
          ]
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('sources in document', () => {
    const input = {
      sources: {
        person: ['data/person.json~jsonpath', '$'],
        project: ['data/person2.json~jsonpath', '$.persons[*]']
      }
    };

    const expectedOutput = {
      sources: {
        person: {
          access: 'data/person.json',
          referenceFormulation: 'jsonpath',
          iterator: '$'
        },
        project: {
          access: 'data/person2.json',
          referenceFormulation: 'jsonpath',
          iterator: '$.persons[*]'
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });

  it('function on object', () => {
    const input = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ['foaf:test'],
              objects: [
                {
                  fn: 'ex:toLowerCase',
                  pms: [
                    ['ex:input', '$(firstname)']
                  ]
                }
              ]
            }
          ]
        }
      }
    };

    const expectedOutput = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ['foaf:test'],
              objects: [
                {
                  function: 'ex:toLowerCase',
                  parameters: [
                    {
                      parameter: 'ex:input',
                      value: '$(firstname)',
                      type: 'literal',
                      from: 'subject'
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    };

    const output = expand(input);
    assert.deepEqual(output, expectedOutput);
  });
});