/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const compareY2R2RFiles = require("./tools").compareY2R2RFiles;
const path = require("path");

describe('YARRRML to R2RML', function () {
  this.timeout(10000);

  it('example1', function (done) {
    work('example1_r2rml/mapping.yml', 'example1_r2rml/mapping.r2rml.ttl', done);
  });

  it('example4', function (done) {
    work('example4_r2rml/mapping.yml', 'example4_r2rml/mapping.r2rml.ttl', done);
  });

  it('example5', function (done) {
    work('example5_r2rml/mapping.yml', 'example5_r2rml/mapping.r2rml.ttl', done);
  });
});

function work(path1, path2, cb) {
  compareY2R2RFiles(path.resolve(__dirname, '../test/', path1), path.resolve(__dirname, '../test/', path2), cb);
}
