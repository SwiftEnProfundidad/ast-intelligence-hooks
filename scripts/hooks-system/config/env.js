const ENV = (process.env.NODE_ENV || 'development').toLowerCase();

function normalizeBool(val, defaultValue = false) {
    if (val === undefined) return defaultValue;
    if (typeof val === 'boolean') return val;
    const str = String(val).trim().toLowerCase();
    if (str === '') return defaultValue;
    return !(['false', '0', 'no', 'off'].includes(str));
}

function get(name, defaultValue = undefined) {
    return process.env[name] !== undefined ? process.env[name] : defaultValue;
}

function getNumber(name, defaultValue = 0) {
    const raw = process.env[name];
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : defaultValue;
}

function getBool(name, defaultValue = false) {
    return normalizeBool(process.env[name], defaultValue);
}

module.exports = {
    env: ENV,
    isProd: ENV === 'production',
    isStg: ENV === 'staging' || ENV === 'stage' || ENV === 'stg',
    isDev: ENV === 'development' || ENV === 'dev',
    get,
    getNumber,
    getBool,
};
