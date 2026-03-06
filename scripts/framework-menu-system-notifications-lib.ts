import { execFileSync as runBinarySync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export type PumukiNotificationStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' | 'PRE_WRITE';

export type PumukiCriticalNotificationEvent =
  | {
      kind: 'audit.summary';
      totalViolations: number;
      criticalViolations: number;
      highViolations: number;
    }
  | {
      kind: 'gate.blocked';
      stage: PumukiNotificationStage;
      totalViolations: number;
      causeCode?: string;
      causeMessage?: string;
      remediation?: string;
    }
  | {
      kind: 'evidence.stale';
      evidencePath: string;
      ageMinutes: number;
    }
  | {
      kind: 'gitflow.violation';
      currentBranch: string;
      reason: string;
    };

export type SystemNotificationPayload = {
  title: string;
  message: string;
  subtitle?: string;
  soundName?: string;
};

export type SystemNotificationsConfig = {
  enabled: boolean;
  channel: 'macos';
  muteUntil?: string;
  blockedDialogEnabled?: boolean;
};

export type SystemNotificationEmitResult =
  | { delivered: true; reason: 'delivered' }
  | { delivered: false; reason: 'disabled' | 'muted' | 'unsupported-platform' | 'command-failed' };

type SystemNotificationCommandRunner = (
  command: string,
  args: ReadonlyArray<string>
) => number;

type SystemNotificationCommandRunnerWithOutput = (
  command: string,
  args: ReadonlyArray<string>
) => {
  exitCode: number;
  stdout: string;
};

const SYSTEM_NOTIFICATIONS_CONFIG_PATH = '.pumuki/system-notifications.json';
const SWIFT_BLOCKED_DIALOG_SCRIPT_RELATIVE_PATH = '.pumuki/runtime/pumuki-blocked-dialog.swift';
const BLOCKED_DIALOG_KEEP = 'Mantener activas';
const BLOCKED_DIALOG_MUTE_30 = 'Silenciar 30 min';
const BLOCKED_DIALOG_DISABLE = 'Desactivar';
const BLOCKED_DIALOG_TIMEOUT_SECONDS = 15;

type BlockedDialogMode = 'auto' | 'applescript' | 'swift-floating';

const SWIFT_BLOCKED_DIALOG_SOURCE = String.raw`import AppKit
import Foundation

struct DialogConfig {
  let title: String
  let cause: String
  let remediation: String
  let disableButton: String
  let muteButton: String
  let keepButton: String
  let timeoutSeconds: Double
}

func parseArguments() -> DialogConfig {
  let args = CommandLine.arguments
  func read(_ key: String, fallback: String) -> String {
    guard let index = args.firstIndex(of: key), index + 1 < args.count else {
      return fallback
    }
    return args[index + 1]
  }
  let timeoutRaw = read("--timeout-seconds", fallback: "15")
  let timeout = Double(timeoutRaw) ?? 15
  return DialogConfig(
    title: read("--title", fallback: "Pumuki bloqueado"),
    cause: read("--cause", fallback: "Bloqueo detectado."),
    remediation: read("--remediation", fallback: "Corrige el bloqueo y vuelve a ejecutar."),
    disableButton: read("--disable-button", fallback: "Desactivar"),
    muteButton: read("--mute-button", fallback: "Silenciar 30 min"),
    keepButton: read("--keep-button", fallback: "Mantener activas"),
    timeoutSeconds: max(5, timeout)
  )
}

final class DialogController: NSObject, NSApplicationDelegate {
  private let config: DialogConfig
  private var window: NSWindow?
  private var chosenButton: String?

  private func preferredWidth() -> CGFloat {
    let longest = max(config.title.count, max(config.cause.count, config.remediation.count))
    let estimated = CGFloat(longest) * 4.9 + 170
    let visibleFrame = targetVisibleFrame()
    let maxAllowed = max(360, visibleFrame.width - 40)
    return min(max(360, estimated), min(620, maxAllowed))
  }

  private func targetVisibleFrame() -> NSRect {
    let mouse = NSEvent.mouseLocation
    if let screen = NSScreen.screens.first(where: { NSMouseInRect(mouse, $0.frame, false) }) {
      return screen.visibleFrame
    }
    if let main = NSScreen.main {
      return main.visibleFrame
    }
    if let first = NSScreen.screens.first {
      return first.visibleFrame
    }
    return NSRect(x: 0, y: 0, width: 1440, height: 900)
  }

  private func pinWindowToBottomRight() {
    guard let panel = window else {
      return
    }
    let width = panel.frame.width
    let height = panel.frame.height
    let margin: CGFloat = 20
    let visibleFrame = targetVisibleFrame()
    let target = NSRect(
      x: visibleFrame.maxX - width - margin,
      y: visibleFrame.minY + margin,
      width: width,
      height: height
    )
    panel.setFrame(target, display: true)
  }

  private func resizeWindowToContent(root: NSStackView, contentView: NSView) {
    guard let panel = window else {
      return
    }
    contentView.layoutSubtreeIfNeeded()
    let fitting = root.fittingSize
    let visibleFrame = targetVisibleFrame()
    let width = min(max(panel.frame.width, fitting.width + 30), min(620, visibleFrame.width - 40))
    let height = min(max(140, fitting.height + 30), max(180, visibleFrame.height - 40))
    panel.setContentSize(NSSize(width: width, height: height))
  }

  init(config: DialogConfig) {
    self.config = config
    super.init()
  }

  func applicationDidFinishLaunching(_ notification: Notification) {
    showWindow()
    startTimeout()
  }

  private func showWindow() {
    let width = preferredWidth()
    let height: CGFloat = 170
    let margin: CGFloat = 20
    let screenFrame = targetVisibleFrame()
    let origin = NSPoint(
      x: screenFrame.maxX - width - margin,
      y: screenFrame.minY + margin
    )

    let panel = NSPanel(
      contentRect: NSRect(x: origin.x, y: origin.y, width: width, height: height),
      styleMask: [.titled, .closable, .fullSizeContentView],
      backing: .buffered,
      defer: false
    )
    panel.level = .floating
    panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
    panel.titleVisibility = .hidden
    panel.titlebarAppearsTransparent = true
    panel.isMovable = true
    panel.isReleasedWhenClosed = false
    panel.standardWindowButton(.zoomButton)?.isHidden = true
    panel.standardWindowButton(.miniaturizeButton)?.isHidden = true

    let root = NSStackView()
    root.orientation = .vertical
    root.alignment = .leading
    root.spacing = 12
    root.translatesAutoresizingMaskIntoConstraints = false

    let titleField = NSTextField(labelWithString: config.title)
    titleField.font = NSFont.boldSystemFont(ofSize: 15)
    titleField.lineBreakMode = .byWordWrapping
    titleField.maximumNumberOfLines = 0
    titleField.preferredMaxLayoutWidth = width - 48
    titleField.cell?.lineBreakMode = .byWordWrapping
    titleField.cell?.usesSingleLineMode = false
    titleField.cell?.wraps = true

    let causeField = NSTextField(wrappingLabelWithString: "Causa: \(config.cause)")
    causeField.font = NSFont.systemFont(ofSize: 12)
    causeField.lineBreakMode = .byWordWrapping
    causeField.maximumNumberOfLines = 0
    causeField.preferredMaxLayoutWidth = width - 48
    causeField.cell?.lineBreakMode = .byWordWrapping
    causeField.cell?.usesSingleLineMode = false
    causeField.cell?.wraps = true

    let remediationField = NSTextField(wrappingLabelWithString: "Solución: \(config.remediation)")
    remediationField.font = NSFont.systemFont(ofSize: 12)
    remediationField.lineBreakMode = .byWordWrapping
    remediationField.maximumNumberOfLines = 0
    remediationField.preferredMaxLayoutWidth = width - 48
    remediationField.cell?.lineBreakMode = .byWordWrapping
    remediationField.cell?.usesSingleLineMode = false
    remediationField.cell?.wraps = true

    let buttons = NSStackView()
    buttons.orientation = .horizontal
    buttons.alignment = .centerY
    buttons.spacing = 10

    let disableButton = NSButton(title: config.disableButton, target: self, action: #selector(disablePressed))
    disableButton.bezelStyle = .rounded
    let muteButton = NSButton(title: config.muteButton, target: self, action: #selector(mutePressed))
    muteButton.bezelStyle = .rounded
    let keepButton = NSButton(title: config.keepButton, target: self, action: #selector(keepPressed))
    keepButton.bezelStyle = .rounded
    keepButton.keyEquivalent = "\r"

    buttons.addArrangedSubview(disableButton)
    buttons.addArrangedSubview(muteButton)
    buttons.addArrangedSubview(keepButton)

    root.addArrangedSubview(titleField)
    root.addArrangedSubview(causeField)
    root.addArrangedSubview(remediationField)
    root.addArrangedSubview(buttons)

    panel.contentView = NSView()
    guard let contentView = panel.contentView else {
      finish(with: config.keepButton)
      return
    }
    contentView.addSubview(root)
    NSLayoutConstraint.activate([
      root.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 18),
      root.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -18),
      root.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 18),
      root.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -18),
    ])

    self.window = panel
    resizeWindowToContent(root: root, contentView: contentView)
    pinWindowToBottomRight()
    panel.orderFrontRegardless()
    NSApp.activate(ignoringOtherApps: true)
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
      guard let self else {
        return
      }
      self.resizeWindowToContent(root: root, contentView: contentView)
      self.pinWindowToBottomRight()
    }
  }

  private func startTimeout() {
    Timer.scheduledTimer(withTimeInterval: config.timeoutSeconds, repeats: false) { [weak self] _ in
      self?.finish(with: self?.config.keepButton ?? "Mantener activas")
    }
  }

  @objc private func disablePressed() {
    finish(with: config.disableButton)
  }

  @objc private func mutePressed() {
    finish(with: config.muteButton)
  }

  @objc private func keepPressed() {
    finish(with: config.keepButton)
  }

  private func finish(with button: String) {
    guard chosenButton == nil else {
      return
    }
    chosenButton = button
    FileHandle.standardOutput.write(Data("button returned:\(button)\n".utf8))
    NSApp.terminate(nil)
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    true
  }
}

let config = parseArguments()
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let controller = DialogController(config: config)
app.delegate = controller
app.run()
`;

const escapeAppleScriptString = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ').trim();

const buildDisplayNotificationScript = (payload: SystemNotificationPayload): string => {
  const title = escapeAppleScriptString(payload.title);
  const message = escapeAppleScriptString(payload.message);
  const subtitleFragment = payload.subtitle
    ? ` subtitle "${escapeAppleScriptString(payload.subtitle)}"`
    : '';
  const soundFragment = payload.soundName
    ? ` sound name "${escapeAppleScriptString(payload.soundName)}"`
    : '';
  return `display notification "${message}" with title "${title}"${subtitleFragment}${soundFragment}`;
};

const buildDisplayDialogScript = (params: {
  title: string;
  cause: string;
  remediation: string;
}): string => {
  const title = escapeAppleScriptString(params.title);
  const cause = escapeAppleScriptString(params.cause);
  const remediation = escapeAppleScriptString(params.remediation);
  const message = escapeAppleScriptString(`Causa: ${cause}\n\nSolución: ${remediation}`);
  return `display dialog "${message}" with title "${title}" buttons {"${BLOCKED_DIALOG_DISABLE}", "${BLOCKED_DIALOG_MUTE_30}", "${BLOCKED_DIALOG_KEEP}"} default button "${BLOCKED_DIALOG_KEEP}" with icon stop giving up after 15`;
};

const normalizeNotificationText = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const truncateNotificationText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
};

const isTruthyFlag = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

const resolveProjectLabel = (params: {
  repoRoot?: string;
  projectLabel?: string;
}): string | null => {
  const explicit = params.projectLabel
    ? normalizeNotificationText(params.projectLabel)
    : '';
  if (explicit.length > 0) {
    return truncateNotificationText(explicit, 28);
  }
  if (!params.repoRoot) {
    return null;
  }
  const inferred = normalizeNotificationText(basename(params.repoRoot));
  if (inferred.length === 0) {
    return null;
  }
  return truncateNotificationText(inferred, 28);
};

const resolveBlockedDialogEnabled = (params: {
  env: NodeJS.ProcessEnv;
  config: SystemNotificationsConfig;
}): boolean => {
  const raw = params.env.PUMUKI_MACOS_BLOCKED_DIALOG;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return isTruthyFlag(raw);
  }
  return params.config.blockedDialogEnabled !== false;
};

const resolveBlockedDialogMode = (env: NodeJS.ProcessEnv): BlockedDialogMode => {
  const raw = env.PUMUKI_MACOS_BLOCKED_DIALOG_MODE?.trim().toLowerCase();
  if (raw === 'applescript' || raw === 'swift-floating') {
    return raw;
  }
  return 'auto';
};

const resolveSwiftBlockedDialogScriptPath = (repoRoot: string): string => {
  const scriptPath = join(repoRoot, SWIFT_BLOCKED_DIALOG_SCRIPT_RELATIVE_PATH);
  mkdirSync(dirname(scriptPath), { recursive: true });
  if (!existsSync(scriptPath) || readFileSync(scriptPath, 'utf8') !== `${SWIFT_BLOCKED_DIALOG_SOURCE}\n`) {
    writeFileSync(scriptPath, `${SWIFT_BLOCKED_DIALOG_SOURCE}\n`, 'utf8');
  }
  return scriptPath;
};

const buildSwiftFloatingDialogArgs = (params: {
  scriptPath: string;
  title: string;
  cause: string;
  remediation: string;
}): ReadonlyArray<string> => [
  params.scriptPath,
  '--title',
  params.title,
  '--cause',
  params.cause,
  '--remediation',
  params.remediation,
  '--disable-button',
  BLOCKED_DIALOG_DISABLE,
  '--mute-button',
  BLOCKED_DIALOG_MUTE_30,
  '--keep-button',
  BLOCKED_DIALOG_KEEP,
  '--timeout-seconds',
  String(BLOCKED_DIALOG_TIMEOUT_SECONDS),
];

const BLOCKED_CAUSE_SUMMARY_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Falta evidencia para validar este paso.',
  EVIDENCE_INVALID: 'La evidencia actual es inválida.',
  EVIDENCE_CHAIN_INVALID: 'La cadena de evidencia no es válida.',
  EVIDENCE_STALE: 'La evidencia está desactualizada.',
  EVIDENCE_BRANCH_MISMATCH: 'La evidencia no corresponde con la rama actual.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'La evidencia no corresponde con este repositorio.',
  PRE_PUSH_UPSTREAM_MISSING: 'La rama no tiene upstream configurado.',
  GITFLOW_PROTECTED_BRANCH: 'No se permiten cambios directos en esta rama protegida.',
  SDD_SESSION_MISSING: 'No hay sesión SDD activa.',
  SDD_SESSION_INVALID: 'La sesión SDD actual no es válida.',
  OPENSPEC_MISSING: 'OpenSpec no está instalado en este repositorio.',
  MCP_ENTERPRISE_RECEIPT_MISSING: 'Falta el recibo enterprise de MCP.',
  BACKEND_AVOID_EXPLICIT_ANY: 'Se detectó uso de "any" explícito en backend.',
};

const BLOCKED_REMEDIATION_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Genera evidencia del slice actual y vuelve a validar el gate de esta fase.',
  EVIDENCE_INVALID: 'Regenera la evidencia de la iteración y repite la validación en el mismo stage.',
  EVIDENCE_CHAIN_INVALID: 'Regenera la evidencia para restaurar la cadena de integridad y vuelve a validar.',
  EVIDENCE_STALE: 'Ejecuta una auditoría completa de evidencia y vuelve a validar PRE_WRITE/PRE_PUSH. Si persiste, refresca la sesión SDD y reintenta.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera evidencia en esta rama y vuelve a ejecutar la validación para sincronizar branch y snapshot.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera evidencia desde este repositorio y relanza la validación del gate.',
  PRE_PUSH_UPSTREAM_MISSING: 'Configura upstream con `git push --set-upstream origin <branch>` y vuelve a ejecutar PRE_PUSH.',
  SDD_SESSION_MISSING: 'Abre sesión SDD del change activo y repite la validación de la fase actual.',
  SDD_SESSION_INVALID: 'Refresca la sesión SDD (open/refresh) y vuelve a validar en el mismo stage.',
  OPENSPEC_MISSING: 'Instala OpenSpec en el repositorio y relanza la validación del gate.',
  MCP_ENTERPRISE_RECEIPT_MISSING: 'Genera el receipt enterprise de MCP y vuelve a ejecutar la validación.',
  BACKEND_AVOID_EXPLICIT_ANY: 'Reemplaza `any` por tipos concretos en backend y vuelve a lanzar el gate para confirmar el fix.',
};

const BLOCKED_REMEDIATION_MAX_LENGTH = 220;

const toKnownSpanishCauseFromMessage = (message: string): string | null => {
  const normalized = message.toLowerCase();
  if (normalized.includes('avoid explicit any')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.BACKEND_AVOID_EXPLICIT_ANY;
  }
  if (normalized.includes('evidence is stale')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.EVIDENCE_STALE;
  }
  if (normalized.includes('no upstream tracking reference')) {
    return BLOCKED_CAUSE_SUMMARY_BY_CODE.PRE_PUSH_UPSTREAM_MISSING;
  }
  return null;
};

const toKnownSpanishRemediationFromMessage = (message: string): string | null => {
  const normalized = message.toLowerCase();
  if (normalized.includes('avoid explicit any')) {
    return BLOCKED_REMEDIATION_BY_CODE.BACKEND_AVOID_EXPLICIT_ANY;
  }
  if (normalized.includes('set-upstream')) {
    return BLOCKED_REMEDIATION_BY_CODE.PRE_PUSH_UPSTREAM_MISSING;
  }
  if (normalized.includes('refresh evidence')) {
    return BLOCKED_REMEDIATION_BY_CODE.EVIDENCE_STALE;
  }
  return null;
};

const resolveBlockedCauseSummary = (event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>, causeCode: string): string => {
  const mapped = BLOCKED_CAUSE_SUMMARY_BY_CODE[causeCode];
  if (mapped) {
    return mapped;
  }
  if (event.causeMessage && event.causeMessage.trim().length > 0) {
    const rawMessage = normalizeNotificationText(event.causeMessage).replace(/^[A-Z0-9_]+:\s*/, '');
    const translated = toKnownSpanishCauseFromMessage(rawMessage);
    if (translated) {
      return translated;
    }
    return truncateNotificationText(rawMessage, 72);
  }
  return `Se detectaron ${event.totalViolations} bloqueos en ${event.stage}.`;
};

const resolveBlockedRemediation = (event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>, causeCode: string): string => {
  const fromEvent = event.remediation
    ? normalizeNotificationText(event.remediation).replace(/^cómo solucionarlo:\s*/i, '').replace(/^remediation:\s*/i, '')
    : '';
  if (fromEvent.length > 0) {
    const translated = toKnownSpanishRemediationFromMessage(fromEvent);
    if (translated) {
      return truncateNotificationText(translated, BLOCKED_REMEDIATION_MAX_LENGTH);
    }
    return truncateNotificationText(fromEvent, BLOCKED_REMEDIATION_MAX_LENGTH);
  }
  const fallback =
    BLOCKED_REMEDIATION_BY_CODE[causeCode]
    ?? 'Corrige el bloqueo indicado y vuelve a ejecutar el comando.';
  return truncateNotificationText(fallback, BLOCKED_REMEDIATION_MAX_LENGTH);
};

const runSystemCommand: SystemNotificationCommandRunner = (command, args) => {
  try {
    runBinarySync(command, [...args], { stdio: 'ignore' });
    return 0;
  } catch {
    return 1;
  }
};

const runSystemCommandWithOutput: SystemNotificationCommandRunnerWithOutput = (
  command,
  args
) => {
  try {
    const stdout = runBinarySync(command, [...args], {
      encoding: 'utf8',
    });
    return {
      exitCode: 0,
      stdout: typeof stdout === 'string' ? stdout : '',
    };
  } catch (error: unknown) {
    const fallbackStdout =
      typeof error === 'object' &&
      error !== null &&
      'stdout' in error &&
      typeof (error as { stdout?: unknown }).stdout === 'string'
        ? (error as { stdout: string }).stdout
        : '';
    return {
      exitCode: 1,
      stdout: fallbackStdout,
    };
  }
};

const runBlockedDialogWithAppleScript = (params: {
  title: string;
  cause: string;
  remediation: string;
  runner: SystemNotificationCommandRunnerWithOutput;
}): {
  selectedButton: string | null;
  commandFailed: boolean;
} => {
  const dialogScript = buildDisplayDialogScript({
    title: params.title,
    cause: params.cause,
    remediation: params.remediation,
  });
  const dialogResult = params.runner('osascript', ['-e', dialogScript]);
  if (dialogResult.exitCode !== 0) {
    return {
      selectedButton: null,
      commandFailed: true,
    };
  }
  return {
    selectedButton: extractDialogButton(dialogResult.stdout),
    commandFailed: false,
  };
};

const runBlockedDialogWithSwiftHelper = (params: {
  repoRoot: string;
  title: string;
  cause: string;
  remediation: string;
  runner: SystemNotificationCommandRunnerWithOutput;
}): {
  selectedButton: string | null;
  commandFailed: boolean;
} => {
  const scriptPath = resolveSwiftBlockedDialogScriptPath(params.repoRoot);
  const dialogResult = params.runner('swift', buildSwiftFloatingDialogArgs({
    scriptPath,
    title: params.title,
    cause: params.cause,
    remediation: params.remediation,
  }));
  if (dialogResult.exitCode !== 0) {
    return {
      selectedButton: null,
      commandFailed: true,
    };
  }
  return {
    selectedButton: extractDialogButton(dialogResult.stdout),
    commandFailed: false,
  };
};

const persistSystemNotificationsConfigFile = (
  repoRoot: string,
  config: SystemNotificationsConfig
): string => {
  const configPath = join(repoRoot, SYSTEM_NOTIFICATIONS_CONFIG_PATH);
  mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return configPath;
};

export const buildSystemNotificationsConfigFromSelection = (
  enabled: boolean
): SystemNotificationsConfig => ({
  enabled,
  channel: 'macos',
  blockedDialogEnabled: true,
});

export const persistSystemNotificationsConfig = (repoRoot: string, enabled: boolean): string => {
  return persistSystemNotificationsConfigFile(
    repoRoot,
    buildSystemNotificationsConfigFromSelection(enabled)
  );
};

export const readSystemNotificationsConfig = (repoRoot: string): SystemNotificationsConfig => {
  const configPath = join(repoRoot, SYSTEM_NOTIFICATIONS_CONFIG_PATH);
  if (!existsSync(configPath)) {
    return buildSystemNotificationsConfigFromSelection(true);
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as {
      enabled?: unknown;
      channel?: unknown;
      muteUntil?: unknown;
      blockedDialogEnabled?: unknown;
    };
    const config: SystemNotificationsConfig = {
      enabled: parsed.enabled === true,
      channel: 'macos',
      blockedDialogEnabled: parsed.blockedDialogEnabled !== false,
    };
    if (typeof parsed.muteUntil === 'string' && parsed.muteUntil.trim().length > 0) {
      config.muteUntil = parsed.muteUntil;
    }
    return config;
  } catch {
    return buildSystemNotificationsConfigFromSelection(true);
  }
};

const isMutedAt = (config: SystemNotificationsConfig, nowMs: number): boolean => {
  if (!config.muteUntil) {
    return false;
  }
  const parsed = Date.parse(config.muteUntil);
  if (!Number.isFinite(parsed)) {
    return false;
  }
  return parsed > nowMs;
};

const extractDialogButton = (stdout: string): string | null => {
  const match = stdout.match(/button returned:(.+)/i);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].trim();
};

const applyDialogChoice = (params: {
  repoRoot: string;
  config: SystemNotificationsConfig;
  button: string;
  nowMs: number;
}): void => {
  if (params.button === BLOCKED_DIALOG_KEEP) {
    return;
  }
  if (params.button === BLOCKED_DIALOG_DISABLE) {
    persistSystemNotificationsConfigFile(params.repoRoot, {
      enabled: false,
      channel: params.config.channel,
      blockedDialogEnabled: params.config.blockedDialogEnabled !== false,
    });
    return;
  }
  if (params.button === BLOCKED_DIALOG_MUTE_30) {
    const minutes = 30;
    const muteUntil = new Date(params.nowMs + minutes * 60_000).toISOString();
    persistSystemNotificationsConfigFile(params.repoRoot, {
      enabled: true,
      channel: params.config.channel,
      muteUntil,
      blockedDialogEnabled: params.config.blockedDialogEnabled !== false,
    });
  }
};

export const buildSystemNotificationPayload = (
  event: PumukiCriticalNotificationEvent,
  context?: {
    repoRoot?: string;
    projectLabel?: string;
  }
): SystemNotificationPayload => {
  const projectLabel = resolveProjectLabel({
    repoRoot: context?.repoRoot,
    projectLabel: context?.projectLabel,
  });
  const projectPrefix = projectLabel ? `${projectLabel} · ` : '';

  if (event.kind === 'audit.summary') {
    if (event.criticalViolations > 0) {
      return {
        title: 'AST Audit Complete',
        message: `🔴 ${event.criticalViolations} CRITICAL, ${event.highViolations} HIGH violations`,
      };
    }
    if (event.highViolations > 0) {
      return {
        title: 'AST Audit Complete',
        message: `🟡 ${event.highViolations} HIGH violations found`,
      };
    }
    if (event.totalViolations > 0) {
      return {
        title: 'AST Audit Complete',
        message: `🔵 ${event.totalViolations} violations (no blockers)`,
      };
    }
    return {
      title: 'AST Audit Complete',
      message: '✅ No violations found',
    };
  }

  if (event.kind === 'gate.blocked') {
    const causeCode = event.causeCode ?? 'GATE_BLOCKED';
    const causeSummary = truncateNotificationText(
      resolveBlockedCauseSummary(event, causeCode),
      72
    );
    const remediation = resolveBlockedRemediation(event, causeCode);
    return {
      title: '🔴 Pumuki bloqueado',
      subtitle: `${projectPrefix}${event.stage} · ${causeSummary}`,
      message: `Solución: ${remediation}`,
      soundName: 'Basso',
    };
  }

  if (event.kind === 'evidence.stale') {
    return {
      title: '🟡 Pumuki · evidencia desactualizada',
      message: `Actualiza evidencia (${event.ageMinutes} min): ${event.evidencePath}.`,
    };
  }

  return {
    title: '🔴 Pumuki · bloqueo GitFlow',
    message: `La rama ${event.currentBranch} no cumple GitFlow (${event.reason}).`,
  };
};

export const emitSystemNotification = (params: {
  event: PumukiCriticalNotificationEvent;
  platform?: NodeJS.Platform;
  runCommand?: SystemNotificationCommandRunner;
  runCommandWithOutput?: SystemNotificationCommandRunnerWithOutput;
  repoRoot?: string;
  config?: SystemNotificationsConfig;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
}): SystemNotificationEmitResult => {
  const config =
    params.config ??
    (params.repoRoot
      ? readSystemNotificationsConfig(params.repoRoot)
      : buildSystemNotificationsConfigFromSelection(true));
  if (!config.enabled) {
    return { delivered: false, reason: 'disabled' };
  }
  const nowMs = (params.now ?? Date.now)();
  if (isMutedAt(config, nowMs)) {
    return { delivered: false, reason: 'muted' };
  }

  const platform = params.platform ?? process.platform;
  if (platform !== 'darwin') {
    return { delivered: false, reason: 'unsupported-platform' };
  }

  const runner = params.runCommand ?? runSystemCommand;
  const payload = buildSystemNotificationPayload(params.event, {
    repoRoot: params.repoRoot,
    projectLabel: params.env?.PUMUKI_PROJECT_LABEL,
  });
  const script = buildDisplayNotificationScript(payload);
  const exitCode = runner('osascript', ['-e', script]);

  if (exitCode !== 0) {
    return { delivered: false, reason: 'command-failed' };
  }

  const env = params.env ?? process.env;
  if (
    params.event.kind === 'gate.blocked'
    && resolveBlockedDialogEnabled({ env, config })
    && params.repoRoot
  ) {
    const causeCode = params.event.causeCode ?? 'GATE_BLOCKED';
    const cause = resolveBlockedCauseSummary(params.event, causeCode);
    const remediation = resolveBlockedRemediation(params.event, causeCode);
    const projectLabel = resolveProjectLabel({
      repoRoot: params.repoRoot,
      projectLabel: env.PUMUKI_PROJECT_LABEL,
    });
    const dialogTitle = projectLabel
      ? `🔴 Pumuki bloqueado · ${projectLabel}`
      : '🔴 Pumuki bloqueado';
    const dialogRunner = params.runCommandWithOutput ?? runSystemCommandWithOutput;
    const dialogMode = resolveBlockedDialogMode(env);
    let selectedButton: string | null = null;

    if (dialogMode !== 'applescript') {
      const swiftDialog = runBlockedDialogWithSwiftHelper({
        repoRoot: params.repoRoot,
        title: dialogTitle,
        cause,
        remediation,
        runner: dialogRunner,
      });
      selectedButton = swiftDialog.selectedButton;
      if (swiftDialog.commandFailed) {
        const fallbackDialog = runBlockedDialogWithAppleScript({
          title: dialogTitle,
          cause,
          remediation,
          runner: dialogRunner,
        });
        selectedButton = fallbackDialog.selectedButton;
      }
    } else {
      const fallbackDialog = runBlockedDialogWithAppleScript({
        title: dialogTitle,
        cause,
        remediation,
        runner: dialogRunner,
      });
      selectedButton = fallbackDialog.selectedButton;
    }

    if (selectedButton) {
      applyDialogChoice({
        repoRoot: params.repoRoot,
        config,
        button: selectedButton,
        nowMs,
      });
    }
  }

  return { delivered: true, reason: 'delivered' };
};
