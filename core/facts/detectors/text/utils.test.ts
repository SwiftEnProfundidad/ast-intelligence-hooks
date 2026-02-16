import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasIdentifierAt,
  isIdentifierCharacter,
  nextNonWhitespaceIndex,
  prevNonWhitespaceIndex,
  readIdentifierBackward,
  scanCodeLikeSource,
} from './utils';

test('isIdentifierCharacter valida letras, numeros y underscore', () => {
  assert.equal(isIdentifierCharacter('A'), true);
  assert.equal(isIdentifierCharacter('7'), true);
  assert.equal(isIdentifierCharacter('_'), true);
  assert.equal(isIdentifierCharacter('-'), false);
  assert.equal(isIdentifierCharacter(' '), false);
});

test('prevNonWhitespaceIndex y nextNonWhitespaceIndex ubican indices no vacios', () => {
  const source = ' \n\tabc  ';
  assert.equal(prevNonWhitespaceIndex(source, source.length - 1), 4);
  assert.equal(prevNonWhitespaceIndex('   ', 2), -1);
  assert.equal(nextNonWhitespaceIndex(source, 0), 3);
  assert.equal(nextNonWhitespaceIndex('   ', 0), -1);
});

test('readIdentifierBackward extrae identificador completo cuando aplica', () => {
  const source = 'const token_value = 1;';
  const endIndex = source.indexOf('token_value') + 'token_value'.length - 1;
  assert.deepEqual(readIdentifierBackward(source, endIndex), {
    value: 'token_value',
    start: source.indexOf('token_value'),
  });
  assert.deepEqual(readIdentifierBackward(source, source.indexOf(' ')), {
    value: '',
    start: -1,
  });
});

test('hasIdentifierAt respeta limites para evitar coincidencias parciales', () => {
  const source = 'jwt decode jwtDecode jwt.decode';
  assert.equal(hasIdentifierAt(source, source.indexOf('jwt'), 'jwt'), true);
  assert.equal(hasIdentifierAt(source, source.indexOf('jwtDecode'), 'jwt'), false);
  assert.equal(hasIdentifierAt(source, source.lastIndexOf('jwt'), 'jwt'), true);
});

test('scanCodeLikeSource ignora comentarios y strings', () => {
  const source = `
// jwt.decode in comment
const a = "jwt.decode in string";
/* jwt.decode in block comment */
const token = jwt.decode(payload);
`;
  const matched = scanCodeLikeSource(source, ({ source: candidate, index }) => {
    return hasIdentifierAt(candidate, index, 'jwt');
  });
  assert.equal(matched, true);
});

test('scanCodeLikeSource retorna false cuando solo hay coincidencias en comentarios o strings', () => {
  const source = `
// jwt.verify
const a = "jwt.verify";
/* jwt.verify */
`;
  const matched = scanCodeLikeSource(source, ({ source: candidate, index }) => {
    return hasIdentifierAt(candidate, index, 'jwt');
  });
  assert.equal(matched, false);
});
