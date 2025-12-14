
const { SyntaxKind } = require('ts-morph');

/**
 * Analyze DDD pattern compliance
 *
 * Rules from rulesbackend.mdc:
 * ✅ Repository pattern: Interface en domain, Implementation en infrastructure
 * ✅ Use Cases explícitos: Un archivo por use case
 * ✅ DTOs en boundaries: Validación con class-validator
 * ✅ Anemic domain models: Entities con comportamiento, no solo getters/setters
 * ✅ Value Objects: Immutability
 * ✅ Domain Events: OrderCreatedEvent, etc.
 */
function analyzeDDD(sf, findings, pushFinding, project) {
  const filePath = sf.getFilePath();

  analyzeRepositoryPattern(sf, filePath, findings, pushFinding, project);

  analyzeUseCasesPattern(sf, filePath, findings, pushFinding);

  analyzeDTOsPattern(sf, filePath, findings, pushFinding);

  analyzeAnemicDomain(sf, filePath, findings, pushFinding);

  analyzeValueObjects(sf, filePath, findings, pushFinding);

  analyzeDomainEvents(sf, filePath, findings, pushFinding);
}

// =============================================================================
// =============================================================================
function analyzeRepositoryPattern(sf, filePath, findings, pushFinding, project) {
  const classes = sf.getClasses();
  const interfaces = sf.getInterfaces();

  classes.forEach(cls => {
    const className = cls.getName() || '';

    if (/Repository$/i.test(className) && !className.startsWith('I')) {
      if (!filePath.includes('/infrastructure/')) {
        pushFinding('backend.ddd.repository_wrong_layer', 'critical', sf, cls,
          `Repository implementation ${className} must be in infrastructure/ layer, not domain/.`,
          findings);
      }

      const implementsClause = cls.getImplements();
      const hasInterface = implementsClause.length > 0;

      if (!hasInterface) {
        pushFinding('backend.ddd.repository_missing_interface', 'high', sf, cls,
          `Repository ${className} should implement an interface (I${className}) from domain/.`,
          findings);
      }

      const methods = cls.getMethods();
      const hasComplexLogic = methods.some(method => {
        const body = method.getBody();
        if (!body) return false;

        const bodyText = body.getText();
        const hasBusinessLogic =
          (bodyText.match(/if\s*\(/g) || []).length > 2 ||
          bodyText.includes('switch') ||
          bodyText.includes('for (') && !bodyText.includes('forEach');

        return hasBusinessLogic;
      });

      if (hasComplexLogic) {
        pushFinding('backend.ddd.repository_business_logic', 'high', sf, cls,
          `Repository ${className} contains business logic - move to Use Case. Repositories should only handle CRUD.`,
          findings);
      }
    }
  });

  interfaces.forEach(iface => {
    const interfaceName = iface.getName() || '';

    if (/Repository$/i.test(interfaceName)) {
      if (!filePath.includes('/domain/')) {
        pushFinding('backend.ddd.repository_interface_wrong_layer', 'critical', sf, iface,
          `Repository interface ${interfaceName} must be in domain/repositories/, not infrastructure/.`,
          findings);
      }
    }
  });
}

// =============================================================================
// =============================================================================
function analyzeUseCasesPattern(sf, filePath, findings, pushFinding) {
  if (/UseCase\.ts$/i.test(filePath)) {
    const classes = sf.getClasses();

    if (classes.length === 0) {
      pushFinding('backend.ddd.usecase_missing_class', 'high', sf, sf,
        `UseCase file without class - create class matching filename.`,
        findings);
      return;
    }

    if (classes.length > 1) {
      pushFinding('backend.ddd.usecase_multiple_classes', 'medium', sf, sf,
        `UseCase file with multiple classes - one use case per file for clarity.`,
        findings);
    }

    const useCaseClass = classes[0];
    const className = useCaseClass.getName() || '';

    if (!/UseCase$/i.test(className)) {
      pushFinding('backend.ddd.usecase_naming', 'medium', sf, useCaseClass,
        `Use Case class should end with 'UseCase': ${className}UseCase`,
        findings);
    }

    const methods = useCaseClass.getMethods();
    const hasExecuteMethod = methods.some(m =>
      /^(execute|handle|run)$/i.test(m.getName())
    );

    if (!hasExecuteMethod) {
      pushFinding('backend.ddd.usecase_missing_execute', 'medium', sf, useCaseClass,
        `Use Case should have execute(), handle() or run() method as entry point.`,
        findings);
    }

    const constructor = useCaseClass.getConstructors()[0];
    if (constructor) {
      const params = constructor.getParameters();
      const hasRepositories = params.some(p => {
        const typeName = p.getType().getText();
        return /Repository/i.test(typeName);
      });

      if (!hasRepositories && methods.length > 0) {
        pushFinding('backend.ddd.usecase_no_repository', 'low', sf, constructor,
          `Use Case without repository injection - consider if it needs data access.`,
          findings);
      }
    }
  }
}

// =============================================================================
// =============================================================================
function analyzeDTOsPattern(sf, filePath, findings, pushFinding) {
  if (/\.dto\.ts$/i.test(filePath) || filePath.includes('/dtos/')) {
    const classes = sf.getClasses();

    classes.forEach(cls => {
      const className = cls.getName() || '';

      if (!/Dto$/i.test(className)) {
        pushFinding('backend.ddd.dto_naming', 'medium', sf, cls,
          `DTO class should end with 'Dto': ${className}Dto`,
          findings);
      }

      const properties = cls.getProperties();
      const hasValidationDecorators = properties.some(prop => {
        const decorators = prop.getDecorators();
        return decorators.some(d => {
          const decoratorName = d.getName();
          return /^(IsString|IsNumber|IsEmail|IsBoolean|IsArray|IsOptional|IsNotEmpty|Min|Max|Length|Matches|ValidateNested)$/i.test(decoratorName);
        });
      });

      if (properties.length > 0 && !hasValidationDecorators) {
        pushFinding('backend.ddd.dto_missing_validation', 'high', sf, cls,
          `DTO ${className} without class-validator decorators - add @IsString(), @IsEmail(), etc. for validation.`,
          findings);
      }
    });
  }
}

// =============================================================================
// =============================================================================
function analyzeAnemicDomain(sf, filePath, findings, pushFinding) {
  if (!filePath.includes('/domain/') && !filePath.includes('/entities/')) return;

  const classes = sf.getClasses();

  classes.forEach(cls => {
    const className = cls.getName() || '';

    if (!/Entity$/i.test(className) && !filePath.includes('/entities/')) return;

    const methods = cls.getMethods();
    const properties = cls.getProperties();

    const businessMethods = methods.filter(m => {
      const name = m.getName();
      return !/^(get|set|constructor)/.test(name) &&
             name !== 'toString' &&
             name !== 'toJSON';
    });

    if (properties.length > 3 && businessMethods.length === 0) {
      pushFinding('backend.ddd.anemic_entity', 'high', sf, cls,
        `Anemic entity ${className} (${properties.length} properties, 0 business methods) - add domain logic.`,
        findings);
    }
  });
}

// =============================================================================
// =============================================================================
function analyzeValueObjects(sf, filePath, findings, pushFinding) {
  if (!/VO\.ts$|ValueObject\.ts$/i.test(filePath) && !filePath.includes('/value-objects/')) return;

  const classes = sf.getClasses();

  classes.forEach(cls => {
    const properties = cls.getProperties();

    properties.forEach(prop => {
      const hasReadonly = prop.hasModifier(SyntaxKind.ReadonlyKeyword);

      if (!hasReadonly) {
        pushFinding('backend.ddd.value_object_mutable', 'high', sf, prop,
          `Value Object property ${prop.getName()} should be readonly - Value Objects must be immutable.`,
          findings);
      }
    });
  });
}

// =============================================================================
// =============================================================================
function analyzeDomainEvents(sf, filePath, findings, pushFinding) {
  const classes = sf.getClasses();

  classes.forEach(cls => {
    const className = cls.getName() || '';

    if (/Event$/i.test(className)) {
      if (!filePath.includes('/events/')) {
        pushFinding('backend.ddd.event_wrong_location', 'medium', sf, cls,
          `Domain Event ${className} should be in application/events/ directory.`,
          findings);
      }

      const properties = cls.getProperties();
      const mutableProps = properties.filter(p =>
        !p.hasModifier(SyntaxKind.ReadonlyKeyword)
      );

      if (mutableProps.length > 0) {
        pushFinding('backend.ddd.event_mutable', 'medium', sf, cls,
          `Domain Event ${className} has mutable properties - events should be immutable.`,
          findings);
      }
    }
  });
}

/**
 * Helper: Detect layer from file path
 */
function detectLayer(path) {
  const normalized = path.toLowerCase().replace(/\\/g, '/');

  if (normalized.includes('/domain/')) return 'domain';
  if (normalized.includes('/application/')) return 'application';
  if (normalized.includes('/infrastructure/')) return 'infrastructure';
  if (normalized.includes('/presentation/')) return 'presentation';

  if (normalized.match(/\/(controllers|middleware|guards|interceptors)\//)) return 'presentation';
  if (normalized.match(/\/(entities|repositories|value-objects)\//)) return 'domain';
  if (normalized.match(/\/(use-cases|dtos|events)\//)) return 'application';
  if (normalized.match(/\/(database|config|external-services)\//)) return 'infrastructure';

  return null;
}

module.exports = {
  analyzeDDD
};
