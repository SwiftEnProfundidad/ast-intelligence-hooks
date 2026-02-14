# Example: CI/CD Integration

This example shows how to integrate `ast-intelligence-hooks` into different CI/CD systems.

## GitHub Actions

See [.github/workflows/ast-analysis.yml](./.github/workflows/ast-analysis.yml) for complete example.

### Features

- ✅ Analysis on multiple Node.js versions
- ✅ Upload reports as artifacts
- ✅ Automatic comments on PRs
- ✅ Fails if there are critical violations

### Usage

1. Copy `.github/workflows/ast-analysis.yml` to your project
2. Adjust triggers according to your needs
3. Customize failure thresholds

## GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test

ast_analysis:
  stage: test
  image: node:20
  
  before_script:
    - npm ci
    - npm install --save-dev pumuki-ast-hooks
  
  script:
    - npm run audit || true
    - npm run violations:summary > violations-summary.txt || true
  
  artifacts:
    when: always
    paths:
      - .audit-reports/
      - violations-summary.txt
    expire_in: 7 days
  
  only:
    - merge_requests
    - main
    - develop
```

## Jenkins Pipeline

Create `Jenkinsfile`:

```groovy
pipeline {
  agent any
  
  stages {
    stage('AST Analysis') {
      steps {
        sh 'npm ci'
        sh 'npm install --save-dev pumuki-ast-hooks'
        sh 'npm run audit || true'
        sh 'npm run violations:summary > violations-summary.txt || true'
      }
    }
  }
  
  post {
    always {
      archiveArtifacts artifacts: '.audit-reports/**', fingerprint: true
      archiveArtifacts artifacts: 'violations-summary.txt', fingerprint: true
      
      publishHTML([
        reportDir: '.audit-reports',
        reportFiles: 'report.html',
        reportName: 'AST Analysis Report',
        keepAll: true
      ])
    }
    
    failure {
      emailext(
        subject: "AST Analysis Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: "Critical violations found. Check the report.",
        to: "${env.CHANGE_AUTHOR_EMAIL}"
      )
    }
  }
}
```

## CircleCI

Create `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  ast-analysis:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
      - run:
          name: Install dependencies
          command: npm ci
      - run:
          name: Install AST Intelligence Hooks
          command: npm install --save-dev pumuki-ast-hooks
      - run:
          name: Run AST Analysis
          command: npm run audit || true
      - run:
          name: Generate summary
          command: npm run violations:summary > violations-summary.txt || true
      - store_artifacts:
          path: .audit-reports
          destination: ast-reports
      - store_artifacts:
          path: violations-summary.txt
          destination: ast-summary

workflows:
  version: 2
  test:
    jobs:
      - ast-analysis
```

## Azure DevOps

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
  
  - script: npm ci
    displayName: 'Install dependencies'
  
  - script: npm install --save-dev pumuki-ast-hooks
    displayName: 'Install AST Intelligence Hooks'
  
  - script: npm run audit || true
    displayName: 'Run AST Analysis'
    continueOnError: true
  
  - script: npm run violations:summary > violations-summary.txt || true
    displayName: 'Generate summary'
    continueOnError: true
  
  - task: PublishBuildArtifacts@1
    inputs:
      pathToPublish: '.audit-reports'
      artifactName: 'ast-reports'
      condition: always()
```

## Recommendations

1. **Run on PRs**: Validate code before merging
2. **Artifacts**: Save reports for later review
3. **Notifications**: Notify only if there are critical violations
4. **Thresholds**: Configure appropriate thresholds for your project
5. **Caching**: Use npm cache for faster builds

## Customization

You can customize the behavior according to your needs:

```yaml
# GitHub Actions - Only fail if there are more than 5 critical
- name: Fail on critical violations
  run: |
    CRITICAL=$(npm run violations:summary | grep -oP 'CRITICAL: \K\d+' || echo "0")
    if [ "$CRITICAL" -gt "5" ]; then
      exit 1
    fi
```
