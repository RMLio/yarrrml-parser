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

  authsIRIMap = {};

  constructor(options = null) {
    super(options);
  }

  convertExpandedJSON(yarrrml) {
    super.convertExpandedJSON(yarrrml);

    if (yarrrml.base) {
      this.baseIRI = yarrrml.base;
    }

    if (yarrrml.authentications) {
      Object.keys(yarrrml.authentications).forEach(authName => {
        this.authsIRIMap[authName] = this.generateAuth(yarrrml.authentications[authName], authName);
      });
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

      let skipMapping = false; // Becomes true when a dynamic mapping is encountered: it already generates quads

      /* Collect all targets inline in terms */
      let targets = [];
      if(mapping.subjects) {

        // Subject inline targets
        mapping.subjects.forEach((s) => {
          if (s.targets) {
            if (s.thisMappingVar) {
              this.generateTargetTriplesMap(s.targets[0], s.value, s.thisMappingVar, mappingName, sourcesIRIMap);
              skipMapping = true; // don't do the rest of the mapping (skip this iteration in forEach loop
            } else {
              for (let i = 0; i < s.targets.length; i++) {
                if (typeof s.targets[i] === 'string') {
                  continue;
                }
                let targetName = this._generateTargetId(s.targets[i])
                targetsIRIMap[targetName] = this.generateTarget(s.targets[i], targetName);
                s.targets[i] = targetName
              }
            }
          }
        });
      }

      if (skipMapping) {
        return;
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

  generateAuth(authentication, authName) {
    const authSubject = namedNode(this.baseIRI + this.getUniqueID('auth'));
    this.prefixes['rmle'] = namespaces.rmle;

    // determine type (class) of authentication.
    // Only supported type is cssclientcredentials at the moment.
    if (authentication.type === 'cssclientcredentials') {
      this.quads.push(quad(
          authSubject,
          namedNode(namespaces.rdf + 'type'),
          namedNode(namespaces.rmle + 'CssClientCredentialsAuthentication')
      ));
    } else {
      Logger.error("Unsupported authentication type " + authentication.type
          + " for " + authName + ". Only 'cssclientcredentials' is supported.");
    }

    // email
    if (authentication.email) {
      this.quads.push(quad(
          authSubject,
          namedNode(namespaces.rmle + 'authEmail'),
          literal(authentication.email)
      ));
    } else {
      Logger.error("'email' required for authentication " + authName);
    }

    // passwd
    if (authentication.password ) {
      this.quads.push(quad(
          authSubject,
          namedNode(namespaces.rmle + 'authPassword'),
          literal(authentication.password)
      ));
    } else {
      Logger.error("'password' required for authentication " + authName);
    }

    // oidcIssuer
    if (authentication.oidcIssuer ) {
      this.quads.push(quad(
          authSubject,
          namedNode(namespaces.rmle + 'authOidcIssuer'),
          namedNode(authentication.oidcIssuer)
      ));
    } else {
      Logger.error("'oidcIssuer' required for authentication " + authName);
    }

    // oidcIssuer
    if (authentication.webId ) {
      this.quads.push(quad(
          authSubject,
          namedNode(namespaces.rmle + 'authWebId'),
          namedNode(authentication.webId)
      ));
    } else {
      Logger.error("'webId' required for authentication " + authName);
    }
    return authSubject;
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
    let format = this._getSerializationFormat(target.serialization);
    this.prefixes['formats'] = namespaces.formats;

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
    if (!target.type || target.type === 'void') {
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

      if (target.type && target.type === 'void') {
        if (target.access) {
          this.quads.push(quad(
              voidSubject,
              namedNode(namespaces.void + 'dataDump'),
              namedNode('file://' + target.access)
          ));
        } else {
          Logger.error("Path to VoID dataset is required")
        }
      } else {
        this.quads.push(quad(
            voidSubject,
            namedNode(namespaces.void + 'dataDump'),
            namedNode('file://' + target)
        ));
      }

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

    /* HTTP request target */
    } else if (target.type === 'directhttprequest') {
      this._generateHTTPRequestAccess(target, tSubject, targetName, false, true);
    } else if (target.type === 'linkedhttprequest') {
      this._generateHTTPRequestAccess(target, tSubject, targetName, false, false);
    }

    /* Invalid target */
    else {
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
            namedNode(namespaces.rmlt + 'EventStreamTarget'),
        ));

        // add the required LDES "base" iri
        this.quads.push(quad(
            tSubject,
            namedNode(namespaces.rmlt + 'ldesBaseIRI'),
            namedNode(AbstractGenerator.expandPrefix(target.ldes.id)),
        ));

        // add the optional ldesGenerateImmutableIRI
        const generateImmutableIRI = (target.ldes.generateImmutableIRI !== null && target.ldes.generateImmutableIRI !== undefined) ? target.ldes.generateImmutableIRI : false;
        if (target.ldes.generateImmutableIRI) {
          this.quads.push(quad(
              tSubject,
              namedNode(namespaces.rmlt + 'ldesGenerateImmutableIRI'),
              literal(generateImmutableIRI, 'boolean'),
          ));
        }

        // add the ldes:EventStream object
        const eventStreamSubject = namedNode(this.baseIRI + this.getUniqueID('eventStream'));
        this.quads.push(quad(
            tSubject,
            namedNode(namespaces.rmlt + 'ldes'),
            eventStreamSubject,
        ));

        // Add the optional SHACL shape.
        if (target.ldes.shape) {
          this.quads.push(quad(
              eventStreamSubject,
              namedNode(namespaces.tree + 'shape'),
              namedNode(AbstractGenerator.expandPrefix(target.ldes.shape)),
          ));
        }

        // add the optional timestampPath
        if (target.ldes.timestampPath) {
          this.quads.push(quad(
              eventStreamSubject,
              namedNode(namespaces.ldes + 'timestampPath'),
              namedNode(AbstractGenerator.expandPrefix(target.ldes.timestampPath)),
          ));
        }

        // add the versionOfPath
        if (target.ldes.versionOfPath) {
          this.quads.push(quad(
              eventStreamSubject,
              namedNode(namespaces.ldes + 'versionOfPath'),
              namedNode(AbstractGenerator.expandPrefix(target.ldes.versionOfPath)),
          ));
        }

      }

    return tSubject;
  }

  generateTargetTriplesMap(target, logicalTargetTemplate, thisMappingVar, mappingName, sourcesIRIMap) {
    this.prefixes['rmle'] = namespaces.rmle;
    this.prefixes['rmlt'] = namespaces.rmlt;

    const tmSubject = namedNode(this.baseIRI + this.getUniqueID("map_generated_logical_target_tm"));

    this.quads.push(quad(
        tmSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.rr + 'TriplesMap')
    ));

    this.quads.push(quad(
        tmSubject,
        namedNode(namespaces.rdfs + 'label'),
        literal(mappingName)
    ));

    // add logical source
    const sourceSubject = sourcesIRIMap[target.sources];
    this.quads.push(quad(
        tmSubject,
        namedNode(namespaces.rml + 'logicalSource'),
        sourceSubject
    ));

    // write subject mapping
    const smSubject = namedNode(this.baseIRI + this.getUniqueID('s'));
    this.quads.push(quad(
        tmSubject,
        namedNode(namespaces.rr + 'subjectMap'),
        smSubject
    ));
    this.quads.push(quad(
        smSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.rr + 'SubjectMap')
    ));

    // add subject template
    const {predicate, object} = this.getAppropriatePredicateAndObjectForValue(logicalTargetTemplate);
    this.quads.push(quad(
        smSubject,
        predicate,
        object
    ));

    // say that it's a logical target
    this.quads.push(quad(
        smSubject,
        namedNode(namespaces.rr + 'class'),
        namedNode(namespaces.rmlt + 'LogicalTarget')
    ));

    // add the ThisMapping (extension to indicate generated logical targets)
    this.quads.push(quad(
        smSubject,
        namedNode(namespaces.rml + 'logicalTarget'),
        namedNode(namespaces.rmle + 'ThisMapping')
    ));

    // Add the reference to the target (template)
    //const targetTemplate = 'generated_t' + logicalTargetTemplate.slice(12);
    const targetTemplate = 'generated_t' + target.generated_dynamic_target_key.slice(12);
    this._generatePOMap(tmSubject, namespaces.rmlt + "target", {value: targetTemplate, type: "iri"});

    // Add serialization format
    let format = this._getSerializationFormat(target.serialization);
    this.prefixes['formats'] = namespaces.formats;

    this._generatePOMap(tmSubject, namespaces.rmlt + "serialization", {value: format.id, type: "iri"});

    // Optionally apply compression
    if (target.compression) {
      /* See: http://semweb.mmlab.be/ns/rml-compression# for known algorithms */
      let algorithms = ['gzip', 'zip', 'targzip', 'tarxz'];
      this.prefixes['comp'] = namespaces.comp;

      if (algorithms.indexOf(target.compression) > -1) {
        this._generatePOMap(tmSubject, namespaces.rmlt + "compression", target.compression);
      } else {
        Logger.error(`${target.compression} is not a known compression algorithm`);
      }
    }

    // Add the target map
    //const tMappingName =
    const tSubject = namedNode(this.baseIRI + this.getUniqueID("map_generated_target_tm"));

    this.quads.push(quad(
        tSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.rr + 'TriplesMap')
    ));

    this.quads.push(quad(
        tSubject,
        namedNode(namespaces.rdfs + 'label'),
        literal(mappingName)
    ));

    // add logical source
    this.quads.push(quad(
        tSubject,
        namedNode(namespaces.rml + 'logicalSource'),
        sourceSubject
    ));

    // write subject mapping
    const sSubject = namedNode(this.baseIRI + this.getUniqueID('s'));
    this.quads.push(quad(
        tSubject,
        namedNode(namespaces.rr + 'subjectMap'),
        sSubject
    ));
    this.quads.push(quad(
        sSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.rr + 'SubjectMap')
    ));

    // add subject template
    const po = this.getAppropriatePredicateAndObjectForValue(targetTemplate);
    this.quads.push(quad(
        sSubject,
        po.predicate,
        po.object
    ));

    // say that it's a target
    this.quads.push(quad(
        sSubject,
        namedNode(namespaces.rr + 'class'),
        namedNode(namespaces.rmlt + 'Target')
    ));

    // add the ThisMapping (extension to indicate generated logical targets)
    this.quads.push(quad(
        sSubject,
        namedNode(namespaces.rml + 'logicalTarget'),
        namedNode(namespaces.rmle + 'ThisMapping')
    ));

    // add PO mappings for the different types of targets. Similar to generating a target
    if (!target.type || target.type === 'void') {
      this.prefixes['void'] = namespaces.void;
      this.quads.push(quad(
          sSubject,
          namedNode(namespaces.rr + 'class'),
          namedNode(namespaces.void + 'Dataset')
      ));

      let filePath;
      if (!target.type) {
        filePath = target;
      } else {
        if (target.access) {
          filePath = target.access;
        } else {
          Logger.error("Path to VoID dataset is required")
        }
      }
      this._generatePOMap(tSubject, namespaces.void + "dataDump", {value: 'file://' + filePath, type: "literal"});


    } /* SPARQL endpoint */
    else if (target.type === 'sd') {
      this.prefixes['sd'] = namespaces.sd;

      this.quads.push(quad(
          sSubject,
          namedNode(namespaces.rr + 'class'),
          namedNode(namespaces.sd + 'Service')
      ));
      this._generatePOMap(tSubject, namespaces.sd + "supportedLanguage", {value: namespaces.sd + "SPARQL11Update", type: "iri"});

      if (target.access) {
        this._generatePOMap(tSubject, namespaces.sd + "endpoint", {value: target.access, type: "iri"});
      } else {
        Logger.error("SPARQL endpoint URL is required");
      }

    } /* DCAT Dataset */
    else if (target.type === 'dcat') {
      this.prefixes['dcat'] = namespaces.dcat;
      this.quads.push(quad(
          sSubject,
          namedNode(namespaces.rr + 'class'),
          namedNode(namespaces.dcat + 'Dataset')
      ));
      if (target.access) {
        this._generatePOMap(tSubject, namespaces.dcat + "dataDump", {value: target.access, type: "iri"});
      } else {
        Logger.error("Path to VoID dataset is required")
      }

    } /* HTTP request target */
    else if (target.type === 'directhttprequest' || target.type === 'linkedhttprequest') {
      this.prefixes['htv'] = namespaces.htv;
      this.prefixes['rmle'] = namespaces.rmle;

      const isDirect = target.type === 'directhttprequest';

      // add the subclass (type of http request)
      const subClassName = isDirect ? 'DirectHttpRequest' : 'LinkedHttpRequest';
      this.quads.push(quad(
          sSubject,
          namedNode(namespaces.rr + 'class'),
          namedNode(namespaces.rmle + subClassName)
      ));

      // check for required 'access' key
      if (target.access) {
        const uriPrefix = isDirect ? namespaces.htv + 'absoluteURI' : namespaces.rmle + 'linkingAbsoluteURI';
        this._generatePOMap(tSubject, uriPrefix, {value: target.access, type: 'literal'});
      } else {
        Logger.error("'access' key required for HTTP request target " + tSubject);
      }

      // check for required 'rel' key if it's a linked request
      if (!isDirect) {
        if (target.rel) {
          this._generatePOMap(tSubject, namespaces.rmle + "linkRelation", {value: target.rel, type: 'literal'});
        } else {
          Logger.error("'rel' key required for linked HTTP request target " + tSubject);
        }
      }

      // check for optional method name
      if (target.methodName) {
        this._generatePOMap(tSubject, namespaces.htv + "methodName", {value: target.methodName, type: 'literal'});
      }

      // check for optional contentType
      if (target.contentType) {
        this._generatePOMap(tSubject, namespaces.rmle + "contentTypeHeader", {value: target.contentType, type: 'literal'});
      }

      if (target.authentication) {
        const authIRI = this.authsIRIMap[target.authentication];
        this._generatePOMap(tSubject, namespaces.rmle + "userAuthentication", {value: authIRI.id, type: 'iri'});
      }
    }

    /* Invalid target */
    else {
      Logger.error("No (valid) target type found");
    }

    // TODO: LDES ?

  }

  /**
   *
   * @param sourceOrTarget the object this access is part of
   * @param sourceOrTargetSubject the URI of the sourceOrTargetObject
   * @param sourceOrTargetName The name (label) of the source or target object
   * @param isSource true: sourceOrTarget is a source; false: sourceOrTarget is a target
   * @param isDirect true: the HTTP access is 'direct'; false: the HTTP access is 'linked'
   * @private
   */
  _generateHTTPRequestAccess(sourceOrTarget, sourceOrTargetSubject, sourceOrTargetName, isSource, isDirect) {
    this.prefixes['htv'] = namespaces.htv;
    this.prefixes['rmle'] = namespaces.rmle;

    const httpSubject = namedNode(this.baseIRI + this.getUniqueID(sourceOrTarget.type));

    const className = isSource ? 'source' : 'target';
    this.quads.push(quad(
        sourceOrTargetSubject,
        namedNode(namespaces.rmlt + className),
        httpSubject
    ));

    // add the subclass
    const subClassName = isDirect ? 'DirectHttpRequest' : 'LinkedHttpRequest'
    this.quads.push(quad(
        httpSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.rmle + subClassName)
    ));

    // check for required 'access' key
    if (sourceOrTarget.access) {
      const uriPrefix = isDirect ? namespaces.htv + 'absoluteURI' : namespaces.rmle + 'linkingAbsoluteURI';
      this.quads.push(quad(
          httpSubject,
          namedNode(uriPrefix),
          literal(sourceOrTarget.access)
      ));
    } else {
      Logger.error("'access' key required for HTTP request " + className + " " + sourceOrTargetName);
    }

    // check for required 'rel' key if it's a linked request
    if (!isDirect) {
      if (sourceOrTarget.rel) {
        this.quads.push(quad(
            httpSubject,
            namedNode(namespaces.rmle + 'linkRelation'),
            literal(sourceOrTarget.rel)
        ));
      } else {
        Logger.error("'rel' key required for linked HTTP request target " + targetName);
      }
    }

    // check for optional method name
    if (sourceOrTarget.methodName) {
      this.quads.push(quad(
          httpSubject,
          namedNode(namespaces.htv + 'methodName'),
          literal(sourceOrTarget.methodName)
      ));
    }

    // check for optional contentType (if target)
    if (!isSource) {
      if (sourceOrTarget.contentType) {
        this.quads.push(quad(
            httpSubject,
            namedNode(namespaces.rmle + 'contentTypeHeader'),
            literal(sourceOrTarget.contentType)
        ));
      }
    }

    // check for optional accept header (if source)
    if (isSource) {
      if (sourceOrTarget.accept) {
        this.quads.push(quad(
            httpSubject,
            namedNode(namespaces.rmle + 'acceptTypeHeader'),
            literal(sourceOrTarget.accept)
        ));
      }
    }

    if (sourceOrTarget.authentication) {
      const authIRI = this.authsIRIMap[sourceOrTarget.authentication];
      this.quads.push(quad(
          httpSubject,
          namedNode(namespaces.rmle + 'userAuthentication'),
          authIRI
      ));
    }
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

  _getSerializationFormat(serialization) {
    let format = namedNode(namespaces.formats + 'N-Quads');
    if (serialization) {
      switch (serialization) {
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
    return format;
  }

  /**
   * Generates a PO Map from a single predicate and a single obejct.
   * This is a simplified version of the code found in abstract-generator.
   * @param tmSubject
   * @param predicate
   * @param object
   * @private
   */
  _generatePOMap(tmSubject, predicate, object) {
    const pomSubject = namedNode(this.baseIRI + this.getUniqueID('pom'));
    this.quads.push(quad(
        pomSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.rr + 'PredicateObjectMap')
    ));
    this.quads.push(quad(
        tmSubject,
        namedNode(namespaces.rr + 'predicateObjectMap'),
        pomSubject
    ));

    // generate predicate map
    const pmSubject = namedNode(this.baseIRI + this.getUniqueID('pm'));
    this.quads.push(quad(
        pmSubject,
        namedNode(namespaces.rdf + 'type'),
        namedNode(namespaces.rr + 'PredicateMap')
    ));

    this.quads.push(quad(
        pomSubject,
        namedNode(namespaces.rr + 'predicateMap'),
        pmSubject
    ));

    let isPredicateRDFTYPE = false;
    let appropriatePO;

    if (predicate === 'a') {
      appropriatePO = {
        object: namedNode(namespaces.rdf + 'type'),
        predicate: namedNode(namespaces.rr + 'constant')
      };
      isPredicateRDFTYPE = true;
    } else if (typeof predicate === 'object') {
      appropriatePO = this.getAppropriatePredicateAndObjectForValue(predicate.value, true);
    } else {
      appropriatePO = this.getAppropriatePredicateAndObjectForValue(predicate, true);
    }
    this.quads.push(quad(
        pmSubject,
        appropriatePO.predicate,
        appropriatePO.object
    ));

    // generate object map
    const omSubject = namedNode(this.baseIRI + this.getUniqueID('om'));
    this.quads.push(quad(
        pomSubject,
        namedNode(namespaces.rr + 'objectMap'),
        omSubject
    ));
    this.generateNormalObjectMap(omSubject, object);
  }
}

module.exports = RMLGenerator;
