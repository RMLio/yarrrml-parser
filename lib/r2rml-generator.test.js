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
    doR2RMLTestCase('R2RMLTC0001a');
    doR2RMLTestCase('R2RMLTC0002a');
    doR2RMLTestCase('R2RMLTC0002d');
    doR2RMLTestCase('R2RMLTC0002i');
  });
});

function work(path1, path2, cb) {
  compareY2R2RFiles(path.resolve(__dirname, '../test/', path1), path.resolve(__dirname, '../test/', path2), cb);
}
function doR2RMLTestCase(testCaseID) {
  it(testCaseID, function (done) {
    work(`r2rml-test-cases/${testCaseID}/mapping.yarrrml`, `r2rml-test-cases/${testCaseID}/mapping.r2rml.ttl`, done);
  });
}
