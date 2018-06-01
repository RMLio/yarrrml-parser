/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const fs          = require('fs');
const Y2R         = require('./yarrrml2rml.js');
const Y2R2         = require('./yarrrml2r2rml.js');
const N3          = require('n3');
const namespaces  = require('prefix-ns').asMap();
const path        = require('path');

let inputFile;
let outputFile;
let initial = true;
let toYARRRML;

function watch(input, output, format) {
  inputFile = input;
  outputFile = output;

  if (!format || format === 'RML') {
    toYARRRML = new Y2R();
  } else {
    toYARRRML = new Y2R2();
  }

  try {
    fs.watchFile(input, convert);
    convert();

    console.log(`Watching ${input} for changes...`);
  } catch (e) {
    if (e.errno === 'ENOENT') {
      console.log("Error no such file", output);
    } else {
      console.log(e);
    }
  }
}

function convert() {

  if (!initial) {
    console.log(`File has changed...`);
  }

  initial = false;

  const inputData = fs.readFileSync(inputFile, 'utf8');

  const rml  = toYARRRML.convert(inputData);

  const writer = N3.Writer({
    prefixes: {
      rr: namespaces.rr,
      rml: namespaces.rml,
      rdf: namespaces.rdf,
      rdfs: namespaces.rdfs
    }
  });
  writer.addTriples(rml);
  writer.end((error, result) => {
    if (!path.isAbsolute(outputFile)) {
      output = path.join(process.cwd(), outputFile);
    }

    try {
      fs.writeFileSync(outputFile, result);
    } catch (e) {
      console.error(`The RML could not be written to the output file ${outputFile}`);
    }
  });
}

module.exports = watch;