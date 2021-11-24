const glob = require('glob');
const path = require('path');
const fs = require('fs/promises');
const { canonicalize } = require('../lib/tools');

const files = glob.sync('./**/*.ttl', { cwd: path.resolve(__dirname) });
files.forEach(async (file) => {
    const content = await fs.readFile(path.resolve(__dirname, file), 'utf8');
    const prettyContent = await canonicalize(content);
    await fs.writeFile(path.resolve(__dirname, file), prettyContent, 'utf8');
    console.log('fixed ' + file);
})
