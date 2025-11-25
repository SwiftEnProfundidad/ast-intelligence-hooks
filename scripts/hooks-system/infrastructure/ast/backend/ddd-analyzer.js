// ===== DDD (Domain-Driven Design) ANALYZER - BACKEND =====
// Based on rulesbackend.mdc specifications
// Enforces DDD patterns: Repositories, Use Cases, DTOs, Value Objects, Domain Events

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
  
  // PATTERN 1: Repository Pattern
  analyzeRepositoryPattern(sf, filePath, findings, pushFinding, project);
  
  // PATTERN 2: Use Cases Pattern
  analyzeUseCasesPattern(sf, filePath, findings, pushFinding);
  
  // PATTERN 3: DTOs Pattern
  analyzeDTOsPattern(sf, filePath, findings, pushFinding);
  
  // PATTERN 4: Anemic Domain Models
  analyzeAnemicDomain(sf, filePath, findings, pushFinding);
  
  // PATTERN 5: Value Objects
  analyzeValueObjects(sf, filePath, findings, pushFinding);
  
  // PATTERN 6: Domain Events
  analyzeDomainEvents(sf, filePath, findings, pushFinding);
}

// =============================================================================
// PATTERN 1: Repository Pattern
// Interface en domain/, Implementation en infrastructure/
// =============================================================================
function analyzeRepositoryPattern(sf, filePath, findings, pushFinding, project) {
  const classes = sf.getClasses();
  const interfaces = sf.getInterfaces();
  
  // Check for Repository implementations
  classes.forEach(cls => {
    const className = cls.getName() || '';
    
    // Is it a Repository implementation?
    if (/Repository$/i.test(className) && !className.startsWith('I')) {
      // MUST be in infrastructure/
      if (!filePath.includes('/infrastructure/')) {
        pushFinding('backend.ddd.repository_wrong_layer', 'critical', sf, cls,
          `Repository implementation ${className} must be in infrastructure/ layer, not domain/.`,
          findings);
      }
      
      // MUST implement an interface
      const implementsClause = cls.getImplements();
      const hasInterface = implementsClause.length > 0;
      
      if (!hasInterface) {
        pushFinding('backend.ddd.repository_missing_interface', 'high', sf, cls,
          `Repository ${className} should implement an interface (I${className}) from domain/.`,
          findings);
      }
      
      // MUST NOT have business logic (only CRUD)
      const methods = cls.getMethods();
      const hasComplexLogic = methods.some(method => {
        const body = method.getBody();
        if (!body) return false;
        
        const bodyText = body.getText();
        // Business logic indicators: if/switch/loops for logic (not just queries)
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
  
  // Check for Repository interfaces
  interfaces.forEach(iface => {
    const interfaceName = iface.getName() || '';
    
    if (/Repository$/i.test(interfaceName)) {
      // MUST be in domain/
      if (!filePath.includes('/domain/')) {
        pushFinding('backend.ddd.repository_interface_wrong_layer', 'critical', sf, iface,
          `Repository interface ${interfaceName} must be in domain/repositories/, not infrastructure/.`,
          findings);
      }
    }
  });
}

// =============================================================================
// PATTERN 2: Use Cases Pattern
// Un archivo por use case, naming convention, inyección de repositorios
// =============================================================================
function analyzeUseCasesPattern(sf, filePath, findings, pushFinding) {
  // Is it a Use Case file?
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
    
    // Naming convention: Must end with UseCase
    if (!/UseCase$/i.test(className)) {
      pushFinding('backend.ddd.usecase_naming', 'medium', sf, useCaseClass,
        `Use Case class should end with 'UseCase': ${className}UseCase`,
        findings);
    }
    
    // Must have execute() or handle() or run() method
    const methods = useCaseClass.getMethods();
    const hasExecuteMethod = methods.some(m => 
      /^(execute|handle|run)$/i.test(m.getName())
    );
    
    if (!hasExecuteMethod) {
      pushFinding('backend.ddd.usecase_missing_execute', 'medium', sf, useCaseClass,
        `Use Case should have execute(), handle() or run() method as entry point.`,
        findings);
    }
    
    // Should inject repositories via constructor
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
// PATTERN 3: DTOs Pattern
// DTOs en boundaries con class-validator decorators
// =============================================================================
function analyzeDTOsPattern(sf, filePath, findings, pushFinding) {
  // Is it a DTO file?
  if (/\.dto\.ts$/i.test(filePath) || filePath.includes('/dtos/')) {
    const classes = sf.getClasses();
    
    classes.forEach(cls => {
      const className = cls.getName() || '';
      
      // Naming: Must end with Dto
      if (!/Dto$/i.test(className)) {
        pushFinding('backend.ddd.dto_naming', 'medium', sf, cls,
          `DTO class should end with 'Dto': ${className}Dto`,
          findings);
      }
      
      // Must have class-validator decorators
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
// PATTERN 4: Anemic Domain Models
// Entities should have behavior, not just getters/setters
// =============================================================================
function analyzeAnemicDomain(sf, filePath, findings, pushFinding) {
  // Only check domain entities
  if (!filePath.includes('/domain/') && !filePath.includes('/entities/')) return;
  
  const classes = sf.getClasses();
  
  classes.forEach(cls => {
    const className = cls.getName() || '';
    
    // Is it an Entity?
    if (!/Entity$/i.test(className) && !filePath.includes('/entities/')) return;
    
    const methods = cls.getMethods();
    const properties = cls.getProperties();
    
    // Filter out getters/setters/constructors
    const businessMethods = methods.filter(m => {
      const name = m.getName();
      return !/^(get|set|constructor)/.test(name) && 
             name !== 'toString' && 
             name !== 'toJSON';
    });
    
    // Anemic if: Many properties but no business methods
    if (properties.length > 3 && businessMethods.length === 0) {
      pushFinding('backend.ddd.anemic_entity', 'high', sf, cls,
        `Anemic entity ${className} (${properties.length} properties, 0 business methods) - add domain logic.`,
        findings);
    }
  });
}

// =============================================================================
// PATTERN 5: Value Objects
// Must be immutable (readonly properties)
// =============================================================================
function analyzeValueObjects(sf, filePath, findings, pushFinding) {
  // Is it a Value Object?
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
// PATTERN 6: Domain Events
// Event classes should end with Event, emit from use cases
// =============================================================================
function analyzeDomainEvents(sf, filePath, findings, pushFinding) {
  const classes = sf.getClasses();
  
  classes.forEach(cls => {
    const className = cls.getName() || '';
    
    // Is it a Domain Event?
    if (/Event$/i.test(className)) {
      // Should be in application/events/
      if (!filePath.includes('/events/')) {
        pushFinding('backend.ddd.event_wrong_location', 'medium', sf, cls,
          `Domain Event ${className} should be in application/events/ directory.`,
          findings);
      }
      
      // Should be immutable (readonly properties)
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
  
  // NestJS conventions
  if (normalized.match(/\/(controllers|middleware|guards|interceptors)\//)) return 'presentation';
  if (normalized.match(/\/(entities|repositories|value-objects)\//)) return 'domain';
  if (normalized.match(/\/(use-cases|dtos|events)\//)) return 'application';
  if (normalized.match(/\/(database|config|external-services)\//)) return 'infrastructure';
  
  return null;
}

module.exports = {
  analyzeDDD
};

