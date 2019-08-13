/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const assert = require('assert');
const expand = require('./expander.js');

describe('expander', () => {
  describe('shortcuts', () => {
    it('subjects', () => {
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
      assert.deepStrictEqual(output, expectedOutput);
    });

    it('mappings', () => {
      let input = {
        m: {
          person: {
            subjects: ["http://example.com/{ID}"]
          },
          project: {
            subjects: ["http://example2.com/{ID}"]
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

      let output = expand(input);
      assert.deepStrictEqual(output, expectedOutput);

      input = {
        mapping: {
          person: {
            subjects: ["http://example.com/{ID}"]
          },
          project: {
            subjects: ["http://example2.com/{ID}"]
          }
        }
      };

      output = expand(input);
      assert.deepStrictEqual(output, expectedOutput);
    });
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

    assert.deepStrictEqual(output, expectedOutput);
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

    assert.deepStrictEqual(output, expectedOutput);
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
      assert.deepStrictEqual(output, expectedOutput);
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
      assert.deepStrictEqual(output, expectedOutput);
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
      assert.deepStrictEqual(output, expectedOutput);
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
      assert.deepStrictEqual(output, expectedOutput);
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
      assert.deepStrictEqual(output, expectedOutput);
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
      assert.deepStrictEqual(output, expectedOutput);
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
      assert.deepStrictEqual(output, expectedOutput);
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
      assert.deepStrictEqual(output, expectedOutput);
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
      assert.deepStrictEqual(output, expectedOutput);
    });
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
    assert.deepStrictEqual(output, expectedOutput);
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
    assert.deepStrictEqual(output, expectedOutput);
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
    assert.deepStrictEqual(output, expectedOutput);
  });

  it('function on subject', () => {
    const input = {
      mappings: {
        person: {
          subject:
            {
              fn: 'ex:toLowerCase',
              pms: [
                ['ex:input', '$(firstname)']
              ]
            }
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
                  value: '$(firstname)',
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
    assert.deepStrictEqual(output, expectedOutput);
  });

  it('condition and function on same po', () => {
    const input = {
      mappings: {
        person: {
          po: [
            {
              predicates: 'foaf:firstName',
              objects: [
                {
                  function: 'grel:toUpperCase',
                  parameters: [
                    {
                      parameter: 'grel:valueParamter',
                      value: '$(firstname)'
                    }
                  ]
                }
              ],
              condition: {
                function: 'idlab-fn:stringContainsOtherString',
                parameters: [
                  {
                    parameter: 'idlab-fn:str',
                    value: '$(firstname)'
                  },
                  {
                    parameter: 'idlab-fn:otherStr',
                    value: 'J'
                  },
                  {
                    parameter: 'idlab-fn:delimiter',
                    value: ''
                  }
                ]
              }
            }
          ]
        }
      }
    };

    const expectedOutput = {
      mappings:
        {
          person:
            {
              predicateobjects:
                [{
                  predicates: ['foaf:firstName'],
                  objects:
                    [{
                      function: 'http://example.com/idlab/function/trueCondition',
                      parameters:
                        [{
                          parameter: 'http://example.com/idlab/function/strBoolean',
                          value:
                            {
                              function: 'idlab-fn:stringContainsOtherString',
                              parameters:
                                [{parameter: 'idlab-fn:str', value: '$(firstname)'},
                                  {parameter: 'idlab-fn:otherStr', value: 'J'},
                                  {parameter: 'idlab-fn:delimiter', value: ''}]
                            },
                          from: 'function'
                        },
                          {
                            parameter: 'http://example.com/idlab/function/str',
                            value:
                              {
                                function: 'grel:toUpperCase',
                                parameters:
                                  [{parameter: 'grel:valueParamter', value: '$(firstname)'}]
                              },
                            type: undefined,
                            from: 'function'
                          }],
                      type: undefined
                    }]
                }]
            }
        }
    };

    const output = expand(input);
    assert.deepStrictEqual(output, expectedOutput);
  });

  it('condition on po', () => {
    const input = {
      mappings: {
        person: {
          po: [
            {
              predicates: 'foaf:firstName',
              objects: '$(firstname)',
              condition: {
                function: 'idlab-fn:equal',
                parameters: [
                  {
                    parameter: 'grel:valueParameter',
                    value: '$(firstname)'
                  },
                  {
                    parameter: 'grel:valueParameter2',
                    value: 'test'
                  }
                ]
              }
            }]
        }
      }
    };

    const expectedOutput = {
      mappings:
        {
          person:
            {
              predicateobjects:
                [{
                  predicates: ['foaf:firstName'],
                  objects:
                    [{
                      function: 'http://example.com/idlab/function/trueCondition',
                      parameters:
                        [{
                          parameter: 'http://example.com/idlab/function/strBoolean',
                          value:
                            {
                              function: 'idlab-fn:equal',
                              parameters:
                                [{parameter: 'grel:valueParameter', value: '$(firstname)'},
                                  {parameter: 'grel:valueParameter2', value: 'test'}]
                            },
                          from: 'function'
                        },
                          {
                            parameter: 'http://example.com/idlab/function/str',
                            value: '$(firstname)',
                            type: 'literal',
                            from: 'subject'
                          }],
                      type: 'literal'
                    }]
                }]
            }
        }
    };

    const output = expand(input);
    assert.deepStrictEqual(output, expectedOutput);
  });
});
