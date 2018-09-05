/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const compareY2RFiles = require("./tools").compareY2RFiles;
const assert = require('assert');
const convertYAMLtoRML = require('./yarrrml2rml.js');
const fs = require("fs");
const path = require("path");

describe('expanded test', function () {
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
    work('trivial/null.yml', 'trivial/null.rml.ttl', done);
  });

  it('works for example1', function (done) {
    work('example1/example.yml', 'example1/example.rml.ttl', done);
  });

  it.skip('works for example2', function (done) {
    // TODO
  });

  it('works for example3', function (done) {
    work('example3/example3.yml', 'example3/example3.rml.ttl', done);
  });

  it('works for example4', function (done) {
    work('example4/example4.yml', 'example4/example4_Venue.rml.ttl', done);
  });

  it.skip('works for example5', function (done) {
    work('example5/example5.yml', 'example5/museum-model.rml.ttl', done);
  });

  it.skip('works for example6', function (done) {
    // TODO
  });

  it('works for example8', function (done) {
    work('example8/simergy.yml', 'example8/simergy.rml.ttl', done);
  });

  it('works for prefix expansion', function (done) {
    work('prefixExpand/input.1.yml', 'prefixExpand/output.1.rml.ttl', done);
  });

  it('works for graph with function', function (done) {
    work('graph/mapping_fno.yml', 'graph/mapping_fno.rml.ttl', done);
  });
});

function work(path1, path2, cb) {
  compareY2RFiles(path.resolve(__dirname, '../test/', path1), path.resolve(__dirname, '../test/', path2), cb);
}
