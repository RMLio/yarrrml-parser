const glob = require('glob');
const path = require('path');
const fs = require('fs/promises');
const { canonicalize } = require('../lib/tools');

const files = glob.sync('./**/*.ttl', { cwd: path.resolve(__dirname) });
(async () => {
  for (const file of files) {
    try {
        console.log('fixing ' + file);
        const content = await fs.readFile(path.resolve(__dirname, file), 'utf8');
        const prettyContent = await canonicalize(content);
        await fs.writeFile(path.resolve(__dirname, file), prettyContent, 'utf8');
    } catch (err) {
        console.error(`Error processing ${file}:`, err);
    }
  }
})();
