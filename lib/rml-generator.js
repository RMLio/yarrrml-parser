/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const namespaces = require('prefix-ns').asMap();
const AbstractGenerator = require('./abstract-generator.js');
const formulations = require('./formulations.json');
const { DataFactory } = require('n3');
const {namedNode, literal, quad} = DataFactory;
const jdbcDrivers = require('./jdbc-drivers');

namespaces.ql = 'http://semweb.mmlab.be/ns/ql#';
namespaces['idlab-fn'] = 'http://example.com/idlab/function/';
namespaces.td = 'https://www.w3.org/2019/wot/td#'
namespaces.wotsec = 'https://www.w3.org/2019/wot/security#'
namespaces.hctl = 'https://www.w3.org/2019/wot/hypermedia#'
namespaces.idsa = 'https://w3id.org/idsa/core/'

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

    if (!yarrrml.mappings) {
      return this.quads;
    }

    Object.keys(yarrrml.mappings).forEach(mappingName => {
      const mapping = yarrrml.mappings[mappingName];

      if (mapping.sources) {
        mapping.sources = [].concat(mapping.sources);
        mapping.sources.forEach(source => {
          const tmSubject = namedNode(this.baseIRI + this.getUniqueID('map_' + mappingName));
          this.addMappingIRI(mappingName, tmSubject);

          let sourceSubject;

          if (typeof source === 'string') {
            sourceSubject = sourcesIRIMap[source];

            this.quads.push(quad(
              tmSubject,
              namedNode(namespaces.rml + 'logicalSource'),
              sourceSubject
            ));
          } else {
            sourceSubject = this.generateSource(source, tmSubject);
          }

          this.generateMapping(tmSubject, mapping, mappingName, sourceSubject);
        });
      } else {
        const tmSubject = namedNode(this.baseIRI + mappingName);
        this.generateMapping(tmSubject, mapping, mappingName);
      }
    });

    this.generateAllReferencingObjectMap();
    return this.quads;
  }

  generateMapping(tmSubject, mapping, mappingName, sourceSubject) {
    this.quads.push(quad(
      tmSubject,
      namedNode(namespaces.rdf + 'type'),
      namedNode(namespaces.rr + 'TriplesMap')
    ));

    super.generateMapping(tmSubject, mapping, mappingName, sourceSubject);
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

        this.quads.push(quad(
          sSubject,
          namedNode(namespaces.rml + 'query'),
          literal(source.query)
        ));

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
