import { hasNode, isObject } from '../utils/astHelpers';

const createFsPromiseDetector = (methodName: string) => {
  return (node: unknown): boolean => {
    return hasNode(node, (value) => {
      if (value.type !== 'CallExpression') {
        return false;
      }
      const callee = value.callee;
      if (!isObject(callee) || callee.type !== 'MemberExpression') {
        return false;
      }

      const propertyNode = callee.property;
      const isTargetProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === methodName) ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === methodName);
      if (!isTargetProperty) {
        return false;
      }

      const objectNode = callee.object;
      if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
        return false;
      }

      const promisesProperty = objectNode.property;
      const isPromisesProperty =
        (objectNode.computed === true &&
          isObject(promisesProperty) &&
          promisesProperty.type === 'StringLiteral' &&
          promisesProperty.value === 'promises') ||
        (objectNode.computed !== true &&
          isObject(promisesProperty) &&
          promisesProperty.type === 'Identifier' &&
          promisesProperty.name === 'promises');
      if (!isPromisesProperty) {
        return false;
      }

      const fsNode = objectNode.object;
      return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
    });
  };
};

export const hasFsPromisesWriteFileCall = createFsPromiseDetector('writeFile');
export const hasFsPromisesAppendFileCall = createFsPromiseDetector('appendFile');
export const hasFsPromisesRmCall = createFsPromiseDetector('rm');
export const hasFsPromisesUnlinkCall = createFsPromiseDetector('unlink');
export const hasFsPromisesReadFileCall = createFsPromiseDetector('readFile');
export const hasFsPromisesReaddirCall = createFsPromiseDetector('readdir');
export const hasFsPromisesMkdirCall = createFsPromiseDetector('mkdir');
export const hasFsPromisesStatCall = createFsPromiseDetector('stat');
export const hasFsPromisesCopyFileCall = createFsPromiseDetector('copyFile');
export const hasFsPromisesRenameCall = createFsPromiseDetector('rename');
export const hasFsPromisesAccessCall = createFsPromiseDetector('access');
export const hasFsPromisesChmodCall = createFsPromiseDetector('chmod');
export const hasFsPromisesChownCall = createFsPromiseDetector('chown');
export const hasFsPromisesUtimesCall = createFsPromiseDetector('utimes');
export const hasFsPromisesLstatCall = createFsPromiseDetector('lstat');
export const hasFsPromisesRealpathCall = createFsPromiseDetector('realpath');
export const hasFsPromisesSymlinkCall = createFsPromiseDetector('symlink');
export const hasFsPromisesLinkCall = createFsPromiseDetector('link');
export const hasFsPromisesReadlinkCall = createFsPromiseDetector('readlink');
export const hasFsPromisesOpenCall = createFsPromiseDetector('open');
export const hasFsPromisesOpendirCall = createFsPromiseDetector('opendir');
export const hasFsPromisesCpCall = createFsPromiseDetector('cp');
export const hasFsPromisesMkdtempCall = createFsPromiseDetector('mkdtemp');
