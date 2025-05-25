import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const bundleName = 'alternative-media-controls.js';
const bundlePath = path.join('dist', bundleName);
const bundle = readFileSync(bundlePath, { encoding: 'utf-8' });

const meta = readFileSync('./tempermonkey');

const upperBound = '(function() {"use strict";';
const lowerBound = '})();';

const joined = [meta, upperBound, bundle, lowerBound].join('\n');
writeFileSync(bundlePath, joined, { encoding: 'utf-8' });