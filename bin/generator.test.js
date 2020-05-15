/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const assert = require('assert');
const expand = require('./generator');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

describe.skip('generator', () => {
  it('doesn\'t work without input nor output', async () => {
    try {
      const {stdout, stderr} = await exec('node ./bin/generator.js');
    } catch (e) {
      assert.notStrictEqual(e.code, 0);
      return;
    }
    assert.fail();
  });

  it('doesn\'t work without proper input', async () => {
    try {
      const {stdout, stderr} = await exec('node ./bin/generator.js ./test/betweenourworlds/rules-anime.rml.ttl');
    } catch (e) {
      assert.notStrictEqual(e.code, 0);
      return;
    }
    assert.fail();
  });
});
