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
              ],
              type: 'iri'
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
            subjects: [{type: 'blank'}],
            predicateobjects: []
          },
          project: {
            subjects: [{type: 'blank'}],
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
            subjects: [{type: 'blank'}],
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
            subjects: [{type: 'blank'}],
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
            subjects: [{type: 'blank'}],
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
            subjects: [{type: 'blank'}],
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
            subjects: [{type: 'blank'}],
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
            subjects: [{type: 'blank'}],
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
            subjects: [{type: 'blank'}],
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
            subjects: [{type: 'blank'}],
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

    it('object is number', () => {
      const input = {
        mappings: {
          person: {
            predicateobjects: [
              ["schema:test", 2]
            ]
          }
        }
      };

      const expectedOutput = {
        mappings: {
          person: {
            subjects: [{type: 'blank'}],
            predicateobjects: [
              {
                predicates: ["schema:test"],
                objects: [{
                  value: "2",
                  type: 'literal'
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
          ],
          subjects: [
            {type: 'blank'}
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
          subjects: [{type: 'blank'}],
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

  it('function shortcut', () => {
    const input = {
      mappings: {
        person: {
          predicateobjects: [
            {
              predicates: ['foaf:test'],
              objects: [
                {
                  function: 'ex:toLowerCase(input= $(firstname))'
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
          subjects: [{type: 'blank'}],
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
              ],
              type: 'iri'
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
                      parameter: 'grel:valueParameter',
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
              subjects: [{type: 'blank'}],
              predicateobjects:
                [{
                  predicates: ['foaf:firstName'],
                  objects:
                    [{
                      function: 'https://w3id.org/imec/idlab/function#trueCondition',
                      parameters:
                        [{
                          parameter: 'https://w3id.org/imec/idlab/function#strBoolean',
                          value:
                            {
                              function: 'idlab-fn:stringContainsOtherString',
                              parameters:
                                [{from: "subject", parameter: 'idlab-fn:str', value: '$(firstname)'},
                                  {from: "subject", parameter: 'idlab-fn:otherStr', value: 'J'},
                                  {from: "subject", parameter: 'idlab-fn:delimiter', value: ''}]
                            },
                          from: 'function'
                        },
                          {
                            parameter: 'https://w3id.org/imec/idlab/function#str',
                            value:
                              {
                                function: 'grel:toUpperCase',
                                parameters:
                                  [{from: "subject", parameter: 'grel:valueParameter', value: '$(firstname)'}]
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
              subjects: [{type: 'blank'}],
              predicateobjects:
                [{
                  predicates: ['foaf:firstName'],
                  objects:
                    [{
                      function: 'https://w3id.org/imec/idlab/function#trueCondition',
                      parameters:
                        [{
                          parameter: 'https://w3id.org/imec/idlab/function#strBoolean',
                          value:
                            {
                              function: 'idlab-fn:equal',
                              parameters:
                                [{from: "subject", parameter: 'grel:valueParameter', value: '$(firstname)'},
                                  {from: "subject", parameter: 'grel:valueParameter2', value: 'test'}]
                            },
                          from: 'function'
                        },
                          {
                            parameter: 'https://w3id.org/imec/idlab/function#str',
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

  it('condition on single object', () => {
    const input = {
      mappings: {
        person: {
          po: [
            {
              predicates: 'foaf:firstName',
              objects: [
                {
                  value: '$(firstname)',
                  condition: {
                    function: 'idlab-fn:equal',
                    parameters: [
                      ['grel:valueParameter', '$(firstname)'],
                      ['grel:valueParameter2', 'test']
                    ]
                  }
                }
              ]
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
              subjects: [{type: 'blank'}],
              predicateobjects:
                [{
                  predicates: ['foaf:firstName'],
                  objects:
                    [{
                      function: 'https://w3id.org/imec/idlab/function#trueCondition',
                      parameters:
                        [{
                          parameter: 'https://w3id.org/imec/idlab/function#strBoolean',
                          value:
                            {
                              function: 'idlab-fn:equal',
                              parameters:
                                [{
                                  parameter: 'grel:valueParameter',
                                  value: '$(firstname)',
                                  type: 'literal',
                                  from: 'subject'
                                },
                                  {
                                    parameter: 'grel:valueParameter2',
                                    value: 'test',
                                    type: 'literal',
                                    from: 'subject'
                                  }]
                            },
                          from: 'function'
                        },
                          {
                            parameter: 'https://w3id.org/imec/idlab/function#str',
                            value: '$(firstname)',
                            type: undefined,
                            from: 'subject'
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

  it('condition on mapping with blank node as subject', () => {
    const input = {
      "prefixes": {
        "idlab-fn": "https://w3id.org/imec/idlab/function#",
        "grel": "http://users.ugent.be/~bjdmeest/function/grel.ttl#"
      },
      "mappings": {
        "test": {
          "condition": {
            "function": "idlab-fn:equal",
            "parameters": [
              [
                "grel:valueParameter",
                "$(id)"
              ],
              [
                "grel:valueParameter2",
                1
              ]
            ]
          },
          "po": [
            [
              "a",
              "http://example.com/Test"
            ]
          ]
        }
      }
    };

    const expectedOutput = {
      "prefixes": {
        "idlab-fn": "https://w3id.org/imec/idlab/function#",
        "grel": "http://users.ugent.be/~bjdmeest/function/grel.ttl#"
      },
      "mappings": {
        "test": {
          "subjects": [
            {
              "function": "https://w3id.org/imec/idlab/function#trueCondition",
              "parameters": [
                {
                  "parameter": "https://w3id.org/imec/idlab/function#strBoolean",
                  "value": {
                    "function": "idlab-fn:equal",
                    "parameters": [
                      {
                        "parameter": "grel:valueParameter",
                        "value": "$(id)",
                        "type": "literal",
                        "from": "subject"
                      },
                      {
                        "parameter": "grel:valueParameter2",
                        "value": "1",
                        "type": "literal",
                        "from": "subject"
                      }
                    ]
                  },
                  "from": "function"
                },
                {
                  "parameter": "https://w3id.org/imec/idlab/function#str",
                  "value": null,
                  "type": "blank",
                  "from": "subject"
                }
              ],
              "type": "blank"
            }
          ],
          "predicateobjects": [
            {
              "predicates": [
                "a"
              ],
              "objects": [
                {
                  "value": "http://example.com/Test",
                  "type": "iri"
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

  describe('authors', () => {
    it('array with objects', () => {
      const input = {
        "prefixes": {
          "ex": "http://example.com/"
        },
        "authors": [
          {
            "name": "John Doe",
            "email": "john@doe.com"
          },
          {
            "name": "Jane Doe",
            "website": "https://janedoe.com"
          }
        ],
        "mappings": {
          "person": {
            "sources": [
              [
                "data.json~jsonpath",
                "$.persons[*]"
              ]
            ],
            "s": "http://example.com/$(firstname)",
            "po": [
              [
                "a",
                "foaf:Person"
              ],
              [
                "ex:name",
                "$(firstname)"
              ]
            ]
          }
        }
      };

      const expectedOutput = {
        "prefixes": {
          "ex": "http://example.com/"
        },
        "authors": [
          {
            "name": "John Doe",
            "email": "john@doe.com"
          },
          {
            "name": "Jane Doe",
            "website": "https://janedoe.com"
          }
        ],
        "mappings": {
          "person": {
            "sources": [
              {
                "access": "data.json",
                "referenceFormulation": "jsonpath",
                "iterator": "$.persons[*]"
              }
            ],
            "subjects": [
              "http://example.com/$(firstname)"
            ],
            "predicateobjects": [
              {
                "predicates": [
                  "a"
                ],
                "objects": [
                  {
                    "value": "foaf:Person",
                    "type": "iri"
                  }
                ]
              },
              {
                "predicates": [
                  "ex:name"
                ],
                "objects": [
                  {
                    "value": "$(firstname)",
                    "type": "literal"
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

    it('array with strings', () => {
      const input = {
        "prefixes": {
          "ex": "http://example.com/"
        },
        "authors": [
          "John Doe <john@doe.com>",
          "Jane Doe (https://janedoe.com)"
        ],
        "mappings": {
          "person": {
            "sources": [
              [
                "data.json~jsonpath",
                "$.persons[*]"
              ]
            ],
            "s": "http://example.com/$(firstname)",
            "po": [
              [
                "a",
                "foaf:Person"
              ],
              [
                "ex:name",
                "$(firstname)"
              ]
            ]
          }
        }
      };

      const expectedOutput = {
        "prefixes": {
          "ex": "http://example.com/"
        },
        "authors": [
          {
            "name": "John Doe",
            "email": "john@doe.com"
          },
          {
            "name": "Jane Doe",
            "website": "https://janedoe.com"
          }
        ],
        "mappings": {
          "person": {
            "sources": [
              {
                "access": "data.json",
                "referenceFormulation": "jsonpath",
                "iterator": "$.persons[*]"
              }
            ],
            "subjects": [
              "http://example.com/$(firstname)"
            ],
            "predicateobjects": [
              {
                "predicates": [
                  "a"
                ],
                "objects": [
                  {
                    "value": "foaf:Person",
                    "type": "iri"
                  }
                ]
              },
              {
                "predicates": [
                  "ex:name"
                ],
                "objects": [
                  {
                    "value": "$(firstname)",
                    "type": "literal"
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

    it('array with Web IDs', () => {
      const input = {
        "prefixes": {
          "ex": "http://example.com/"
        },
        "authors": [
          "http://johndoe.com/#me",
          "http://janedoe.com/#me"
        ],
        "mappings": {
          "person": {
            "sources": [
              [
                "data.json~jsonpath",
                "$.persons[*]"
              ]
            ],
            "s": "http://example.com/$(firstname)",
            "po": [
              [
                "a",
                "foaf:Person"
              ],
              [
                "ex:name",
                "$(firstname)"
              ]
            ]
          }
        }
      };

      const expectedOutput = {
        "prefixes": {
          "ex": "http://example.com/"
        },
        "authors": [
          {
            "webid": "http://johndoe.com/#me"
          },
          {
            "webid": "http://janedoe.com/#me"
          }
        ],
        "mappings": {
          "person": {
            "sources": [
              {
                "access": "data.json",
                "referenceFormulation": "jsonpath",
                "iterator": "$.persons[*]"
              }
            ],
            "subjects": [
              "http://example.com/$(firstname)"
            ],
            "predicateobjects": [
              {
                "predicates": [
                  "a"
                ],
                "objects": [
                  {
                    "value": "foaf:Person",
                    "type": "iri"
                  }
                ]
              },
              {
                "predicates": [
                  "ex:name"
                ],
                "objects": [
                  {
                    "value": "$(firstname)",
                    "type": "literal"
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

    it('single string', () => {
      const input = {
        "prefixes": {
          "ex": "http://example.com/"
        },
        "authors": "John Doe <john@doe.com>",
        "mappings": {
          "person": {
            "sources": [
              [
                "data.json~jsonpath",
                "$.persons[*]"
              ]
            ],
            "s": "http://example.com/$(firstname)",
            "po": [
              [
                "a",
                "foaf:Person"
              ],
              [
                "ex:name",
                "$(firstname)"
              ]
            ]
          }
        }
      };

      const expectedOutput = {
        "prefixes": {
          "ex": "http://example.com/"
        },
        "authors": [
          {
            "name": "John Doe",
            "email": "john@doe.com"
          }
        ],
        "mappings": {
          "person": {
            "sources": [
              {
                "access": "data.json",
                "referenceFormulation": "jsonpath",
                "iterator": "$.persons[*]"
              }
            ],
            "subjects": [
              "http://example.com/$(firstname)"
            ],
            "predicateobjects": [
              {
                "predicates": [
                  "a"
                ],
                "objects": [
                  {
                    "value": "foaf:Person",
                    "type": "iri"
                  }
                ]
              },
              {
                "predicates": [
                  "ex:name"
                ],
                "objects": [
                  {
                    "value": "$(firstname)",
                    "type": "literal"
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
  });

  describe('changeDetection', () => {

    describe('mappingRemove', () => {

      it('remove single string sources', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: "sources",
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove unknown key', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: "blabla",
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [{
                access: "base.json",
                referenceFormulation: "jsonpath",
                iterator: "$.*"
              }],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove `contentType` key from sources', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [{
                access: "base.json",
                referenceFormulation: "jsonpath",
                iterator: "$.*",
                contentType: "application/json"
              }],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: {
                    sources: "contentType"
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [{
                access: "base.json",
                referenceFormulation: "jsonpath",
                iterator: "$.*"
              }],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove `iterator` key from inline and referred sources', () => {
        const input = {
          prefixes: {ex: "http://example.com/"},
          sources: {
            'source-create': {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            'sensor-reading': {
              sources: [
                {
                  access: "test.json",
                  referenceFormulation: "jsonpath",
                  iterator: "$.*"
                },
                "source-create"
              ],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: {
                    sources: "iterator"
                  },
                }
              },
              predicateobjects: [{
                  predicates: ["ex:pressure"],
                  objects: [{value: "$(pressure)", type: "literal"}]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          prefixes: {
            ex: "http://example.com/"
          },
          sources: {
            "source-create": {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            "sensor-reading-create": {
              sources: [{
                  access: "test.json",
                  referenceFormulation: "jsonpath"
                },
                {
                  access: "base.json",
                  referenceFormulation: "jsonpath"
                }],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{value: "$(pressure)", type: "literal"}]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }
              ]
            }
          }
        }

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove source reference from mapping', () => {
        const input = {
          prefixes: {ex: "http://example.com/"},
          sources: {
            'source-create': {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            'sensor-reading': {
              sources: [
                {
                  access: "test.json",
                  referenceFormulation: "jsonpath",
                  iterator: "$.*"
                },
                "source-create"
              ],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: {
                    sources: "source-create"
                  },
                }
              },
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
              {
                predicates: ["ex:temperature"],
                objects: [{value: "$(temperature)", type: "literal"}]
              }]
            }
          }
        }

        const expectedOutput = {
          prefixes: {
            ex: "http://example.com/"
          },
          sources: {
            "source-create": {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            "sensor-reading-create": {
              sources: [{
                  access: "test.json",
                  referenceFormulation: "jsonpath",
                  iterator: "$.*"
                }],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [{
                  predicates: ["ex:pressure"],
                  objects: [{value: "$(pressure)", type: "literal"}]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove specific named graph from mapping', () => {
        const input = {
          prefixes: {ex: "http://example.com/"},
          sources: {
            'source-create': {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            'sensor-reading': {
              graphs: ["ex:graphOne", "ex:graphTwo"],
              sources: "source-create",
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: {
                    graphs: "ex:graphOne"
                  },
                }
              },
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const expectedOutput = {
          prefixes: {
            ex: "http://example.com/"
          },
          sources: {
            "source-create": {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            "sensor-reading-create": {
              graphs: ["ex:graphTwo"],
              sources: ["source-create"],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove key with null value from mapping (which is same as string value)', () => {
        const input = {
          prefixes: {ex: "http://example.com/"},
          sources: {
            'source-create': {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            'sensor-reading': {
              sources: "source-create",
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,

                  // same as: mappingRemove: "sources"
                  mappingRemove: {
                    sources: null
                  },
                }
              },
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const expectedOutput = {
          prefixes: {
            ex: "http://example.com/"
          },
          sources: {
            "source-create": {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            "sensor-reading-create": {
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove `iterator` key from inline and referred sources, AND remove all graphs', () => {
        const input = {
          prefixes: {ex: "http://example.com/"},
          sources: {
            'source-create': {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            'sensor-reading': {
              graphs: ["ex:graphOne", "ex:graphTwo"],
              sources: [
                {
                  access: "test.json",
                  referenceFormulation: "jsonpath",
                  iterator: "$.*"
                },
                "source-create"
              ],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: {
                    sources: "iterator",
                    graphs: null
                  },
                }
              },
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          prefixes: {
            ex: "http://example.com/"
          },
          sources: {
            "source-create": {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            "sensor-reading-create": {
              sources: [{
                access: "test.json",
                referenceFormulation: "jsonpath"
              },
                {
                  access: "base.json",
                  referenceFormulation: "jsonpath"
                }],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{value: "$(pressure)", type: "literal"}]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }
              ]
            }
          }
        }

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove single string predicateobjects', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: "predicateobjects"
                }
              },
              po: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [{
                access: "base.json",
                referenceFormulation: "jsonpath",
                iterator: "$.*"
              }],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove single string po', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: "po"
                }
              },
              po: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [{
                access: "base.json",
                referenceFormulation: "jsonpath",
                iterator: "$.*"
              }],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove a single predicate-object mapping', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: {
                    po: [["ex:pressure", "$(pressure)"]]
                  }
                }
              },
              po: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [{
                access: "base.json",
                referenceFormulation: "jsonpath",
                iterator: "$.*"
              }],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove a predicate only in po map.', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: {
                    po: [["ex:pressure", "$(pressure)"]]
                  }
                }
              },
              po: [
                {
                  predicates: ["ex:pressure", "ex:ample"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [{
                access: "base.json",
                referenceFormulation: "jsonpath",
                iterator: "$.*"
              }],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:ample"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove specific subject mapping', () => {
        const input = {
          prefixes: {ex: "http://example.com/"},
          sources: {
            'source-create': {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            'sensor-reading': {
              sources: "source-create",
              subjects: ["ex:sensor/$(sensor)", "ex:sensor/$(id)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingRemove: {
                    subjects: "ex:sensor/$(sensor)"
                  },
                }
              },
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const expectedOutput = {
          prefixes: {
            ex: "http://example.com/"
          },
          sources: {
            "source-create": {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            "sensor-reading-create": {
              sources: ["source-create"],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(id)",
                  }
                ]
              }],
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove all targets from all subjects', () => {
        const input = {
          prefixes: {ex: "http://example.com/"},
          sources: {
            'source-create': {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            'sensor-reading': {
              sources: "source-create",
              subjects: [
                {
                  value: "ex:sensor/$(sensor)",
                  targets: ["data/dump.ttl.gz~void", "turtle", "gzip"]
                },
                "ex:sensor/$(id)"
              ],
              changeDetection: {
                create: {
                  explicit: true,
                  // rmove all targets from all subjects:
                  mappingRemove: {
                    subjects: {
                      targets: null
                    }
                  },
                }
              },
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const expectedOutput = {
          prefixes: {
            ex: "http://example.com/"
          },
          sources: {
            "source-create": {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            "sensor-reading-create": {
              sources: ["source-create"],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              },{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(id)",
                  }
                ]
              }
              ],
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('remove all targets from all subjects and remove a specific subject', () => {
        const input = {
          prefixes: {ex: "http://example.com/"},
          sources: {
            'source-create': {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            'sensor-reading': {
              sources: "source-create",
              subjects: [
                {
                  value: "ex:sensor/$(sensor)",
                  targets: ["data/dump.ttl.gz~void", "turtle", "gzip"]
                },
                "ex:sensor/$(id)"
              ],
              changeDetection: {
                create: {
                  explicit: true,
                  // rmove all targets from all subjects:
                  mappingRemove: {
                    subjects: [
                      "ex:sensor/$(id)",
                      {
                        targets: null
                      }
                    ]
                  },
                }
              },
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const expectedOutput = {
          prefixes: {
            ex: "http://example.com/"
          },
          sources: {
            "source-create": {
              access: "base.json",
              referenceFormulation: "jsonpath",
              iterator: "$.addition[*]"
            }
          },
          mappings: {
            "sensor-reading-create": {
              sources: ["source-create"],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [{
                predicates: ["ex:pressure"],
                objects: [{value: "$(pressure)", type: "literal"}]
              },
                {
                  predicates: ["ex:temperature"],
                  objects: [{value: "$(temperature)", type: "literal"}]
                }]
            }
          }
        }

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

    });

    describe('mappingAdd', () => {

      it('add single line source', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    sources: [["data/person.json~jsonpath", "$"]]
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath"
                },
                {
                  access: "data/person.json",
                  iterator: "$",
                  referenceFormulation: "jsonpath"
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a referred source as a single string', () => {
        const input = {
          sources: {
            remoteSource: ["data/sensor.json~jsonpath", "$"]
          },
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    sources: "remoteSource"
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          sources: {
            remoteSource: {
              access: "data/sensor.json",
              iterator: "$",
              referenceFormulation: "jsonpath"
            }
          },
          mappings: {
            'sensors-create': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath"
                },
                {
                  access: "data/sensor.json",
                  iterator: "$",
                  referenceFormulation: "jsonpath"
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a `compression` key to each source', () => {
        const input = {
          sources: {
            remoteSource: ["data/sensor.json~jsonpath", "$"]
          },
          mappings: {
            sensors: {
              sources: [{
                access: "base.json",
                referenceFormulation: "jsonpath",
                iterator: "$.*"
              },
              "remoteSource"],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    sources: [
                      {compression: "gzip"}
                    ]
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          sources: {
            remoteSource: {
              access: "data/sensor.json",
              iterator: "$",
              referenceFormulation: "jsonpath"
            }
          },
          mappings: {
            'sensors-create': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                  compression: "gzip"
                },
                {
                  access: "data/sensor.json",
                  iterator: "$",
                  referenceFormulation: "jsonpath",
                  compression: "gzip"
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a source AND add a `compression` key to each source', () => {
        const input = {
          sources: {
            remoteSource: ["data/sensor.json~jsonpath", "$"]
          },
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    sources: [
                      {compression: "gzip"},
                      "remoteSource"
                    ]
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          sources: {
            remoteSource: {
              access: "data/sensor.json",
              iterator: "$",
              referenceFormulation: "jsonpath"
            }
          },
          mappings: {
            'sensors-create': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                  compression: "gzip"
                },
                {
                  access: "data/sensor.json",
                  iterator: "$",
                  referenceFormulation: "jsonpath",
                  compression: "gzip"
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a single string subject', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    subject: "ex:person/$(name)"
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }, {
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:person/$(name)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a function subject', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    subject: [{
                      function: "ex:toLowerCase(ex:input = $(firstname))"
                    }]
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              },{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: {
                      function: "ex:toLowerCase",
                      parameters: [
                        {
                          from: "subject",
                          parameter: "ex:input",
                          type: "literal",
                          value: "$(firstname)"
                        }
                      ],
                      "type": "iri"
                    },
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a target to all subjects', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)", "ex:person/$(name)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    subjects: [{
                      target: [
                          {
                            access: 'data/dump.ttl.gz',
                            serialization: 'turtle',
                            compression: 'gzip'
                          }
                      ]
                    }]
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ],
                targets: [
                  {
                    access: "data/dump.ttl.gz",
                    compression: "gzip",
                    serialization: "turtle"
                  }
                ]
              }, {
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:person/$(name)",
                  }
                ],
                targets: [
                  {
                    access: "data/dump.ttl.gz",
                    compression: "gzip",
                    serialization: "turtle"
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a graph to a mapping', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    graph: "ex:myGraph"
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              graphs: ["ex:myGraph"],
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a graph to a mapping with an existing graph', () => {
        const input = {
          mappings: {
            sensors: {
              graphs: "ex:existingGraph",
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    graph: "ex:myGraph"
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              graphs: ["ex:existingGraph", "ex:myGraph"],
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a function graph to a mapping', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    graph: [{
                      function: "ex:randomName"
                    }]
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              graphs: [{
                "function": "ex:randomName"
              }],
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a completely new PO mapping', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    po: [["ex:hasID", "$(ID)"]]
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:hasID"],
                  objects: [{
                    value: "$(ID)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);
      });

      it('add a PO mapping with an existing predicate', () => {
        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: true,
                  mappingAdd: {
                    po: [["ex:temperature", "$(tempFahrenheit)"]]
                  }
                }
              },
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#explicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(temperature)",
                    type: "literal"
                  }]
                },
                {
                  predicates: ["ex:temperature"],
                  objects: [{
                    value: "$(tempFahrenheit)",
                    type: "literal"
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


    describe('subject function expansion', () => {

      it('implicit create', () => {

        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                create: {
                  explicit: false,
                }
              },
              predicateobjects: [["ex:pressure", "$(pressure)"]]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-create': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#implicitCreate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);

      });

      it('implicit update, single watched property', () => {

        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                update: {
                  explicit: false,
                  watchedProperties: "$(temperature)"
                }
              },
              predicateobjects: [["ex:pressure", "$(pressure)"]]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-update': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#implicitUpdate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  },
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#watchedProperty",
                    type: "literal",
                    value: "temperature=$(temperature)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);

      });

      it('implicit update, multiple watched properties', () => {

        const input = {
          mappings: {
            sensors: {
              sources: [['base.json~jsonpath', '$.*']],
              subjects: ["ex:sensor/$(sensor)"],
              changeDetection: {
                update: {
                  explicit: false,
                  watchedProperties: ["$(temperature)", "$(pressure)", "$(whatever)"]
                }
              },
              predicateobjects: [["ex:pressure", "$(pressure)"]]
            }
          }
        }

        const expectedOutput = {
          mappings: {
            'sensors-update': {
              sources: [
                {
                  access: "base.json",
                  iterator: "$.*",
                  referenceFormulation: "jsonpath",
                }
              ],
              subjects: [{
                function: "https://w3id.org/imec/idlab/function#implicitUpdate",
                parameters: [
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#iri",
                    type: "iri",
                    value: "ex:sensor/$(sensor)",
                  },
                  {
                    from: "subject",
                    parameter: "https://w3id.org/imec/idlab/function#watchedProperty",
                    type: "literal",
                    value: "temperature=$(temperature)&pressure=$(pressure)&whatever=$(whatever)",
                  }
                ]
              }],
              predicateobjects: [
                {
                  predicates: ["ex:pressure"],
                  objects: [{
                    value: "$(pressure)",
                    type: "literal"
                  }]
                }
              ]
            }
          }
        };

        const output = expand(input);
        assert.deepStrictEqual(output, expectedOutput);

      });

      // TODO
      // it('explicit delete and implicit update', () => {
      //
      //   const input = {
      //     mappings: {
      //       sensors: {
      //         sources: [['base.json~jsonpath', '$.*']],
      //         subjects: ["ex:sensor/$(sensor)"],
      //         changeDetection: {
      //           update: {
      //             explicit: false,
      //             watchedProperties: "$(temperature)"
      //           },
      //           delete: {
      //             explicit: true,
      //             sources: [['base.json~jsonpath', '$.delete.*']]
      //           }
      //         },
      //         predicateobjects: [["ex:pressure", "$(pressure)"]]
      //       }
      //     }
      //   }
      //
      //   const expectedOutput = {
      //     mappings: {
      //       'sensors-update': {
      //         sources: [
      //           {
      //             access: "base.json",
      //             iterator: "$.*",
      //             referenceFormulation: "jsonpath",
      //           }
      //         ],
      //         subjects: [{
      //           function: "https://w3id.org/imec/idlab/function#implicitUpdate",
      //           parameters: [
      //             {
      //               from: "subject",
      //               parameter: "https://w3id.org/imec/idlab/function#iri",
      //               type: "iri",
      //               value: "ex:sensor/$(sensor)",
      //             },
      //             {
      //               from: "subject",
      //               parameter: "https://w3id.org/imec/idlab/function#watchedProperty",
      //               type: "literal",
      //               value: "temperature=$(temperature)",
      //             }
      //           ]
      //         }],
      //         predicateobjects: [
      //           {
      //             predicates: ["ex:pressure"],
      //             objects: [{
      //               value: "$(pressure)",
      //               type: "literal"
      //             }]
      //           }
      //         ]
      //       },
      //       'sensors-delete': {
      //         sources: [
      //           {
      //             access: "base.json",
      //             iterator: "$.delete.*",
      //             referenceFormulation: "jsonpath",
      //           }
      //         ],
      //         subjects: [{
      //           function: "https://w3id.org/imec/idlab/function#explicitDelete",
      //           parameters: [
      //             {
      //               from: "subject",
      //               parameter: "https://w3id.org/imec/idlab/function#iri",
      //               type: "iri",
      //               value: "ex:sensor/$(sensor)",
      //             }
      //           ]
      //         }]
      //       }
      //     }
      //   };
      //
      //   const output = expand(input);
      //   assert.deepStrictEqual(output, expectedOutput);
      //
      // });

    });
  });
});
