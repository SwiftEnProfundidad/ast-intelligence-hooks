import { execFileSync as runBinarySync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  BLOCKED_DIALOG_DISABLE,
  BLOCKED_DIALOG_KEEP,
  BLOCKED_DIALOG_MUTE_30,
  BLOCKED_DIALOG_TIMEOUT_SECONDS,
  SWIFT_BLOCKED_DIALOG_SCRIPT_RELATIVE_PATH,
  type BlockedDialogMode,
  type PumukiCriticalNotificationEvent,
  type SystemNotificationCommandRunner,
  type SystemNotificationCommandRunnerWithOutput,
  type SystemNotificationEmitResult,
  type SystemNotificationPayload,
  type SystemNotificationsConfig,
} from './framework-menu-system-notifications-types';
import {
  resolveBlockedCauseSummary,
  resolveBlockedRemediation,
  resolveProjectLabel,
} from './framework-menu-system-notifications-payloads';

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

const isTruthyFlag = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

export const resolveBlockedDialogEnabled = (params: {
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

export const runSystemCommand: SystemNotificationCommandRunner = (command, args) => {
  try {
    runBinarySync(command, [...args], { stdio: 'ignore' });
    return 0;
  } catch {
    return 1;
  }
};

export const runSystemCommandWithOutput: SystemNotificationCommandRunnerWithOutput = (
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

const extractDialogButton = (stdout: string): string | null => {
  const match = stdout.match(/button returned:(.+)/i);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].trim();
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

export const deliverMacOsNotification = (params: {
  event: PumukiCriticalNotificationEvent;
  payload: SystemNotificationPayload;
  repoRoot?: string;
  config: SystemNotificationsConfig;
  env: NodeJS.ProcessEnv;
  nowMs: number;
  runCommand?: SystemNotificationCommandRunner;
  runCommandWithOutput?: SystemNotificationCommandRunnerWithOutput;
  applyDialogChoice: (params: {
    repoRoot: string;
    config: SystemNotificationsConfig;
    button: string;
    nowMs: number;
  }) => void;
}): SystemNotificationEmitResult => {
  const runner = params.runCommand ?? runSystemCommand;
  const exitCode = runner('osascript', ['-e', buildDisplayNotificationScript(params.payload)]);
  if (exitCode !== 0) {
    return { delivered: false, reason: 'command-failed' };
  }

  if (
    params.event.kind === 'gate.blocked'
    && resolveBlockedDialogEnabled({ env: params.env, config: params.config })
    && params.repoRoot
  ) {
    const causeCode = params.event.causeCode ?? 'GATE_BLOCKED';
    const cause = resolveBlockedCauseSummary(params.event, causeCode);
    const remediation = resolveBlockedRemediation(params.event, causeCode);
    const projectLabel = resolveProjectLabel({
      repoRoot: params.repoRoot,
      projectLabel: params.env.PUMUKI_PROJECT_LABEL,
    });
    const dialogTitle = projectLabel
      ? `🔴 Pumuki bloqueado · ${projectLabel}`
      : '🔴 Pumuki bloqueado';
    const dialogRunner = params.runCommandWithOutput ?? runSystemCommandWithOutput;
    const dialogMode = resolveBlockedDialogMode(params.env);
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
      params.applyDialogChoice({
        repoRoot: params.repoRoot,
        config: params.config,
        button: selectedButton,
        nowMs: params.nowMs,
      });
    }
  }

  return { delivered: true, reason: 'delivered' };
};
