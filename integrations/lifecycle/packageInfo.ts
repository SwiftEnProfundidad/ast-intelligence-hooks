import packageJson from '../../package.json';

export const getCurrentPumukiVersion = (): string => packageJson.version;

export const getCurrentPumukiPackageName = (): string => packageJson.name;
