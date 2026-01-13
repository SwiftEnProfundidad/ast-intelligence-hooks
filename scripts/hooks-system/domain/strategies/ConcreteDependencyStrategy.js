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

            if (this._shouldSkipType(typename, propName, className, context)) {
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

    _shouldSkipType(typename, propName, className, context) {
        if (this.config.allowedTypes.includes(typename)) {
            return true;
        }

        if (this._isLikelyProtocolType(typename)) {
            return true;
        }

        if (this._isGenericTypeParameter(typename, propName, className)) {
            return true;
        }

        if (this._isGenericConstraintType(typename, className, context)) {
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

    _isGenericConstraintType(typename, className, context) {
        const content = context?.analyzer?.fileContent || '';
        if (!content) return false;

        const classPattern = new RegExp(`\\b(class|struct)\\s+${className}\\s*<([^>]+)>`);
        const match = content.match(classPattern);
        if (!match) return false;

        const genericClause = match[2];
        const constraints = genericClause.split(',').map((part) => part.trim());

        return constraints.some((constraint) => {
            const [name, bound] = constraint.split(':').map((value) => value.trim());
            return name === typename && bound;
        });
    }

    _isConcreteService(typename) {
        const normalized = this._normalizeTypeName(typename);
        const hasConcretePattern = this.config.concretePatterns.some(pattern =>
            new RegExp(pattern).test(normalized)
        );

        const hasProtocolIndicator = this.config.protocolIndicators.some(indicator =>
            normalized.includes(indicator)
        );

        const isLikelyProtocol = /UseCase$|Repository$/.test(normalized) && !/Impl$/.test(normalized);

        return hasConcretePattern && !hasProtocolIndicator && !isLikelyProtocol;
    }

    _isLikelyProtocolType(typename) {
        const normalized = this._normalizeTypeName(typename);

        if (/Impl$/.test(normalized)) {
            return false;
        }
        return /UseCase$|Repository$/.test(normalized);
    }

    _normalizeTypeName(typename) {
        return typename
            .replace(/^(any|some)\s+/, '')
            .replace(/[!?]/g, '')
            .replace(/<.*>/g, '')
            .split('&')[0]
            .split('.')
            .pop()
            ?.trim()
            .replace(/[^A-Za-z0-9_].*$/, '') || typename;
    }
}

module.exports = ConcreteDependencyStrategy;
