const DIStrategy = require('./DIStrategy');

class ConcreteDependencyStrategy extends DIStrategy {
    constructor(config) {
        super('ios.solid.dip.concrete_dependency', config);
    }

    canHandle(node, context) {
        const { className } = context;
        return this.config.targetClasses.some(target => className.includes(target));
    }

    detect(node, context) {
        const { properties, className, filePath } = context;
        const violations = [];

        for (const prop of properties) {
            const typename = prop['key.typename'] || '';
            const propName = prop['key.name'] || '';

            if (this._shouldSkipType(typename, propName, className)) {
                continue;
            }

            if (this._isConcreteService(typename)) {
                violations.push({
                    property: propName,
                    type: typename,
                    message: `'${className}' depends on concrete '${typename}' - use protocol`
                });
            }
        }

        return violations;
    }

    _shouldSkipType(typename, propName, className) {
        if (this.config.allowedTypes.includes(typename)) {
            return true;
        }

        if (this._isGenericTypeParameter(typename, propName, className)) {
            return true;
        }

        return false;
    }

    _isGenericTypeParameter(typename, propName, className) {
        const patterns = this.config.genericTypePatterns;

        const isSingleLetter = patterns.singleLetter && typename.length === 1;

        const isCamelCase = patterns.camelCase &&
            new RegExp(patterns.camelCase).test(typename) &&
            !typename.includes('Impl');

        const hasContextHint = patterns.contextHints.some(hint =>
            className.includes(hint) || propName === hint
        );

        return isSingleLetter || (isCamelCase && hasContextHint);
    }

    _isConcreteService(typename) {
        const hasConcretePattern = this.config.concretePatterns.some(pattern =>
            new RegExp(pattern).test(typename)
        );

        const hasProtocolIndicator = this.config.protocolIndicators.some(indicator =>
            typename.includes(indicator)
        );

        return hasConcretePattern && !hasProtocolIndicator;
    }
}

module.exports = ConcreteDependencyStrategy;
