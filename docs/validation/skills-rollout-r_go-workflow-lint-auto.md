# Consumer Workflow Lint Report

- generated_at: 2026-02-08T11:46:38.958Z
- repo_path: `/Users/juancarlosmerlosalbarracin/Developer/Projects/R_GO`
- actionlint_bin: `/tmp/actionlint-bin/actionlint`
- workflow_glob: `/Users/juancarlosmerlosalbarracin/Developer/Projects/R_GO/.github/workflows/*.{yml,yaml}`
- exit_code: 1

## Raw Output

```text
../R_GO/.github/workflows/ci-ios.yml:18:14: label "macos-13" is unknown. available labels are "windows-latest", "windows-latest-8-cores", "windows-2025", "windows-2022", "windows-11-arm", "ubuntu-slim", "ubuntu-latest", "ubuntu-latest-4-cores", "ubuntu-latest-8-cores", "ubuntu-latest-16-cores", "ubuntu-24.04", "ubuntu-24.04-arm", "ubuntu-22.04", "ubuntu-22.04-arm", "macos-latest", "macos-latest-xlarge", "macos-latest-large", "macos-26-xlarge", "macos-26", "macos-15-intel", "macos-15-xlarge", "macos-15-large", "macos-15", "macos-14-xlarge", "macos-14-large", "macos-14", "self-hosted", "x64", "arm", "arm64", "linux", "macos", "windows". if it is a custom label for self-hosted runner, set list of labels in actionlint.yaml config file [runner-label]
   |
18 |     runs-on: macos-13
   |              ^~~~~~~~
../R_GO/.github/workflows/lighthouse.yml:49:11: input "assertions" is not defined in action "treosh/lighthouse-ci-action@v12". available inputs are "artifactName", "basicAuthPassword", "basicAuthUsername", "budgetPath", "configPath", "runs", "serverBaseUrl", "serverToken", "temporaryPublicStorage", "uploadArtifacts", "uploadExtraArgs", "urls" [action]
   |
49 |           assertions: '{"categories:performance": ["error", {"minScore": 0.95}], "categories:accessibility": ["error", {"minScore": 0.95}], "categories:best-practices": ["error", {"minScore": 0.95}], "categories:seo": ["error", {"minScore": 0.95}]}'
   |           ^~~~~~~~~~~
../R_GO/.github/workflows/nightly-platform-smoke.yml:40:14: label "macos-13" is unknown. available labels are "windows-latest", "windows-latest-8-cores", "windows-2025", "windows-2022", "windows-11-arm", "ubuntu-slim", "ubuntu-latest", "ubuntu-latest-4-cores", "ubuntu-latest-8-cores", "ubuntu-latest-16-cores", "ubuntu-24.04", "ubuntu-24.04-arm", "ubuntu-22.04", "ubuntu-22.04-arm", "macos-latest", "macos-latest-xlarge", "macos-latest-large", "macos-26-xlarge", "macos-26", "macos-15-intel", "macos-15-xlarge", "macos-15-large", "macos-15", "macos-14-xlarge", "macos-14-large", "macos-14", "self-hosted", "x64", "arm", "arm64", "linux", "macos", "windows". if it is a custom label for self-hosted runner, set list of labels in actionlint.yaml config file [runner-label]
   |
40 |     runs-on: macos-13
   |              ^~~~~~~~
```

