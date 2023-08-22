/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const namespaces = require('./namespaces').asMap();
const AbstractGenerator = require('./abstract-generator.js');
const formulations = require('./formulations.json');
const { DataFactory } = require('n3');
const {namedNode, literal, quad} = DataFactory;
const jdbcDrivers = require('./jdbc-drivers');
const Logger = require('./logger');

class RMLGenerator extends AbstractGenerator {

  constructor(options = null) {
    super(options);
  }

  convertExpandedJSON(yarrrml) {
    super.convertExpandedJSON(yarrrml);

    if (yarrrml.base) {
      this.baseIRI = yarrrml.base;
    }

    const sourcesIRIMap = {};

    if (yarrrml.sources) {
      Object.keys(yarrrml.sources).forEach(sourceName => {
        sourcesIRIMap[sourceName] = this.generateSource(yarrrml.sources[sourceName], undefined, sourceName);
      });
    }

    const targetsIRIMap = {};

    if (yarrrml.targets) {
      Object.keys(yarrrml.targets).forEach(targetName => {
        targetsIRIMap[targetName] = this.generateTarget(yarrrml.targets[targetName], targetName);
      });
    }

    if (!yarrrml.mappings) {
      return this.quads;
    }

    Object.keys(yarrrml.mappings).forEach(mappingName => {
      const mapping = yarrrml.mappings[mappingName];

      /* Collect all targets inline in terms */
      let targets = [];
      if(mapping.subjects) {

        // Subject inline targets
        mapping.subjects.forEach((s) => {
          if (s.targets) {
            for (let i = 0; i < s.targets.length; i++) {
              if (typeof s.targets[i] === 'string') {
                continue;
              }
              let targetName = this._generateTargetId(s.targets[i])
              targetsIRIMap[targetName] = this.generateTarget(s.targets[i], targetName);
              s.targets[i] = targetName
            }
          }
        });
      }

      if(mapping.predicateobjects) {
        mapping.predicateobjects.forEach((po) => {
          let p = po.predicates;
          let o = po.objects;

          if (Array.isArray(po.predicates)) {

            // Predicate inline targets
            po.predicates.forEach((p) => {
              if (typeof p === 'object') {
                for (let i = 0; i < p.targets.length; i++) {
                  if (typeof p.targets[i] === 'string') {
                    continue;
                  }
                  let targetName = this._generateTargetId(p.targets[i])
                  targetsIRIMap[targetName] = this.generateTarget(p.targets[i], targetName);
                  p.targets[i] = targetName
                }
              }
            });

            // Object inline targets
            po.objects.forEach((o) => {
              if (typeof o === 'object' && o.targets) {
                for (let i = 0; i < o.targets.length; i++) {
                  if (typeof o.targets[i] === 'string') {
                    continue;
                  }
                  let targetName = this._generateTargetId(o.targets[i])
                  targetsIRIMap[targetName] = this.generateTarget(o.targets[i], targetName);
                  o.targets[i] = targetName
                }
              }

              // Language inline targets
              if (o.language && o.language.targets) {
                for (let i = 0; i < o.language.targets.length; i++) {
                  if (typeof o.language.targets[i] === 'string') {
                    continue;
                  }
                  let targetName = this._generateTargetId(o.language.targets[i])
                  targetsIRIMap[targetName] = this.generateTarget(o.language.targets[i], targetName);
                  o.language.targets[i] = targetName
                }
              }
            });
          }
        });
      }

      if (mapping.graphs) {
        // Graph maps inline targets
        mapping.graphs.forEach((g) => {
          if (g.targets) {
            for (let i = 0; i < g.targets.length; i++) {
              if (typeof g.targets[i] === 'string') {
                continue;
              }
              let targetName = this._generateTargetId(g.targets[i])
              targetsIRIMap[targetName] = this.generateTarget(g.targets[i], targetName);
              g.targets[i] = targetName
            }
          }
        });
      }

      if (mapping.sources) {
        mapping.sources = [].concat(mapping.sources);
        mapping.sources.forEach(source => {
          const tmSubject = namedNode(this.baseIRI + this.getUniqueID('map_' + mappingName));
          this.addMappingIRI(mappingName, tmSubject);

          let sourceSubject;

          if (typeof source === 'string') {
            sourceSubject = sourcesIRIMap[source];
            if(!sourceSubject) {
              Logger.error(`No source definition found for the source tag "${source}"`);
            }

            this.quads.push(quad(
              tmSubject,
              namedNode(namespaces.rml + 'logicalSource'),
              sourceSubject
            ));
          } else {
            sourceSubject = this.generateSource(source, tmSubject);
          }

          this.generateMapping(tmSubject, mapping, mappingName, sourceSubject, targetsIRIMap);
        });
      } else {
        const tmSubject = namedNode(this.baseIRI + mappingName);
        this.generateMapping(tmSubject, mapping, mappingName, undefined, targetsIRIMap);
      }
    });

    this.generateAllReferencingObjectMap();
    return this.quads;
  }

  _generateTargetId(target) {
    if (typeof target === 'object') {
      let id = ''
      Object.keys(target).forEach(key => {
        if (key === 'ldes') {
          id += 'ldes';
        } else {
          id += target[key];
        }
        id += '-'
      });
      id = id.slice(0, -1);  // remove last '-'
      return id;
    } else {
      return target;
    }
  }

  generateMapping(tmSubject, mapping, mappingName, sourceSubject, targetsIRIMap) {
    mapping = JSON.parse(JSON.stringify(mapping));
    this.quads.push(quad(
      tmSubject,
      namedNode(namespaces.rdf + 'type'),
      namedNode(namespaces.rr + 'TriplesMap')
    ));

    super.generateMapping(tmSubject, mapping, mappingName, sourceSubject, targetsIRIMap);
  }

  generateSource(source, tmSubject, sourceName) {
    const sSubject = namedNode(this.baseIRI + this.getUniqueID('source'));

    if (tmSubject) {
      this.quads.push(quad(
        tmSubject,
        namedNode(namespaces.rml + 'logicalSource'),
        sSubject
      ));
    }

    this.quads.push(quad(
      sSubject,
      namedNode(namespaces.rdf + 'type'),
      namedNode(namespaces.rml + 'LogicalSource')
    ));

    if (sourceName) {
      this.quads.push(quad(
        sSubject,
        namedNode(namespaces.rdfs + 'label'),
        literal(sourceName)
      ));
    }

    if (!source.type) {
      if (source.referenceFormulation === 'csv' && source.delimiter !== undefined && source.delimiter !== ',') {
       // We need CSVW.
        this.prefixes['csvw'] = namespaces.csvw;
        const csvwSubject = namedNode(this.baseIRI + this.getUniqueID('csvw'));
        const dialectSubject = namedNode(this.baseIRI + this.getUniqueID('csvw-dialect'));

        this.quads.push(quad(
          sSubject,
          namedNode(namespaces.rml + 'source'),
          csvwSubject
        ));

        this.quads.push(quad(
          csvwSubject,
          namedNode(namespaces.rdf + 'type'),
          namedNode(namespaces.csvw + 'Table')
        ));

        this.quads.push(quad(
          csvwSubject,
          namedNode(namespaces.csvw + 'url'),
          literal(source.access)
        ));

        this.quads.push(quad(
          csvwSubject,
          namedNode(namespaces.csvw + 'dialect'),
          dialectSubject
        ));

        this.quads.push(quad(
          dialectSubject,
          namedNode(namespaces.rdf + 'type'),
          namedNode(namespaces.csvw + 'Dialect')
        ));

        this.quads.push(quad(
          dialectSubject,
          namedNode(namespaces.csvw + 'delimiter'),
          literal(source.delimiter)
        ));
      } else {
        this.quads.push(quad(
          sSubject,
          namedNode(namespaces.rml + 'source'),
          literal(source.access)
        ));
      }

      if (source.iterator) {
        this.quads.push(quad(
          sSubject,
          namedNode(namespaces.rml + 'iterator'),
          literal(source.iterator)
        ));
      }
    } else {
      /* Web of Things */
      if (source.type == 'wot') {
        const wotSubject = namedNode(this.baseIRI + this.getUniqueID('wot'));
        const formSubject = namedNode(this.baseIRI + this.getUniqueID('form'));
        const propertyAffordanceSubject = namedNode(this.baseIRI + this.getUniqueID('propertyAffordance'));
        const securitySubject = namedNode(this.baseIRI + this.getUniqueID('security'));

        this.prefixes['td'] = namespaces.td
        this.prefixes['wotsec'] = namespaces.wotsec
        this.prefixes['hctl'] = namespaces.hctl
        this.prefixes['idsa'] = namespaces.idsa

        this.quads.push(quad(
          sSubject,
          namedNode(namespaces.rml + 'source'),
          propertyAffordanceSubject
        ));

        /* Build td:Thing */
        this.quads.push(quad(
          wotSubject,
          namedNode(namespaces.rdf + 'type'),
          namedNode(namespaces.td + 'Thing')
        ));

        /* Build td:PropertyAffordance */
        this.quads.push(quad(
          propertyAffordanceSubject,
          namedNode(namespaces.rdf + 'type'),
          namedNode(namespaces.td + 'PropertyAffordance')
        ));

        this.quads.push(quad(
          propertyAffordanceSubject,
          namedNode(namespaces.td + 'hasForm'),
          formSubject
        ));

        this.quads.push(quad(
          formSubject,
          namedNode(namespaces.rdf + 'type'),
          namedNode(namespaces.td + 'Form')
        ));

        this.quads.push(quad(
          formSubject,
          namedNode(namespaces.hctl + 'hasTarget'),
          literal(source.access)
        ));

        this.quads.push(quad(
          formSubject,
          namedNode(namespaces.hctl + 'forContentType'),
          literal(source.contentType)
        ));

        let operationType = null;
        switch(source.operationType) {
          case 'read':
            operationType = namedNode(namespaces.td + 'readproperty');
            break

          case 'write':
          default:
            break
        }

        this.quads.push(quad(
          formSubject,
          namedNode(namespaces.hctl + 'hasOperationType'),
          operationType
        ));

        this.quads.push(quad(
          wotSubject,
          namedNode(namespaces.td + 'hasPropertyAffordance'),
          propertyAffordanceSubject
        ));

        // FIXME: W3C WoT Protocol Bindings

        /* Build wotsec:$SCHEMESecurityScheme */
        if (source.security) {
          if (Array.isArray(source.security)) {
            Object.keys(source.security).forEach(index => {
              let security = source.security[index]
              // FIXME: support more security schemes
              if (security.type == 'apikey') {
                this.quads.push(quad(
                  securitySubject,
                  namedNode(namespaces.rdf + 'type'),
                  namedNode(namespaces.td + 'APISecurityScheme')
                ));

                this.quads.push(quad(
                  securitySubject,
                  namedNode(namespaces.wotsec + 'in'),
                  literal(security.in)
                ));

                this.quads.push(quad(
                  securitySubject,
                  namedNode(namespaces.wotsec + 'name'),
                  literal(security.name)
                ));

                this.quads.push(quad(
                  securitySubject,
                  namedNode(namespaces.idsa + 'tokenValue'),
                  literal(security.value)
                ));
              } else if (security.type == 'none') {
                this.quads.push(quad(
                  securitySubject,
                  namedNode(namespaces.rdf + 'type'),
                  namedNode(namespaces.td + 'NoSecurityScheme')
                ));
              }
            });
          }

          this.quads.push(quad(
            wotSubject,
            namedNode(namespaces.td + 'hasSecurityConfiguration'),
            securitySubject
          ));

          if (source.iterator) {
            this.quads.push(quad(
              sSubject,
              namedNode(namespaces.rml + 'iterator'),
              literal(source.iterator)
            ));
          }
        }
      }
      /* Database */
      else {
        const databaseSubject = namedNode(this.baseIRI + this.getUniqueID('database'));

        this.quads.push(quad(
          sSubject,
          namedNode(namespaces.rml + 'source'),
          databaseSubject
        ));

        if (source.query) {
          this.quads.push(quad(
            sSubject,
            namedNode(namespaces.rml + 'query'),
            literal(source.query.replace(/\s+/g, ' ').trim())
            ));
        }

        if (source.queryFormulation) {
          let object = namedNode(formulations.query[source.queryFormulation]);
          this.quads.push(quad(
            sSubject,
            namedNode(namespaces.rr + 'sqlVersion'),
            object
          ));
        }

        this._generateDatabaseDescription(databaseSubject, source);
      }
    }

    let object = namedNode(formulations.reference[source.referenceFormulation]);

    this.quads.push(quad(
      sSubject,
      namedNode(namespaces.rml + 'referenceFormulation'),
      object
    ));

    return sSubject;
  }

    generateTarget(target, targetName) {
    const tSubject = namedNode(this.baseIRI + this.getUniqueID('target'));
    this.prefixes['rmlt'] = namespaces.rmlt;

    this.quads.push(quad(
      tSubject,
      namedNode(namespaces.rdf + 'type'),
      namedNode(namespaces.rmlt + 'LogicalTarget')
    ));

      if (targetName) {
        this.quads.push(quad(
            tSubject,
            namedNode(namespaces.rdfs + 'label'),
            literal(targetName)
        ));
      }

    /* Serialization format */
    let format = namedNode(namespaces.formats + 'N-Quads');
    this.prefixes['formats'] = namespaces.formats;

    if (target.serialization) {
      switch (target.serialization) {
        case 'jsonld':
          format = namedNode(namespaces.formats + 'JSON-LD');
          break;
        case 'n3':
          format = namedNode(namespaces.formats + 'N3');
          break;
        case 'ntriples':
          format = namedNode(namespaces.formats + 'N-Triples');
          break;
        case 'nquads':
          format = namedNode(namespaces.formats + 'N-Quads');
          break;
        case 'ldpatch':
          format = namedNode(namespaces.formats + 'LD_Patch');
          break;
        case 'microdata':
          format = namedNode(namespaces.formats + 'microdata');
          break;
        case 'owlxml':
          format = namedNode(namespaces.formats + 'OWL_XML');
          break;
        case 'owlfunctional':
          format = namedNode(namespaces.formats + 'OWL_Functional');
          break;
        case 'owlmanchester':
          format = namedNode(namespaces.formats + 'OWL_Manchester');
          break;
        case 'powder':
          format = namedNode(namespaces.formats + 'POWDER');
          break;
        case 'powder-s':
          format = namedNode(namespaces.formats + 'POWDER-S');
          break;
        case 'prov-n':
          format = namedNode(namespaces.formats + 'PROV-N');
          break;
        case 'prov-xml':
          format = namedNode(namespaces.formats + 'PROV-XML');
          break;
        case 'rdfa':
          format = namedNode(namespaces.formats + 'RDFa');
          break;
        case 'rdfjson':
          format = namedNode(namespaces.formats + 'RDF_JSON');
          break;
        case 'rdfxml':
          format = namedNode(namespaces.formats + 'RDF_XML');
          break;
        case 'rifxml':
          format = namedNode(namespaces.formats + 'RIF_XML');
          break;
        case 'sparqlxml':
          format = namedNode(namespaces.formats + 'SPARQL_Results_XML');
          break;
        case 'sparqljson':
          format = namedNode(namespaces.formats + 'SPARQL_Results_JSON');
          break;
        case 'sparqlcsv':
          format = namedNode(namespaces.formats + 'SPARQL_Results_CSV');
          break;
        case 'sparqltsv':
          format = namedNode(namespaces.formats + 'SPARQL_Results_TSV');
          break;
        case 'turtle':
          format = namedNode(namespaces.formats + 'Turtle');
          break;
        case 'trig':
          format = namedNode(namespaces.formats + 'TriG');
          break;
        default:
          format = namedNode(namespaces.formats + 'N-Quads');
          break;
      }
    }

    this.quads.push(quad(
      tSubject,
      namedNode(namespaces.rmlt + 'serialization'),
      format
    ));

    /* Optionally apply compression */
    if (target.compression) {
      /* See: http://semweb.mmlab.be/ns/rml-compression# for known algorithms */
      let algorithms = ['gzip', 'zip', 'targzip', 'tarxz'];
      this.prefixes['comp'] = namespaces.comp;

      if (algorithms.indexOf(target.compression) > -1) {
        this.quads.push(quad(
          tSubject,
          namedNode(namespaces.rmlt + 'compression'),
          namedNode(namespaces.comp + target.compression)
        ));
      }
      else {
        Logger.error(`${target.compression} is not a known compression algorithm`);
      }
    }

    /* Path to file as string */
    if (!target.type) {
      const voidSubject = namedNode(this.baseIRI + this.getUniqueID('void'));
      this.prefixes['void'] = namespaces.void;

      this.quads.push(quad(
        tSubject,
        namedNode(namespaces.rmlt + 'target'),
        voidSubject
      ));

      this.quads.push(quad(
        voidSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.void + 'Dataset')
      ));

      this.quads.push(quad(
        voidSubject,
        namedNode(namespaces.void + 'dataDump'),
        namedNode('file://' + target)
      ));

    /* SPARQL endpoint */
    } else if (target.type === 'sd') {
      const sdSubject = namedNode(this.baseIRI + this.getUniqueID('sd'));
      this.prefixes['sd'] = namespaces.sd;

      this.quads.push(quad(
        tSubject,
        namedNode(namespaces.rmlt + 'target'),
        sdSubject
      ));

      this.quads.push(quad(
        sdSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.sd + 'Service')
      ));

      this.quads.push(quad(
        sdSubject,
        namedNode(namespaces.sd + 'supportedLanguage'),
        namedNode(namespaces.sd + 'SPARQL11Update')
      ));

      if (target.access) {
        this.quads.push(quad(
          sdSubject,
          namedNode(namespaces.sd + 'endpoint'),
          namedNode(target.access)
        ));
      }
      else {
        Logger.error("SPARQL endpoint URL is required");
      }

    /* VoID dataset*/
    } else if (target.type === 'void') {
      const voidSubject = namedNode(this.baseIRI + this.getUniqueID('void'));
      this.prefixes['void'] = namespaces.void;

      this.quads.push(quad(
        tSubject,
        namedNode(namespaces.rmlt + 'target'),
        voidSubject
      ));

      this.quads.push(quad(
        voidSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.void + 'Dataset')
      ));

      if (target.access) {
        this.quads.push(quad(
          voidSubject,
          namedNode(namespaces.void + 'dataDump'),
          namedNode('file://' + target.access)
        ));
      }
      else {
        Logger.error("Path to VoID dataset is required")
      }

    /* DCAT Dataset */
    } else if (target.type === 'dcat') {
      const dcatSubject = namedNode(this.baseIRI + this.getUniqueID('dcat'));
      this.prefixes['dcat'] = namespaces.dcat;

      this.quads.push(quad(
        tSubject,
        namedNode(namespaces.rmlt + 'target'),
        dcatSubject
      ));

      this.quads.push(quad(
        dcatSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.dcat + 'Dataset')
      ));

      if (target.access) {
        this.quads.push(quad(
          dcatSubject,
          namedNode(namespaces.dcat + 'dataDump'),
          namedNode('file://' + target.access)
        ));
      }
      else {
        Logger.error("Path to VoID dataset is required")
      }

    /* Invalid target */
    } else {
      Logger.error("No (valid) target type found");
    }

    // Add LDES specific triples, if any
      if (target.ldes) {
        this.prefixes['ldes'] = namespaces.ldes;
        this.prefixes['tree'] = namespaces.tree;

        // say it's an LDES logical target
        this.quads.push(quad(
            tSubject,
            namedNode(namespaces.rdf + 'type'),
            namedNode(namespaces.ldes + 'EventStreamTarget'),
        ));

        // add the required LDES "base" iri
        this.quads.push(quad(
            tSubject,
            namedNode(namespaces.ldes + 'baseIRI'),
            namedNode(AbstractGenerator.expandPrefix(target.ldes.id)),
        ));

        // Add the SHACL shape. While, according to the LDES spec it is optional,
        // the current  RMLMapper implementation requires it.
        const shaclshape = target.ldes.shape ? AbstractGenerator.expandPrefix(target.ldes.shape) : 'http://example.org/shape.shacl';
        this.quads.push(quad(
            tSubject,
            namedNode(namespaces.tree + 'shape'),
            namedNode(shaclshape),
        ));

        // add the timestampPath
        if (target.ldes.timestampPath) {
          this.quads.push(quad(
              tSubject,
              namedNode(namespaces.ldes + 'timestampPath'),
              namedNode(AbstractGenerator.expandPrefix(target.ldes.timestampPath.predicate)),
          ));
        }

        // add the versionOfPath
        if (target.ldes.versionOfPath) {
          this.quads.push(quad(
              tSubject,
              namedNode(namespaces.ldes + 'versionOfPath'),
              namedNode(AbstractGenerator.expandPrefix(target.ldes.versionOfPath.predicate)),
          ));
        }

      }

    return tSubject;
  }

  _generateDatabaseDescription(subject, source) {
    this.quads.push(quad(
      subject,
      namedNode(namespaces.rdf + 'type'),
      namedNode(namespaces.d2rq + 'Database')
    ));

    this.quads.push(quad(
      subject,
      namedNode(namespaces.d2rq + 'jdbcDSN'),
      literal(source.access)
    ));

    this.quads.push(quad(
      subject,
      namedNode(namespaces.d2rq + 'jdbcDriver'),
      literal(jdbcDrivers[source.type])
    ));

    if (source.credentials) {
      if (source.credentials.username) {
        this.quads.push(quad(
          subject,
          namedNode(namespaces.d2rq + 'username'),
          literal(source.credentials.username)
        ));
      }

      if (source.credentials.password) {
        this.quads.push(quad(
          subject,
          namedNode(namespaces.d2rq + 'password'),
          literal(source.credentials.password)
        ));
      }
    }
  }

  generateFnSource(fnSubject, sourceSubject) {
    this.quads.push(quad(
      fnSubject,
      namedNode(namespaces.rml + 'logicalSource'),
      sourceSubject
    ));
  }

  /**
   * This method adds triples for a Language Map.
   * @param objectMap - The Object Map to which the Language Map has to be added.
   * @param value - The value for the language.
   * @return IRI - The Language Map IRI.
   */
  generateLanguageTerms(objectMap, value) {
    const languageMapSubject = namedNode(this.baseIRI + this.getUniqueID('language'));

    this.quads.push(quad(
      objectMap,
      namedNode(namespaces.rml + 'languageMap'),
      languageMapSubject
    ));

    const {predicate, object} = this.getAppropriatePredicateAndObjectForValue(value);

    this.quads.push(quad(
      languageMapSubject,
      predicate,
      object
    ));

    return languageMapSubject
  }

  generateCondition(condition, omSubject) {
    if (condition.function === 'equal'
      && !this._parametersContainsFunction(condition.parameters)
      && !this._parametersContainsConstantValues(condition.parameters)
      && !this._parametersContainsTemplates(condition.parameters)
    ) {
      super.generateCondition(condition, omSubject);
    } else {
      if (condition.function === 'equal') {
        this.convertEqualToIDLabEqual(condition);
      }

      const joinConditionSubject = namedNode(this.baseIRI + this.getUniqueID('jc'));

      this.quads.push(quad(
        omSubject,
        namedNode(namespaces.rml + 'joinCondition'),
        joinConditionSubject
      ));

      this.generateFunctionTermMap(joinConditionSubject, condition);
    }
  }

  getReferenceOnlyPredicate() {
    return namedNode(namespaces.rml + 'reference');
  }

  /**
   * This method returns true if there is at least one parameter that is a function.
   * @param parameters The list of parameters to check.
   * @returns {boolean} True if at least one parameter is found that is a function, else false.
   * @private
   */
  _parametersContainsFunction(parameters) {
    let i = 0;

    while (i < parameters.length && typeof parameters[i].value === 'string') {
      i ++
    }

    return i < parameters.length;
  }

  /**
   * This method returns true if there is at least one parameter that is a constant value.
   * @param parameters The list of parameters to check.
   * @returns {boolean} True if at least one parameter is found that is a constant value, else false.
   * @private
   */
  _parametersContainsConstantValues(parameters) {
    let i = 0;

    while (i < parameters.length &&
    (typeof parameters[i].value !== 'string' ||
      (typeof parameters[i].value === 'string'
        && this.getAppropriatePredicateAndObjectForValue(parameters[i].value).predicate.value !== namespaces.rr + 'constant'))) {
      i ++
    }

    return i < parameters.length;
  }

  /**
   * This method returns true if there is at least one parameter that is a template.
   * @param parameters The list of parameters to check.
   * @returns {boolean} True if at least one parameter is found that is a template, else false.
   * @private
   */
  _parametersContainsTemplates(parameters) {
    let i = 0;

    while (i < parameters.length &&
    (typeof parameters[i].value !== 'string' ||
      (typeof parameters[i].value === 'string'
        && this.getAppropriatePredicateAndObjectForValue(parameters[i].value).predicate.value !== namespaces.rr + 'template'))) {
      i ++
    }

    return i < parameters.length;
  }
}

module.exports = RMLGenerator;
