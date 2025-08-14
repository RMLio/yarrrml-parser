const { DataFactory } = require('n3');
const {namedNode, quad} = DataFactory;
const namespaces = require('./namespaces').asMap();



class Utils {
    elementCounter = 0; // a global counter to generate unique id's for list elements

    /**
     * Creates a rdf:List from a list of nodes.
     * @param {String[]} items A list of RDF nodes (IRI, Literal) to be put in the list.
     * @param {String} baseIRI The mappings' base IRI, used as prefix to list element IRIs
     * @returns {{listElement: NamedNode, listQuads: Quad[]}} An object containing the first node of the list (listElement) and the list itself (listQuads)
     */
    createList(items, baseIRI) {
        if (!items.length)
            return {listElement: namedNode(namespaces['rdf'] + 'nil'), listQuads: []};

        const listQuads = [];
        const listElements = [namedNode(`${baseIRI}listElement_` + this.elementCounter++)];
        items.forEach((item, i) => {
            listQuads.push(quad(listElements[i], namedNode(namespaces['rdf'] + 'first'), item));
            if (i === items.length - 1)
                listQuads.push(quad(listElements[i], namedNode(namespaces['rdf'] + 'rest'), namedNode(namespaces['rdf'] + 'nil')));
            else {
                listElements.push(namedNode(`${baseIRI}listElement_` + this.elementCounter++));
                listQuads.push(quad(listElements[i], namedNode(namespaces['rdf'] + 'rest'), listElements[i + 1]));
            }
        });
        return {listElement: listElements[0], listQuads: listQuads};
    }

}

module.exports = {
    Utils
};
