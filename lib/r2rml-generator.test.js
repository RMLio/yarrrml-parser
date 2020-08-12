/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const compareY2R2RFiles = require("./tools").compareY2R2RFiles;
const path = require("path");

describe('YARRRML to R2RML', function () {
  this.timeout(10000);

  it('example1', function (done) {
    work('example1/r2rml/mapping.yml', 'example1/r2rml/mapping.r2rml.ttl', done);
  });

  it('example4', function (done) {
    work('example4/r2rml/mapping.yml', 'example4/r2rml/mapping.r2rml.ttl', done);
  });

  it('example5', function (done) {
    work('example5/r2rml/mapping.yml', 'example5/r2rml/mapping.r2rml.ttl', done);
  });

  it('example8', function (done) {
    work('example8/r2rml/mapping.yml', 'example8/r2rml/mapping.r2rml.ttl', done);
  });

  it('condition on po', function (done) {
    work('condition-on-po/r2rml/mapping.yml', 'condition-on-po/r2rml/mapping.r2rml.ttl', done);
  });

  it('condition on mapping with IRI as subject', function (done) {
    work('condition-on-mapping/r2rml/mapping.yml', 'condition-on-mapping/r2rml/mapping.r2rml.ttl', done);
  });

  describe('R2RML test cases', function () {
    it('R2RMLTC0001a', function (done) {
      doR2RMLTestCase('R2RMLTC0001a', done);
    });

    it('R2RMLTC0002a', function (done) {
      doR2RMLTestCase('R2RMLTC0002a', done);
    });

    it('R2RMLTC0002d', function (done) {
      doR2RMLTestCase('R2RMLTC0002d', done);
    });

    it('R2RMLTC0002i', function (done) {
      doR2RMLTestCase('R2RMLTC0002i', done);
    });

    it('R2RMLTC0009a', function (done) {
      doR2RMLTestCase('R2RMLTC0009a', done);
    });
  });

  describe('rr:class', function () {
    let options = {class: true};
    doTestCase('rr_class/1-single', options);
    doTestCase('rr_class/2-multiple', options);
    doTestCase('rr_class/3-no-iri', options);
    doTestCase('rr_class/4-rdf-type', options);
    doTestCase('rr_class/5-custom-rdf-prefix', options);
    doTestCase('rr_class/6-multiple-rows', options);
    doTestCase('rr_class/7-function', options);
  });
});

function doTestCase(testCaseID, options) {
  it(testCaseID.replace(/[-]/g, ' '), function (done) {
    work(`${testCaseID}/mapping.yarrr.yml`, `${testCaseID}/mapping.r2rml.ttl`, done, options);
  });
}

function work(path1, path2, cb, options = null) {
  compareY2R2RFiles(path.resolve(__dirname, '../test/', path1), path.resolve(__dirname, '../test/', path2), options, cb);
}
function doR2RMLTestCase(testCaseID, done) {
    work(`r2rml-test-cases/${testCaseID}/mapping.yarrrml`, `r2rml-test-cases/${testCaseID}/mapping.r2rml.ttl`, done);
}
