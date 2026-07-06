// Self-check: node service/serverUrl.check.mjs
import assert from 'node:assert/strict';
import { normalizeServerUrl } from './serverUrl.ts';

assert.equal(normalizeServerUrl('echo.example.com'), 'https://echo.example.com/api');
assert.equal(normalizeServerUrl('https://echo.example.com'), 'https://echo.example.com/api');
assert.equal(normalizeServerUrl('https://echo.example.com/'), 'https://echo.example.com/api');
assert.equal(normalizeServerUrl('https://echo.example.com/api'), 'https://echo.example.com/api');
assert.equal(normalizeServerUrl('https://echo.example.com/api/'), 'https://echo.example.com/api');
assert.equal(normalizeServerUrl('http://192.168.1.10:3000'), 'http://192.168.1.10:3000/api');
assert.equal(normalizeServerUrl('  '), '');
console.log('serverUrl ok');
