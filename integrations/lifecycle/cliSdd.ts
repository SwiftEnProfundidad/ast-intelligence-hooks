import { writeInfo, withOptionalLocation } from './cliOutputs';
import {
  runSddAutoSync,
  runSddLearn,
  runSddSyncDocs,
  runSddEvidenceScaffold,
  runSddStateSync,
  readSddStatus,
  evaluateSddPolicy,
  openSddSession,
  refreshSddSession,
  closeSddSession,
} from '../sdd';
import { evaluateAiGate } from '../gate/evaluateAiGate';
import { readLifecyclePolicyValidationSnapshot } from './policyValidationSnapshot';
import { runOpenSpecBootstrap } from './openSpecBootstrap';
import { buildPreWriteAutomationTrace, type PreWriteAutomationTrace } from './preWriteAutomation';
import { runEnterpriseAiGateCheck } from '../mcp/aiGateCheck';
import {
  resolvePreWriteEnforcement,
  type PreWriteEnforcementResolution,
} from '../policy/preWriteEnforcement';
import { readLifecycleExperimentalFeaturesSnapshot } from './experimentalFeaturesSnapshot';

import {
  type ParsedArgs,
  type LifecycleCliDependencies,
  resolvePreWriteNextAction,
  resolvePreWriteBlockedRemediation,
  buildPreWriteValidationEnvelope,
  buildPreWriteValidationPanel,
  PRE_WRITE_OPENSPEC_AUTOREMEDIABLE_CODES,
  resolveAiGateViolationLocation,
  resolveSddDecisionLocation,
  type PreWriteOpenSpecBootstrapTrace,
  buildPreWriteExperimentalDisabledResult,
  buildSddExperimentalEnableAdvisoryCommand,
  runRawPreWriteAiGateCheck,
  PRE_WRITE_ENABLE_STRICT_COMMAND,
} from './cli';

export const runSddCommand = async (parsed: ParsedArgs, activeDependencies: LifecycleCliDependencies): Promise<number> => {
        if (parsed.sddCommand === 'status') {
          const sddStatus = readSddStatus();
          if (parsed.json) {
            writeInfo(JSON.stringify(sddStatus, null, 2));
          } else {
            writeInfo(`[pumuki][sdd] repo: ${sddStatus.repoRoot}`);
            writeInfo(
              `[pumuki][sdd] openspec: installed=${sddStatus.openspec.installed ? 'yes' : 'no'} version=${sddStatus.openspec.version ?? 'unknown'}`
            );
            writeInfo(
              `[pumuki][sdd] openspec compatibility: compatible=${sddStatus.openspec.compatible ? 'yes' : 'no'} minimum=${sddStatus.openspec.minimumVersion} recommended=${sddStatus.openspec.recommendedVersion} parsed=${sddStatus.openspec.parsedVersion ?? 'unknown'}`
            );
            writeInfo(
              `[pumuki][sdd] openspec project initialized: ${sddStatus.openspec.projectInitialized ? 'yes' : 'no'}`
            );
            writeInfo(
              `[pumuki][sdd] session: active=${sddStatus.session.active ? 'yes' : 'no'} valid=${sddStatus.session.valid ? 'yes' : 'no'} change=${sddStatus.session.changeId ?? 'none'}`
            );
            if (typeof sddStatus.session.remainingSeconds === 'number') {
              writeInfo(
                `[pumuki][sdd] session remaining seconds: ${sddStatus.session.remainingSeconds}`
              );
            }
          }
          return 0;
        }
        if (parsed.sddCommand === 'validate') {
          const requestedStage = parsed.sddStage ?? 'PRE_COMMIT';
          const preWriteEnforcement = requestedStage === 'PRE_WRITE'
            ? resolvePreWriteEnforcement()
            : {
              mode: 'strict',
              source: 'default',
              blocking: true,
              layer: 'experimental',
              activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE',
              legacyActivationVariable: 'PUMUKI_PREWRITE_ENFORCEMENT',
            } satisfies PreWriteEnforcementResolution;
          const policyValidation = readLifecyclePolicyValidationSnapshot(process.cwd());
          const experimentalFeatures = readLifecycleExperimentalFeaturesSnapshot();
          if (requestedStage === 'PRE_WRITE' && preWriteEnforcement.mode === 'off') {
            const disabledResult = buildPreWriteExperimentalDisabledResult({
              stage: requestedStage,
              status: readSddStatus(process.cwd()),
              source: preWriteEnforcement.source,
            });
            if (parsed.json) {
              writeInfo(
                JSON.stringify(
                  {
                    sdd: disabledResult,
                    pre_write_enforcement: preWriteEnforcement,
                    experimental_features: experimentalFeatures,
                    policy_validation: policyValidation,
                    automation: {
                      attempted: false,
                      actions: [],
                    },
                    bootstrap: {
                      enabled: false,
                      attempted: false,
                      status: 'SKIPPED',
                      actions: [],
                      details: 'PRE_WRITE experimental/default-off.',
                    },
                    next_action: {
                      reason: 'PRE_WRITE_EXPERIMENTAL_DISABLED',
                      command: PRE_WRITE_ENABLE_STRICT_COMMAND,
                    },
                  },
                  null,
                  2
                )
              );
            } else {
              writeInfo(
                `[pumuki][sdd] stage=${disabledResult.stage} allowed=yes code=${disabledResult.decision.code}`
              );
              writeInfo(
                withOptionalLocation(
                  `[pumuki][sdd] ${disabledResult.decision.message}`,
                  resolveSddDecisionLocation(disabledResult)
                )
              );
              writeInfo(
                `[pumuki][sdd] pre-write enforcement: mode=${preWriteEnforcement.mode} source=${preWriteEnforcement.source} blocking=no`
              );
              writeInfo(
                `[pumuki][sdd] next action (PRE_WRITE_EXPERIMENTAL_DISABLED): ${PRE_WRITE_ENABLE_STRICT_COMMAND}`
              );
            }
            return 0;
          }
          let result = evaluateSddPolicy({
            stage: requestedStage,
          });
          const preWriteAutoBootstrapEnabled = process.env.PUMUKI_PREWRITE_AUTO_BOOTSTRAP !== '0';
          const preWriteBootstrapTrace: PreWriteOpenSpecBootstrapTrace = {
            enabled: preWriteAutoBootstrapEnabled,
            attempted: false,
            status: 'SKIPPED',
            actions: [],
          };
          if (
            result.stage === 'PRE_WRITE'
            && !result.decision.allowed
            && PRE_WRITE_OPENSPEC_AUTOREMEDIABLE_CODES.has(result.decision.code)
          ) {
            if (preWriteAutoBootstrapEnabled) {
              preWriteBootstrapTrace.attempted = true;
              try {
                const bootstrap = runOpenSpecBootstrap({
                  repoRoot: process.cwd(),
                });
                preWriteBootstrapTrace.status = 'OK';
                preWriteBootstrapTrace.actions = [...bootstrap.actions];
                if (bootstrap.skippedReason) {
                  preWriteBootstrapTrace.details = `skipped=${bootstrap.skippedReason}`;
                }
              } catch (error) {
                preWriteBootstrapTrace.status = 'FAILED';
                preWriteBootstrapTrace.details = error instanceof Error
                  ? error.message
                  : 'Unknown OpenSpec bootstrap error';
              }
              result = evaluateSddPolicy({
                stage: requestedStage,
              });
            } else {
              preWriteBootstrapTrace.details =
                'auto bootstrap disabled via PUMUKI_PREWRITE_AUTO_BOOTSTRAP=0';
            }
          }
          const shouldEvaluateAiGate = result.stage === 'PRE_WRITE';
          let aiGate: ReturnType<typeof evaluateAiGate> | null = shouldEvaluateAiGate
            ? runEnterpriseAiGateCheck({
              repoRoot: process.cwd(),
              stage: result.stage,
              requireMcpReceipt: true,
            }).result
            : null;
          const automationTrace: PreWriteAutomationTrace = {
            attempted: false,
            actions: [],
          };
          if (result.stage === 'PRE_WRITE' && aiGate) {
            const auto = await buildPreWriteAutomationTrace({
              repoRoot: process.cwd(),
              sdd: result,
              aiGate,
              runPlatformGate: activeDependencies.runPlatformGate,
            });
            aiGate = auto.aiGate;
            automationTrace.attempted = auto.trace.attempted;
            automationTrace.actions = auto.trace.actions;
          }
          const rawPreWriteAiGate = result.stage === 'PRE_WRITE' && aiGate
            ? runRawPreWriteAiGateCheck({
              repoRoot: process.cwd(),
              requireMcpReceipt: true,
            })
            : null;
          const nextAction = resolvePreWriteNextAction({
            sdd: result,
            aiGate: rawPreWriteAiGate ?? aiGate,
          });
          const sddExperimentalNextAction =
            !aiGate && result.decision.code === 'SDD_EXPERIMENTAL_DISABLED'
              ? {
                reason: 'SDD_EXPERIMENTAL_DISABLED',
                command: buildSddExperimentalEnableAdvisoryCommand(result.stage),
              }
              : undefined;
          if (parsed.json) {
            writeInfo(
              JSON.stringify(
                (rawPreWriteAiGate ?? aiGate)
                  ? buildPreWriteValidationEnvelope(
                    result,
                    rawPreWriteAiGate ?? aiGate!,
                    preWriteEnforcement,
                    experimentalFeatures,
                    policyValidation,
                    automationTrace,
                    preWriteBootstrapTrace,
                    nextAction
                  )
                  : {
                    ...result,
                    experimental_features: experimentalFeatures,
                    policy_validation: policyValidation,
                    next_action: sddExperimentalNextAction,
                  },
                null,
                2
              )
            );
          } else {
            writeInfo(
              `[pumuki][sdd] stage=${result.stage} allowed=${result.decision.allowed ? 'yes' : 'no'} code=${result.decision.code}`
            );
            writeInfo(
              `[pumuki][sdd] policy-as-code: PRE_COMMIT=${policyValidation.stages.PRE_COMMIT.validationCode ?? 'n/a'} strict=${policyValidation.stages.PRE_COMMIT.strict ? 'yes' : 'no'} ` +
              `PRE_PUSH=${policyValidation.stages.PRE_PUSH.validationCode ?? 'n/a'} strict=${policyValidation.stages.PRE_PUSH.strict ? 'yes' : 'no'} ` +
              `CI=${policyValidation.stages.CI.validationCode ?? 'n/a'} strict=${policyValidation.stages.CI.strict ? 'yes' : 'no'}`
            );
            writeInfo(
              `[pumuki][sdd] experimental: SDD=${experimentalFeatures.features.sdd.mode} source=${experimentalFeatures.features.sdd.source} layer=${experimentalFeatures.features.sdd.layer} blocking=${experimentalFeatures.features.sdd.blocking ? 'yes' : 'no'} env=${experimentalFeatures.features.sdd.activationVariable}`
            );
            writeInfo(
              withOptionalLocation(
                `[pumuki][sdd] ${result.decision.message}`,
                resolveSddDecisionLocation(result)
              )
            );
            if (result.validation) {
              writeInfo(
                `[pumuki][sdd] validation: ok=${result.validation.ok ? 'yes' : 'no'} failed=${result.validation.totals.failed} errors=${result.validation.issues.errors}`
              );
            }
            if (result.stage === 'PRE_WRITE') {
              writeInfo(
                `[pumuki][sdd] openspec auto-bootstrap: enabled=${preWriteBootstrapTrace.enabled ? 'yes' : 'no'} attempted=${preWriteBootstrapTrace.attempted ? 'yes' : 'no'} status=${preWriteBootstrapTrace.status} actions=${preWriteBootstrapTrace.actions.join(',') || 'none'}`
              );
              writeInfo(
                `[pumuki][sdd] pre-write enforcement: mode=${preWriteEnforcement.mode} source=${preWriteEnforcement.source} blocking=${preWriteEnforcement.blocking ? 'yes' : 'no'}`
              );
              if (preWriteBootstrapTrace.details) {
                writeInfo(
                  `[pumuki][sdd] openspec auto-bootstrap details: ${preWriteBootstrapTrace.details}`
                );
              }
            }
            if (aiGate) {
              writeInfo(buildPreWriteValidationPanel({
                sdd: result,
                aiGate,
                automation: automationTrace,
              }));
              writeInfo(
                `[pumuki][ai-gate] stage=${aiGate.stage} status=${aiGate.status} violations=${aiGate.violations.length}`
              );
              for (const violation of aiGate.violations) {
                writeInfo(
                  withOptionalLocation(
                    `[pumuki][ai-gate] ${violation.code}: ${violation.message}`,
                    resolveAiGateViolationLocation(violation.code)
                  )
                );
              }
            }
            if (nextAction) {
              writeInfo(`[pumuki][sdd] next action (${nextAction.reason}): ${nextAction.command}`);
            }
            if (sddExperimentalNextAction) {
              writeInfo(
                `[pumuki][sdd] next action (${sddExperimentalNextAction.reason}): ${sddExperimentalNextAction.command}`
              );
            }
          }
          if (result.stage === 'PRE_WRITE' && aiGate) {
            activeDependencies.emitAuditSummaryNotificationFromAiGate({
              repoRoot: process.cwd(),
              stage: result.stage,
              aiGateResult: aiGate,
            });
          }
          if (!result.decision.allowed && preWriteEnforcement.blocking) {
            activeDependencies.emitGateBlockedNotification({
              repoRoot: process.cwd(),
              stage: result.stage,
              totalViolations: aiGate?.violations.length ?? 0,
              causeCode: result.decision.code,
              causeMessage: result.decision.message,
              remediation: resolvePreWriteBlockedRemediation({
                causeCode: result.decision.code,
                nextAction,
              }),
            });
            return 1;
          }
          if (aiGate && !aiGate.allowed && preWriteEnforcement.blocking) {
            const firstViolation = aiGate.violations[0];
            const causeCode = firstViolation?.code ?? 'AI_GATE_BLOCKED';
            const causeMessage = firstViolation?.message ?? 'AI gate blocked PRE_WRITE stage.';
            activeDependencies.emitGateBlockedNotification({
              repoRoot: process.cwd(),
              stage: result.stage,
              totalViolations: aiGate.violations.length,
              causeCode,
              causeMessage,
              remediation: resolvePreWriteBlockedRemediation({
                causeCode,
                nextAction,
              }),
            });
            return 1;
          }
          return 0;
        }
        if (parsed.sddCommand === 'session') {
          if (parsed.sddSessionAction === 'open') {
            const session = openSddSession({
              changeId: parsed.sddChangeId ?? '',
              ttlMinutes: parsed.sddTtlMinutes,
            });
            if (parsed.json) {
              writeInfo(JSON.stringify(session, null, 2));
            } else {
              writeInfo(
                `[pumuki][sdd] session opened: change=${session.changeId} ttlMinutes=${session.ttlMinutes ?? 'unknown'} valid=${session.valid ? 'yes' : 'no'}`
              );
            }
            return 0;
          }
          if (parsed.sddSessionAction === 'refresh') {
            const session = refreshSddSession({
              ttlMinutes: parsed.sddTtlMinutes,
            });
            if (parsed.json) {
              writeInfo(JSON.stringify(session, null, 2));
            } else {
              writeInfo(
                `[pumuki][sdd] session refreshed: change=${session.changeId ?? 'none'} ttlMinutes=${session.ttlMinutes ?? 'unknown'} valid=${session.valid ? 'yes' : 'no'}`
              );
            }
            return 0;
          }
          const session = closeSddSession();
          if (parsed.json) {
            writeInfo(JSON.stringify(session, null, 2));
          } else {
            writeInfo('[pumuki][sdd] session closed');
          }
          return 0;
        }
        if (parsed.sddCommand === 'sync-docs') {
          const syncResult = runSddSyncDocs({
            repoRoot: process.cwd(),
            dryRun: parsed.sddSyncDocsDryRun === true,
            change: parsed.sddSyncDocsChange,
            stage: parsed.sddSyncDocsStage,
            task: parsed.sddSyncDocsTask,
            fromEvidencePath: parsed.sddSyncDocsFromEvidence,
          });
          if (parsed.json) {
            writeInfo(JSON.stringify(syncResult, null, 2));
          } else {
            writeInfo(
              `[pumuki][sdd] sync-docs dry_run=${syncResult.dryRun ? 'yes' : 'no'} updated=${syncResult.updated ? 'yes' : 'no'} files=${syncResult.files.length} change=${syncResult.context.change ?? 'none'} stage=${syncResult.context.stage ?? 'none'} task=${syncResult.context.task ?? 'none'} from_evidence=${syncResult.context.fromEvidencePath ?? 'default'}`
            );
            for (const file of syncResult.files) {
              writeInfo(
                `[pumuki][sdd] file=${file.path} updated=${file.updated ? 'yes' : 'no'} before=${file.beforeDigest} after=${file.afterDigest}`
              );
              if (file.updated) {
                writeInfo(file.diffMarkdown);
              }
            }
          }
          return 0;
        }
        if (parsed.sddCommand === 'learn') {
          const learnResult = runSddLearn({
            repoRoot: process.cwd(),
            dryRun: parsed.sddLearnDryRun === true,
            change: parsed.sddLearnChange,
            stage: parsed.sddLearnStage,
            task: parsed.sddLearnTask,
            fromEvidencePath: parsed.sddLearnFromEvidence,
          });
          if (parsed.json) {
            writeInfo(JSON.stringify(learnResult, null, 2));
          } else {
            writeInfo(
              `[pumuki][sdd] learn dry_run=${learnResult.dryRun ? 'yes' : 'no'} change=${learnResult.context.change} stage=${learnResult.context.stage ?? 'none'} task=${learnResult.context.task ?? 'none'} from_evidence=${learnResult.context.fromEvidencePath ?? 'default'} written=${learnResult.learning.written ? 'yes' : 'no'} digest=${learnResult.learning.digest}`
            );
            writeInfo(
              `[pumuki][sdd] learning_path=${learnResult.learning.path} failed=${learnResult.learning.artifact.failed_patterns.length} successful=${learnResult.learning.artifact.successful_patterns.length} anomalies=${learnResult.learning.artifact.gate_anomalies.length} updates=${learnResult.learning.artifact.rule_updates.length}`
            );
          }
          return 0;
        }
        if (parsed.sddCommand === 'auto-sync') {
          const autoSyncResult = runSddAutoSync({
            repoRoot: process.cwd(),
            dryRun: parsed.sddAutoSyncDryRun === true,
            change: parsed.sddAutoSyncChange,
            stage: parsed.sddAutoSyncStage,
            task: parsed.sddAutoSyncTask,
            fromEvidencePath: parsed.sddAutoSyncFromEvidence,
          });
          if (parsed.json) {
            writeInfo(JSON.stringify(autoSyncResult, null, 2));
          } else {
            writeInfo(
              `[pumuki][sdd] auto-sync dry_run=${autoSyncResult.dryRun ? 'yes' : 'no'} change=${autoSyncResult.context.change} stage=${autoSyncResult.context.stage ?? 'none'} task=${autoSyncResult.context.task ?? 'none'} from_evidence=${autoSyncResult.context.fromEvidencePath ?? 'default'} updated=${autoSyncResult.syncDocs.updated ? 'yes' : 'no'} files=${autoSyncResult.syncDocs.files.length} learning_written=${autoSyncResult.learning.written ? 'yes' : 'no'}`
            );
            writeInfo(
              `[pumuki][sdd] learning_path=${autoSyncResult.learning.path} digest=${autoSyncResult.learning.digest}`
            );
            for (const file of autoSyncResult.syncDocs.files) {
              writeInfo(
                `[pumuki][sdd] file=${file.path} updated=${file.updated ? 'yes' : 'no'} before=${file.beforeDigest} after=${file.afterDigest}`
              );
            }
          }
          return 0;
        }
        if (parsed.sddCommand === 'evidence') {
          const evidenceResult = runSddEvidenceScaffold({
            repoRoot: process.cwd(),
            dryRun: parsed.sddEvidenceDryRun === true,
            scenarioId: parsed.sddEvidenceScenarioId,
            testCommand: parsed.sddEvidenceTestCommand,
            testStatus: parsed.sddEvidenceTestStatus,
            testOutputPath: parsed.sddEvidenceTestOutput,
            fromEvidencePath: parsed.sddEvidenceFromEvidence,
          });
          if (parsed.json) {
            writeInfo(JSON.stringify(evidenceResult, null, 2));
          } else {
            writeInfo(
              `[pumuki][sdd] evidence dry_run=${evidenceResult.dryRun ? 'yes' : 'no'} scenario=${evidenceResult.context.scenarioId} status=${evidenceResult.context.testStatus} output=${evidenceResult.output.path} written=${evidenceResult.output.written ? 'yes' : 'no'}`
            );
            writeInfo(
              `[pumuki][sdd] test_command=${evidenceResult.context.testCommand} test_output=${evidenceResult.context.testOutputPath ?? 'none'} from_evidence=${evidenceResult.context.fromEvidencePath ?? 'default'}`
            );
            writeInfo(
              `[pumuki][sdd] source_digest=${evidenceResult.artifact.ai_evidence.digest} generated_at=${evidenceResult.artifact.generated_at}`
            );
          }
          return 0;
        }
        if (parsed.sddCommand === 'state-sync') {
          const stateSyncResult = runSddStateSync({
            repoRoot: process.cwd(),
            dryRun: parsed.sddStateSyncDryRun === true,
            scenarioId: parsed.sddStateSyncScenarioId,
            status: parsed.sddStateSyncStatus,
            fromEvidencePath: parsed.sddStateSyncFromEvidence,
            boardPath: parsed.sddStateSyncBoardPath,
            force: parsed.sddStateSyncForce === true,
          });
          if (parsed.json) {
            writeInfo(JSON.stringify(stateSyncResult, null, 2));
          } else {
            writeInfo(
              `[pumuki][sdd] state-sync dry_run=${stateSyncResult.dryRun ? 'yes' : 'no'} scenario=${stateSyncResult.context.scenarioId} status=${stateSyncResult.context.desiredStatus} updated=${stateSyncResult.board.updated ? 'yes' : 'no'} conflict=${stateSyncResult.board.conflict ? 'yes' : 'no'} written=${stateSyncResult.board.written ? 'yes' : 'no'}`
            );
            writeInfo(
              `[pumuki][sdd] state-sync source=${stateSyncResult.context.fromEvidencePath ?? 'default'} board=${stateSyncResult.context.boardPath} entries=${stateSyncResult.board.entries} decision=${stateSyncResult.decision.code}`
            );
            if (stateSyncResult.decision.nextAction) {
              writeInfo(`[pumuki][sdd] state-sync next action: ${stateSyncResult.decision.nextAction}`);
            }
          }
          if (!stateSyncResult.decision.allowed) {
            return 1;
          }
          return 0;
        }
        return 0;
};
