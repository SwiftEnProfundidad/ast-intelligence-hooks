import { hasNode, isObject } from '../utils/astHelpers';

const createFsCallbackDetector = (methodName: string) => {
  return (node: unknown): boolean => {
    return hasNode(node, (value) => {
      if (value.type !== 'CallExpression') {
        return false;
      }
      const callee = value.callee;

      if (isObject(callee) && callee.type === 'MemberExpression') {
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
        const isFsObject =
          isObject(objectNode) &&
          objectNode.type === 'Identifier' &&
          objectNode.name === 'fs';
        if (!isFsObject) {
          return false;
        }

        const args = value.arguments as unknown[];
        return Array.isArray(args) && args.some((argument: unknown) => {
          return (
            isObject(argument) &&
            (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
          );
        });
      }

      return false;
    });
  };
};

export const hasFsUtimesCallbackCall = createFsCallbackDetector('utimes');
export const hasFsWatchCallbackCall = createFsCallbackDetector('watch');
export const hasFsWatchFileCallbackCall = createFsCallbackDetector('watchFile');
export const hasFsUnwatchFileCallbackCall = createFsCallbackDetector('unwatchFile');
export const hasFsReadFileCallbackCall = createFsCallbackDetector('readFile');
export const hasFsExistsCallbackCall = createFsCallbackDetector('exists');
export const hasFsWriteFileCallbackCall = createFsCallbackDetector('writeFile');
export const hasFsAppendFileCallbackCall = createFsCallbackDetector('appendFile');
export const hasFsReaddirCallbackCall = createFsCallbackDetector('readdir');
export const hasFsMkdirCallbackCall = createFsCallbackDetector('mkdir');
export const hasFsRmdirCallbackCall = createFsCallbackDetector('rmdir');
export const hasFsRmCallbackCall = createFsCallbackDetector('rm');
export const hasFsRenameCallbackCall = createFsCallbackDetector('rename');
export const hasFsCopyFileCallbackCall = createFsCallbackDetector('copyFile');
export const hasFsStatCallbackCall = createFsCallbackDetector('stat');
export const hasFsStatfsCallbackCall = createFsCallbackDetector('statfs');
export const hasFsLstatCallbackCall = createFsCallbackDetector('lstat');
export const hasFsRealpathCallbackCall = createFsCallbackDetector('realpath');
export const hasFsAccessCallbackCall = createFsCallbackDetector('access');
export const hasFsChmodCallbackCall = createFsCallbackDetector('chmod');
export const hasFsChownCallbackCall = createFsCallbackDetector('chown');
export const hasFsLchownCallbackCall = createFsCallbackDetector('lchown');
export const hasFsLchmodCallbackCall = createFsCallbackDetector('lchmod');
export const hasFsUnlinkCallbackCall = createFsCallbackDetector('unlink');
export const hasFsReadlinkCallbackCall = createFsCallbackDetector('readlink');
export const hasFsSymlinkCallbackCall = createFsCallbackDetector('symlink');
export const hasFsLinkCallbackCall = createFsCallbackDetector('link');
export const hasFsMkdtempCallbackCall = createFsCallbackDetector('mkdtemp');
export const hasFsOpendirCallbackCall = createFsCallbackDetector('opendir');
export const hasFsOpenCallbackCall = createFsCallbackDetector('open');
export const hasFsCpCallbackCall = createFsCallbackDetector('cp');
export const hasFsCloseCallbackCall = createFsCallbackDetector('close');
export const hasFsReadCallbackCall = createFsCallbackDetector('read');
export const hasFsWriteCallbackCall = createFsCallbackDetector('write');
export const hasFsFsyncCallbackCall = createFsCallbackDetector('fsync');
export const hasFsFdatasyncCallbackCall = createFsCallbackDetector('fdatasync');
export const hasFsFtruncateCallbackCall = createFsCallbackDetector('ftruncate');
export const hasFsTruncateCallbackCall = createFsCallbackDetector('truncate');
export const hasFsFutimesCallbackCall = createFsCallbackDetector('futimes');
export const hasFsLutimesCallbackCall = createFsCallbackDetector('lutimes');
export const hasFsFchownCallbackCall = createFsCallbackDetector('fchown');
export const hasFsFchmodCallbackCall = createFsCallbackDetector('fchmod');
export const hasFsFstatCallbackCall = createFsCallbackDetector('fstat');
export const hasFsReadvCallbackCall = createFsCallbackDetector('readv');
export const hasFsWritevCallbackCall = createFsCallbackDetector('writev');
