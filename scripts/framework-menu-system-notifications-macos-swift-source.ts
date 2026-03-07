export const SWIFT_BLOCKED_DIALOG_SOURCE = String.raw`import AppKit
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
