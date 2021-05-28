#!/usr/bin/env node

/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const Y2R = require('../lib/rml-generator.js');
const Y2R2 = require('../lib/r2rml-generator.js');
const pkginfo = require('pkginfo');
const N3 = require('n3');
const namespaces = require('prefix-ns').asMap();
const watch = require('../lib/watcher.js');
const glob = require('glob');
const Logger = require('../lib/logger');

namespaces.ql = 'http://semweb.mmlab.be/ns/ql#';

pkginfo(module, 'version');

/**
 * This method collect all values when an option is used multiple times.
 * @param val A single value.
 * @param memo The current array of values.
 * @returns {*} The updated array with the new value.
 */
function collect(val, memo) {
  memo.push(val);
  return memo;
}

program.version(module.exports.version);
program.option('-i, --input <file>', 'input file (can be used multiple times)', collect, []); // We support multiple uses of this option.
program.option('-c, --class', 'use rr:class when appropriate');
program.option('-o, --output <file>', 'output file (default: stdout)');
program.option('-f, --format <format>', 'RML or R2RML (default: RML)');
program.option('-w, --watch', 'watch for file changes');
program.option('-e, --external <value>', 'external references (key=value, can be used multiple times', collect, []); // We support multiple uses of this option.
program.option('-m, --skip-metadata', 'include metadata in generated rules');
program.parse(process.argv);

const options = program.opts();

if (!options.input) {
  Logger.error('Please provide an input file using -i| --input.');
} else {
  let inputPaths = [];

  for (let input of options.input) {
    // Check if the input is a regex, e.g., *.yarrrml
    if (glob.hasMagic(input)) {
      const foundFiles = glob.sync(input).map(file => path.join(process.cwd(), file));
      inputPaths = inputPaths.concat(foundFiles);
    } else {
      if (!path.isAbsolute(input)) {
        input = path.join(process.cwd(), input);
      }

      inputPaths.push(input);
    }
  }

  if (!options.watch) {
    try {
      const inputData = [];

      for (const p of inputPaths) {
        const yarrrml = fs.readFileSync(p, 'utf8');
        inputData.push({yarrrml, file: p});
      }

      if (options.format) {
        options.format = options.format.toUpperCase();
      }

      let triples;

      let prefixes = {
        rr: namespaces.rr,
        rdf: namespaces.rdf,
        rdfs: namespaces.rdfs,
        fnml: "http://semweb.mmlab.be/ns/fnml#",
        fno: "https://w3id.org/function/ontology#",
        d2rq: "http://www.wiwiss.fu-berlin.de/suhl/bizer/D2RQ/0.1#",
        void: "http://rdfs.org/ns/void#",
        dc: "http://purl.org/dc/terms/",
        foaf: "http://xmlns.com/foaf/0.1/"
      };

      const externalReferences = {};

      for (const e of options.external) {
        const keyValue = e.split('=');
        externalReferences[keyValue[0]] = keyValue[1];
      }

      const includeMetadata =!(!!options.skipMetadata);

      if (!options.format || options.format === 'RML') {
        const y2r = new Y2R({class: !!options.class, externalReferences, includeMetadata});
        triples = y2r.convert(inputData);

        prefixes.rml = namespaces.rml;
        prefixes.ql = namespaces.ql;
        prefixes[''] = y2r.getBaseIRI();
        prefixes = Object.assign({}, prefixes, y2r.getPrefixes());
      } else {
        const y2r = new Y2R2({class: !!options.class, externalReferences, includeMetadata});
        triples = y2r.convert(inputData);
        prefixes[''] = y2r.getBaseIRI();
        prefixes = Object.assign({}, prefixes, y2r.getPrefixes());
      }

      const writer = new N3.Writer({prefixes});

      writer.addQuads(triples);
      writer.end((error, result) => {
        if (options.output) {
          if (!path.isAbsolute(options.output)) {
            options.output = path.join(process.cwd(), options.output);
          }

          try {
            fs.writeFileSync(options.output, result);
          } catch (e) {
            Logger.error(`The RML could not be written to the output file ${options.output}`);
          }
        } else {
          Logger.log(result);
        }
      });

    } catch (e) {
      if (e.code === 'ENOENT') {
        Logger.error(`The input file ${options.input} is not found.`);
      } else if (e.code === 'INVALID_YAML') {
        Logger.error(`The input file contains invalid YAML.`);
        Logger.error(`line ${e.parsedLine}: ${e.message}`);
      } else {
        Logger.error(e);
      }
    }
  } else {
    watch(options.input, options.output, options.format);
  }
}
