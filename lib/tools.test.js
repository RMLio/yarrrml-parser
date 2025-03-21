const { canonicalize } = require("./tools");
const assert = require('assert');

describe('tools', () => {
    it('prettifies turtle', async () => {
        const newPrettyTtl = await canonicalize(uglyTtl);
        assert.strictEqual(newPrettyTtl.trim(), prettyTtl.trim());
    })
});

const uglyTtl = `@prefix rr: <http://www.w3.org/ns/r2rml#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix fnml: <http://semweb.mmlab.be/ns/fnml#>.
@prefix fno: <https://w3id.org/function/ontology#>.
@prefix d2rq: <http://www.wiwiss.fu-berlin.de/suhl/bizer/D2RQ/0.1#>.
@prefix void: <http://rdfs.org/ns/void#>.
@prefix dc: <http://purl.org/dc/terms/>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix rml: <http://semweb.mmlab.be/ns/rml#>.
@prefix ql: <http://semweb.mmlab.be/ns/ql#>.
@prefix : <http://mapping.example.com/>.
@prefix ex: <http://example.com/>.

:rules_000 a void:Dataset;
    void:exampleResource :map_track_000.
:map_track_000 rml:logicalSource :source_000.
:source_000 a rml:LogicalSource;
    rml:source "data.json";
    rml:iterator "$.features.[*].properties";
    rml:referenceFormulation ql:JSONPath.
:map_track_000 a rr:TriplesMap;
    rdfs:label "track".
:s_000 a rr:SubjectMap.
:map_track_000 rr:subjectMap :s_000.
:s_000 rr:template "http://example.com/sector/{sector}".
:pom_000 a rr:PredicateObjectMap.
:map_track_000 rr:predicateObjectMap :pom_000.
:pm_000 a rr:PredicateMap.
:pom_000 rr:predicateMap :pm_000.
:pm_000 rr:constant ex:name.
:pom_000 rr:objectMap :om_000.
:om_000 a rr:ObjectMap;
    rml:reference "sector";
    rr:termType rr:Literal.
:rules_000 void:exampleResource :map_sector0_000.
:map_sector0_000 rml:logicalSource :source_001.
:source_001 a rml:LogicalSource;
    rml:source "source_1.csv";
    rml:referenceFormulation ql:CSV.
:map_sector0_000 a rr:TriplesMap;
    rdfs:label "sector0".
:s_001 a rr:SubjectMap.
:map_sector0_000 rr:subjectMap :s_001.
:s_001 rr:template "http://example.com/Lap{Lap}/Sector1/{Athlete}".
:pom_001 a rr:PredicateObjectMap.
:map_sector0_000 rr:predicateObjectMap :pom_001.
:pm_001 a rr:PredicateMap.
:pom_001 rr:predicateMap :pm_001.
:pm_001 rr:constant ex:Sector.
:pom_001 rr:objectMap :om_001.
:om_001 a rr:ObjectMap;
    rr:parentTriplesMap :map_track_000;
    rml:joinCondition :jc_000.
:jc_000 a fnml:FunctionTermMap;
    fnml:functionValue :fn_000.
:fn_000 rr:predicateObjectMap :pomexec_000.
:pomexec_000 rr:predicateMap :pmexec_000.
:pmexec_000 rr:constant fno:executes.
:pomexec_000 rr:objectMap :omexec_000.
:omexec_000 rr:constant "https://w3id.org/imec/idlab/function#equal";
    rr:termType rr:IRI.
:fn_000 rr:predicateObjectMap :pom_002.
:pom_002 a rr:PredicateObjectMap;
    rr:predicateMap :pm_002.
:pm_002 a rr:PredicateMap;
    rr:constant <http://users.ugent.be/~bjdmeest/function/grel.ttl#valueParameter>.
:pom_002 rr:objectMap :om_002.
:om_002 a rr:ObjectMap;
    rr:constant "0";
    rr:termType rr:Literal.
:fn_000 rr:predicateObjectMap :pom_003.
:pom_003 a rr:PredicateObjectMap;
    rr:predicateMap :pm_003.
:pm_003 a rr:PredicateMap;
    rr:constant <http://users.ugent.be/~bjdmeest/function/grel.ttl#valueParameter2>.
:pom_003 rr:objectMap :om_003.
:om_003 a rr:ObjectMap;
    rml:parentTermMap :ptm_000.
:ptm_000 rml:reference "sector".

`;

const prettyTtl = `@prefix rr: <http://www.w3.org/ns/r2rml#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix fnml: <http://semweb.mmlab.be/ns/fnml#> .
@prefix fno: <https://w3id.org/function/ontology#> .
@prefix d2rq: <http://www.wiwiss.fu-berlin.de/suhl/bizer/D2RQ/0.1#> .
@prefix void: <http://rdfs.org/ns/void#> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix rml: <http://semweb.mmlab.be/ns/rml#> .
@prefix ql: <http://semweb.mmlab.be/ns/ql#> .
@prefix : <http://mapping.example.com/> .
@prefix ex: <http://example.com/> .

:rules_000 rdf:type void:Dataset ;
	void:exampleResource :map_track_000, :map_sector0_000 .

:map_track_000 rml:logicalSource :source_000 ;
	rdf:type rr:TriplesMap ;
	rdfs:label "track" ;
	rr:subjectMap :s_000 ;
	rr:predicateObjectMap :pom_000 .

:source_000 rdf:type rml:LogicalSource ;
	rml:source "data.json" ;
	rml:iterator "$.features.[*].properties" ;
	rml:referenceFormulation ql:JSONPath .

:s_000 rdf:type rr:SubjectMap ;
	rr:template "http://example.com/sector/{sector}" .

:pom_000 rdf:type rr:PredicateObjectMap ;
	rr:predicateMap :pm_000 ;
	rr:objectMap :om_000 .

:pm_000 rdf:type rr:PredicateMap ;
	rr:constant ex:name .

:om_000 rdf:type rr:ObjectMap ;
	rml:reference "sector" ;
	rr:termType rr:Literal .

:map_sector0_000 rml:logicalSource :source_001 ;
	rdf:type rr:TriplesMap ;
	rdfs:label "sector0" ;
	rr:subjectMap :s_001 ;
	rr:predicateObjectMap :pom_001 .

:source_001 rdf:type rml:LogicalSource ;
	rml:source "source_1.csv" ;
	rml:referenceFormulation ql:CSV .

:s_001 rdf:type rr:SubjectMap ;
	rr:template "http://example.com/Lap{Lap}/Sector1/{Athlete}" .

:pom_001 rdf:type rr:PredicateObjectMap ;
	rr:predicateMap :pm_001 ;
	rr:objectMap :om_001 .

:pm_001 rdf:type rr:PredicateMap ;
	rr:constant ex:Sector .

:om_001 rdf:type rr:ObjectMap ;
	rr:parentTriplesMap :map_track_000 ;
	rml:joinCondition :jc_000 .

:jc_000 rdf:type fnml:FunctionTermMap ;
	fnml:functionValue :fn_000 .

:fn_000 rr:predicateObjectMap :pomexec_000, :pom_002, :pom_003 .

:pomexec_000 rr:predicateMap :pmexec_000 ;
	rr:objectMap :omexec_000 .

:pmexec_000 rr:constant fno:executes .

:omexec_000 rr:constant "https://w3id.org/imec/idlab/function#equal" ;
	rr:termType rr:IRI .

:pom_002 rdf:type rr:PredicateObjectMap ;
	rr:predicateMap :pm_002 ;
	rr:objectMap :om_002 .

:pm_002 rdf:type rr:PredicateMap ;
	rr:constant <http://users.ugent.be/~bjdmeest/function/grel.ttl#valueParameter> .

:om_002 rdf:type rr:ObjectMap ;
	rr:constant "0" ;
	rr:termType rr:Literal .

:pom_003 rdf:type rr:PredicateObjectMap ;
	rr:predicateMap :pm_003 ;
	rr:objectMap :om_003 .

:pm_003 rdf:type rr:PredicateMap ;
	rr:constant <http://users.ugent.be/~bjdmeest/function/grel.ttl#valueParameter2> .

:om_003 rdf:type rr:ObjectMap ;
	rml:parentTermMap :ptm_000 .

:ptm_000 rml:reference "sector" .


`;
