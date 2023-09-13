// initialize (common) prefixes and namespaces from prefix.cc
// Unknown prefixes can be added here, and "wrong" prefixes can be overridden

const _namespaces = require('prefix-ns').asMap();
_namespaces['comp'] = 'http://semweb.mmlab.be/ns/rml-compression#';
_namespaces['idlab-fn'] = 'http://example.com/idlab/function/';
_namespaces['rml'] = 'http://semweb.mmlab.be/ns/rml#'; // this one is the only official one for now, but prefix.cc returns the wrong one.
_namespaces['rmlt'] = 'http://semweb.mmlab.be/ns/rml-target#';
_namespaces['dc'] = 'http://purl.org/dc/terms/';
_namespaces['ql'] = 'http://semweb.mmlab.be/ns/ql#';
_namespaces['idsa'] = 'https://w3id.org/idsa/core/';
_namespaces['ldes'] = 'https://w3id.org/ldes#';   // prefix.cc returns the http (without s) version
_namespaces['tree'] = 'https://w3id.org/tree#';   // prefix.cc returns the http (without s) version

/**
 * Returns the namepace for a given prefix
 * @param {string} prefix The prefix to get the namespace for.
 * @returns {string}  The namespace for the given prefix.
 */
function asMap() {
    return _namespaces;
}

module.exports = {
    asMap
};
