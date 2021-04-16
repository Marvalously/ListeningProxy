import os from 'os';
import fs from 'fs';
import path from 'path';
import process from 'process';
import uglifyES from 'uglify-es';

const srcPath = './src';
const distPath = './dist';
const fileNames = ['listening-proxy.js'];

process.stdout.write(`\x1B[32mBuild started:\x1B[0m${os.EOL}`);

process.stdout.write('  Clearing "' + distPath + '" ........');
try {
    fs.rmSync(distPath, {recursive: true, force: true});
    fs.mkdirSync(distPath);
} catch (e) {
    process.stdout.write(` \x1B[31mFAIL\x1B[0m${os.EOL}`);
    process.stdout.write(`\x1B[31mBUILD FAILED\x1B[0m${os.EOL}`);
    process.exit(1);
}
process.stdout.write(` \x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('  Copying to "' + distPath + '" ......');
try {
    for (let fileName of fileNames) {
        fs.copyFileSync(path.join(srcPath, fileName), path.join(distPath, fileName));
    }
} catch (e) {
    process.stdout.write(` \x1B[31mFAIL\x1B[0m${os.EOL}`);
    process.stdout.write(`\x1B[31mBUILD FAILED\x1B[0m${os.EOL}`);
    process.exit(1);
}
process.stdout.write(` \x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('  Minifying ................');
try {
    for (let fileName of fileNames) {
        const sourceCode = fs.readFileSync(path.join(distPath, fileName), {encoding: 'utf8'});
        const minCode = uglifyES.minify(sourceCode, {toplevel: true}).code;
        fs.writeFileSync(path.join(distPath, fileName.replace(/\.js$/, '.min.js')), minCode);
    }
} catch (e) {
    process.stdout.write(` \x1B[31mFAIL\x1B[0m${os.EOL}`);
    process.stdout.write(`\x1B[31mBUILD FAILED\x1B[0m${os.EOL}`);
    process.exit(1);
}
process.stdout.write(` \x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write(`\x1B[32mBUILD SUCCEEDED\x1B[0m${os.EOL}`);
