/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const fs          = require('fs');
const Y2R         = require('./rml-generator.js');
const Y2R2         = require('./r2rml-generator.js');
const N3          = require('n3');
const namespaces  = require('prefix-ns').asMap();
const path        = require('path');
const Logger = require('./logger');

let inputFile;
let outputFile;
let initial = true;
let toYARRRML;

function watch(input, output, format) {
  inputFile = input[0];
  outputFile = output;

  if (!format || format === 'RML') {
    toYARRRML = new Y2R();
  } else {
    toYARRRML = new Y2R2();
  }

  try {
    fs.watchFile(inputFile, convert);
    convert();

    Logger.log(`Watching ${input} for changes...`);
  } catch (e) {
    if (e.errno === 'ENOENT') {
      Logger.log("Error no such file", output);
    } else {
      Logger.log(e);
    }
  }
}

function convert() {

  if (!initial) {
    Logger.log(`File has changed...`);
  }

  initial = false;

  const inputData = fs.readFileSync(inputFile, 'utf8');

  const rml  = toYARRRML.convert(inputData);

  const writer = new N3.Writer({
    prefixes: {
      rr: namespaces.rr,
      rml: namespaces.rml,
      rdf: namespaces.rdf,
      rdfs: namespaces.rdfs
    }
  });
  writer.addQuads(rml);
  writer.end((error, result) => {
    if (!path.isAbsolute(outputFile)) {
      output = path.join(process.cwd(), outputFile);
    }

    try {
      fs.writeFileSync(outputFile, result);
    } catch (e) {
      Logger.error(`The RML could not be written to the output file ${outputFile}`);
    }
  });
}

module.exports = watch;
