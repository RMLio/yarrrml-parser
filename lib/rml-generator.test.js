/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const compareY2RFiles = require("./tools").compareY2RFiles;
const assert = require('assert');
const convertYAMLtoRML = require('./rml-generator.js');
const fs = require("fs");
const path = require("path");

describe('YARRRML to RML', function () {
  this.timeout(10000);
  it.skip('works for dbpedia', function () {
    const yaml = fs.readFileSync(path.resolve(__dirname, '../resources/test.yarrr.yml'), 'utf8');
    const y2r = new convertYAMLtoRML();
    const jsonld = y2r.convert(yaml);
    const jsonldObj = JSON.parse(jsonld);

    const shouldBe = fs.readFileSync(path.resolve(__dirname, '../resources/test.rml.jsonld'), 'utf8');
    const shouldBeObj = JSON.parse(shouldBe);
    fs.writeFileSync(path.resolve(__dirname, '../tmp/out.jsonld'), jsonld, 'utf8');
    assert.deepEqual(jsonldObj, shouldBeObj);
  });

  it('works for an empty file', function (done) {
    work('trivial/null.yml', 'trivial/null.rml.ttl', done, {includeMetadata: false});
  });

  it('works for example1', function (done) {
    work('example1/rml/mapping.yml', 'example1/rml/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it.skip('works for example2', function (done) {
    // TODO
  });

  it('works for example3', function (done) {
    work('example3/mapping.yml', 'example3/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('works for example4', function (done) {
    work('example4/rml/mapping.yml', 'example4/rml/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it.skip('works for example5', function (done) {
    work('example5/rml/mapping.yml', 'example5/rml/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it.skip('works for example6', function (done) {
    // TODO
  });

  it('works for example8', function (done) {
    work('example8/rml/mapping.yml', 'example8/rml/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('works for prefix expansion', function (done) {
    work('prefix-expand/mapping.yml', 'prefix-expand/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('works for graph', function (done) {
    work('graph/mapping.yml', 'graph/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('works for graph with function', function (done) {
    work('graph/mapping_fno.yml', 'graph/mapping_fno.rml.ttl', done, {includeMetadata: false});
  });

  it('recursive functions', function (done) {
    work('recursive-functions/mapping.yml', 'recursive-functions/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('works for strings starting with "{"', function (done) {
    work('template-escape/mapping.yml', 'template-escape/mapping.rml.ttl', done, {includeMetadata: false});
  });

  describe('between our worlds rules', function () {
    it('anime', function (done) {
      work('betweenourworlds/anime/mapping.yarrrml', 'betweenourworlds/anime/mapping.rml.ttl', done, {includeMetadata: false});
    });

    it('character', function (done) {
      work('betweenourworlds/character/mapping.yarrrml', 'betweenourworlds/character/mapping.rml.ttl', done, {includeMetadata: false});
    });
  });

  it('fno-parameter-as-iri', function (done) {
    work('fno-parameter-as-iri/mapping.yml', 'fno-parameter-as-iri/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('joincondition with function', function (done) {
    work('joincondition-with-function/mapping.yml', 'joincondition-with-function/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('condition on po', function (done) {
    work('condition-on-po/rml/mapping.yml', 'condition-on-po/rml/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('condition on mapping with IRI as subject', function (done) {
    work('condition-on-mapping/rml/mapping.yml', 'condition-on-mapping/rml/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('predicate with prefix and template', function (done) {
    work('predicate-with-prefix-template/mapping.yml', 'predicate-with-prefix-template/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('function shortcut without prefix', function (done) {
    work('function-shortcut-without-prefix/mapping.yml', 'function-shortcut-without-prefix/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('function shortcut with prefix', function (done) {
    work('function-shortcut-with-prefix/mapping.yml', 'function-shortcut-with-prefix/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('function shortcut with 2 parameters', function (done) {
    work('function-shortcut-with-2-parameters/mapping.yml', 'function-shortcut-with-2-parameters/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('subject with function', function (done) {
    work('subjectmap-with-function/mapping.yml', 'subjectmap-with-function/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('condition and function on same po', function (done) {
    work('condition-function-on-po/mapping.yarrrml', 'condition-function-on-po/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('datatype on function result', function (done) {
    work('datatype-on-function/mapping.yarrrml', 'datatype-on-function/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('condition on single object', function (done) {
    work('condition-on-single-object/mapping.yarrrml', 'condition-on-single-object/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('escape character', function (done) {
    work('escape-character/mapping.yarrrml', 'escape-character/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('escape colon in object', function (done) {
    work('escape-colon-object/mapping.yarrrml', 'escape-colon-object/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('escape bracket in reference', function (done) {
    work('escape-bracket/mapping.yarrrml', 'escape-bracket/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('object is number', function (done) {
    work('object-number/mapping.yarrrml', 'object-number/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('oracle', function (done) {
    work('oracle/mapping.yarrrml', 'oracle/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('condition on mapping with constant', function (done) {
    work('condition-on-mapping-constant/mapping.yarrrml', 'condition-on-mapping-constant/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('template with two references', function (done) {
    work('template-2-references/mapping.yarrrml', 'template-2-references/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('join condition with one reference and text', function (done) {
    work('joincondition-template-1-reference-text/mapping.yarrrml', 'joincondition-template-1-reference-text/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('join condition with two references', function (done) {
    work('joincondition-template-2-references/mapping.yarrrml', 'joincondition-template-2-references/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('function without parameters', function (done) {
    work('function-without-parameters/mapping.yarrrml', 'function-without-parameters/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('equal', function (done) {
    work('equal/mapping.yarrrml', 'equal/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('nested condition on object with mapping', function (done) {
    work('condition-on-mapping-nested/mapping.yarrrml', 'condition-on-mapping-nested/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('condition on po with datatype', function (done) {
    work('condition-on-po-datatype/mapping.yarrrml', 'condition-on-po-datatype/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('condition on mapping with function for subject', function (done) {
    work('condition-on-mapping-subject-function/mapping.yarrrml', 'condition-on-mapping-subject-function/mapping.rml.ttl', done, {includeMetadata: false});
  });

  it('condition on mapping with blank node', function (done) {
    work('condition-on-mapping-with-blanknode/mapping.yarrrml', 'condition-on-mapping-with-blanknode/mapping.rml.ttl', done, {includeMetadata: false});
  });

  describe('language map', () => {
    it('reference', function (done) {
      work('language-map/reference/mapping.yarrrml', 'language-map/reference/mapping.rml.ttl', done, {includeMetadata: false});
    });
    it('template', function (done) {
      work('language-map/template/mapping.yarrrml', 'language-map/template/mapping.rml.ttl', done, {includeMetadata: false});
    });
  });


  describe('rr:class', function () {
    let options = {class: true, includeMetadata: false};
    doTestCase('rr_class/1-single', options);
    doTestCase('rr_class/2-multiple', options);
    doTestCase('rr_class/3-no-iri', options);
    doTestCase('rr_class/4-rdf-type', options);
    doTestCase('rr_class/5-custom-rdf-prefix', options);
    doTestCase('rr_class/6-multiple-rows', options);
    doTestCase('rr_class/7-function', options);
    doTestCase('rr_class/8-reference', options);
  });

  describe('object blank node', function () {
    it('no template or constant', function (done) {
      work('object-blank-node/mapping.yarrrml', 'object-blank-node/mapping.rml.ttl', done, {includeMetadata: false});
    });

    it('template', function (done) {
      work('object-blank-node/template/mapping.yarrrml', 'object-blank-node/template/mapping.rml.ttl', done, {includeMetadata: false});
    });

    it('constant', function (done) {
      work('object-blank-node/constant/mapping.yarrrml', 'object-blank-node/constant/mapping.rml.ttl', done, {includeMetadata: false});
    });
  });

  it('multiple input files', function (done) {
    workMultipleInputFiles(['multiple-input-files/mapping-1.yarrrml', 'multiple-input-files/mapping-2.yarrrml'],
      'multiple-input-files/mapping.rml.ttl', done, {includeMetadata: false});
  });

  describe('external references', function () {
    const options = {includeMetadata: false};

    doTestCase('external-references/1', options);
    doTestCase('external-references/2', options);
    doTestCase('external-references/3', options);
    doTestCase('external-references/4', options);
    doTestCase('external-references/5', options);
   });

  describe('authors', function () {
    it('array with objects', function (done) {
      work('author/array-with-objects/mapping.yarrrml', 'author/array-with-objects/mapping.rml.ttl', done);
    });
    it('array with strings', function (done) {
      work('author/array-with-strings/mapping.yarrrml', 'author/array-with-strings/mapping.rml.ttl', done);
    });
    it('array with Web IDs', function (done) {
      work('author/array-with-webids/mapping.yarrrml', 'author/array-with-webids/mapping.rml.ttl', done);
    });
    it('single string', function (done) {
      work('author/single-string/mapping.yarrrml', 'author/single-string/mapping.rml.ttl', done);
    });
  });

  it('metadata', function (done) {
    work('metadata/rml/mapping.yarrrml', 'metadata/rml/mapping.rml.ttl', done);
  });

  describe('csv delimiter', () => {
    it('tab', function (done) {
      work('csv-delimiter/semicolon/mapping.yarrrml', 'csv-delimiter/semicolon/mapping.rml.ttl', done);
    });
    it('semicolon', function (done) {
      work('csv-delimiter/tab/mapping.yarrrml', 'csv-delimiter/tab/mapping.rml.ttl', done);
    });
  });

  describe('logger usage', () => {
    it('has no error', () => {
      const y2r = new convertYAMLtoRML();
      y2r.convert(fs.readFileSync(path.resolve(__dirname, '../test/example1/rml/mapping.yml'), 'utf8'));
      assert.strictEqual(y2r.getLogger().has('error'), false);
      assert.strictEqual(y2r.getLogger().getAll().length, 0);
    });

    it('has error', () => {
      const y2r = new convertYAMLtoRML();
      y2r.convert(fs.readFileSync(path.resolve(__dirname, '../test/trivial/null.yml'), 'utf8'));
      assert.strictEqual(y2r.getLogger().has('error'), true);
      assert.strictEqual(y2r.getLogger().getAll().length, 1);
    });

  });
});

function doTestCase(testCaseID, options) {
  it(testCaseID.replace(/[-]/g, ' '), function (done) {
    work(`${testCaseID}/mapping.yarrr.yml`, `${testCaseID}/mapping.rml.ttl`, done, options);
  });
}

function work(path1, path2, cb, options = null) {
  compareY2RFiles(path.resolve(__dirname, '../test/', path1), path.resolve(__dirname, '../test/', path2), options, cb);
}

function workMultipleInputFiles(inputFiles, expectedOutputFile, cb, options = null) {
  const processedInputFiles = inputFiles.map(file => path.resolve(__dirname, '../test/', file));

  compareY2RFiles(processedInputFiles, path.resolve(__dirname, '../test/', expectedOutputFile), options, cb);
}
