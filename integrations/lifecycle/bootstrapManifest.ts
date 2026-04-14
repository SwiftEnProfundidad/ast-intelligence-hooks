import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { getPumukiHooksStatus, resolvePumukiHooksDirectory } from './hookManager'
import { LifecycleGitService, type ILifecycleGitService } from './gitService'
import {
  readGovernanceObservationSnapshot,
  type GovernanceContractSurface,
  type GovernanceObservationSnapshot,
} from './governanceObservationSnapshot'
import { readGovernanceNextAction, type GovernanceNextActionSummary } from './governanceNextAction'
import { getCurrentPumukiPackageName, getCurrentPumukiVersion } from './packageInfo'
import { readLifecycleExperimentalFeaturesSnapshot } from './experimentalFeaturesSnapshot'
import { readLifecyclePolicyValidationSnapshot } from './policyValidationSnapshot'
import { readLifecycleState } from './state'

export const BOOTSTRAP_MANIFEST_RELATIVE_PATH = '.pumuki/bootstrap-manifest.json'

type AdapterCommandContract = {
  path: string
  present: boolean
  hooks: {
    pre_write?: string
    pre_commit?: string
    pre_push?: string
    ci?: string
  }
  mcp: {
    enterprise?: string
    evidence?: string
  }
}

export type LifecycleBootstrapManifest = {
  schema_version: '1'
  repo_root: string
  package: {
    name: string
    version: string
  }
  lifecycle: {
    installed: boolean
    version: string | null
    installed_at: string | null
    managed_hooks: ReadonlyArray<string>
    openspec_managed_artifacts: ReadonlyArray<string>
  }
  hooks_directory: {
    path: string
    source: 'git-rev-parse' | 'git-config' | 'default'
  }
  hook_status: Record<string, { managed_block_present: boolean; exists: boolean }>
  contract_surface: GovernanceContractSurface
  governance: {
    effective: GovernanceObservationSnapshot['governance_effective']
    attention_codes: ReadonlyArray<string>
    next_action: GovernanceNextActionSummary
    bootstrap_hints: ReadonlyArray<string>
  }
  sdd: {
    effective_mode: GovernanceObservationSnapshot['sdd']['effective_mode']
    experimental_source: string
    session_active: boolean
    session_valid: boolean
    change_id: string | null
  }
  policy_strict: GovernanceObservationSnapshot['policy_strict']
  git: GovernanceObservationSnapshot['git']
  adapter: AdapterCommandContract
}

export type LifecycleBootstrapManifestWriteResult = {
  path: string
  changed: boolean
  manifest: LifecycleBootstrapManifest
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readOptionalCommand = (source: unknown): string | undefined => {
  if (!isRecord(source)) {
    return undefined
  }
  const command = source.command
  return typeof command === 'string' && command.trim().length > 0 ? command.trim() : undefined
}

const readAdapterCommandContract = (repoRoot: string): AdapterCommandContract => {
  const path = join(repoRoot, '.pumuki', 'adapter.json')
  if (!existsSync(path)) {
    return {
      path: BOOTSTRAP_MANIFEST_RELATIVE_PATH.replace('bootstrap-manifest.json', 'adapter.json'),
      present: false,
      hooks: {},
      mcp: {},
    }
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown
    const hooks = isRecord(parsed) && isRecord(parsed.hooks) ? parsed.hooks : {}
    const mcp = isRecord(parsed) && isRecord(parsed.mcp) ? parsed.mcp : {}
    return {
      path: '.pumuki/adapter.json',
      present: true,
      hooks: {
        pre_write: readOptionalCommand(isRecord(hooks) ? hooks.pre_write : undefined),
        pre_commit: readOptionalCommand(isRecord(hooks) ? hooks.pre_commit : undefined),
        pre_push: readOptionalCommand(isRecord(hooks) ? hooks.pre_push : undefined),
        ci: readOptionalCommand(isRecord(hooks) ? hooks.ci : undefined),
      },
      mcp: {
        enterprise: readOptionalCommand(isRecord(mcp) ? mcp.enterprise : undefined),
        evidence: readOptionalCommand(isRecord(mcp) ? mcp.evidence : undefined),
      },
    }
  } catch {
    return {
      path: '.pumuki/adapter.json',
      present: false,
      hooks: {},
      mcp: {},
    }
  }
}

const parseManagedHooks = (raw?: string): string[] => {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return []
  }
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

const parseManagedArtifacts = (raw?: string): string[] => {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return []
  }
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

const toHookStatusSummary = (
  hookStatus: ReturnType<typeof getPumukiHooksStatus>
): Record<string, { managed_block_present: boolean; exists: boolean }> =>
  Object.fromEntries(
    Object.entries(hookStatus).map(([hook, entry]) => [
      hook,
      {
        managed_block_present: entry.managedBlockPresent,
        exists: entry.exists,
      },
    ])
  )

export const buildLifecycleBootstrapManifest = (params: {
  repoRoot: string
  git?: ILifecycleGitService
}): LifecycleBootstrapManifest => {
  const git = params.git ?? new LifecycleGitService()
  const repoRoot = git.resolveRepoRoot(params.repoRoot)
  const lifecycleState = readLifecycleState(git, repoRoot)
  const experimentalFeatures = readLifecycleExperimentalFeaturesSnapshot()
  const policyValidation = readLifecyclePolicyValidationSnapshot(repoRoot)
  const governanceObservation = readGovernanceObservationSnapshot({
    repoRoot,
    experimentalFeatures,
    policyValidation,
    git,
  })
  const governanceNextAction = readGovernanceNextAction({
    repoRoot,
    stage: 'PRE_WRITE',
    governanceObservation,
  })
  const hooksDirectory = resolvePumukiHooksDirectory(repoRoot)
  const hookStatus = getPumukiHooksStatus(repoRoot)
  const adapter = readAdapterCommandContract(repoRoot)

  return {
    schema_version: '1',
    repo_root: repoRoot,
    package: {
      name: getCurrentPumukiPackageName(),
      version: getCurrentPumukiVersion({ repoRoot }),
    },
    lifecycle: {
      installed: lifecycleState.installed === 'true',
      version: typeof lifecycleState.version === 'string' && lifecycleState.version.length > 0
        ? lifecycleState.version
        : null,
      installed_at:
        typeof lifecycleState.installedAt === 'string' && lifecycleState.installedAt.length > 0
          ? lifecycleState.installedAt
          : null,
      managed_hooks: parseManagedHooks(lifecycleState.hooks),
      openspec_managed_artifacts: parseManagedArtifacts(lifecycleState.openSpecManagedArtifacts),
    },
    hooks_directory: hooksDirectory,
    hook_status: toHookStatusSummary(hookStatus),
    contract_surface: governanceObservation.contract_surface,
    governance: {
      effective: governanceObservation.governance_effective,
      attention_codes: governanceObservation.attention_codes,
      next_action: governanceNextAction,
      bootstrap_hints: governanceObservation.agent_bootstrap_hints,
    },
    sdd: {
      effective_mode: governanceObservation.sdd.effective_mode,
      experimental_source: governanceObservation.sdd.experimental_source,
      session_active: governanceObservation.sdd_session.active,
      session_valid: governanceObservation.sdd_session.valid,
      change_id: governanceObservation.sdd_session.change_id,
    },
    policy_strict: governanceObservation.policy_strict,
    git: governanceObservation.git,
    adapter,
  }
}

const serializeManifest = (manifest: LifecycleBootstrapManifest): string =>
  `${JSON.stringify(manifest, null, 2)}\n`

export const writeLifecycleBootstrapManifest = (params: {
  repoRoot: string
  git?: ILifecycleGitService
}): LifecycleBootstrapManifestWriteResult => {
  const git = params.git ?? new LifecycleGitService()
  const repoRoot = git.resolveRepoRoot(params.repoRoot)
  const path = join(repoRoot, BOOTSTRAP_MANIFEST_RELATIVE_PATH)
  const manifest = buildLifecycleBootstrapManifest({ repoRoot, git })
  const nextContents = serializeManifest(manifest)
  const currentContents = existsSync(path) ? readFileSync(path, 'utf8') : ''
  const changed = currentContents !== nextContents
  if (changed) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, nextContents, 'utf8')
  }
  return {
    path,
    changed,
    manifest,
  }
}
