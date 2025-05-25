import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const upperBound = '(function() {"use strict";';
const lowerBound = '})();';
const bundleNames = ['controls.js', 'controls.min.js'];

for (const name of bundleNames) {
    const bundlePath = path.join('dist', name);
    const bundle = readFileSync(bundlePath, { encoding: 'utf-8' });
    const meta = readFileSync('./tempermonkey');

    const joined = [meta, upperBound, bundle, lowerBound].join('\n');
    const tempermonkeyName = `../tempermonkey.${name}`;
    const tempermonkeyPath = path.resolve(bundlePath, tempermonkeyName);
    writeFileSync(tempermonkeyPath, joined, { encoding: 'utf-8' });
}

