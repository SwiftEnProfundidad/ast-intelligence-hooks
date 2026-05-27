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
  func readDouble(_ key: String, fallback: Double) -> Double {
    guard let value = Double(read(key, fallback: String(fallback))), value > 0 else {
      return fallback
    }
    return value
  }
  return DialogConfig(
    title: read("--title", fallback: "Pumuki bloqueado"),
    cause: read("--cause", fallback: "Bloqueo detectado."),
    remediation: read("--remediation", fallback: "Corrige el bloqueo y vuelve a ejecutar."),
    disableButton: read("--disable-button", fallback: "Desactivar"),
    muteButton: read("--mute-button", fallback: "Silenciar 30 min"),
    keepButton: read("--keep-button", fallback: "Mantener activas"),
    timeoutSeconds: readDouble("--timeout-seconds", fallback: 15)
  )
}

final class DialogAppDelegate: NSObject, NSApplicationDelegate {
  private let config: DialogConfig

  init(config: DialogConfig) {
    self.config = config
    super.init()
  }

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.activate(ignoringOtherApps: true)

    let alert = NSAlert()
    alert.messageText = config.title
    alert.informativeText = "Revisa el detalle del bloqueo. Puedes seleccionar y copiar el texto."
    alert.alertStyle = .critical

    let details = "Causa:\n\(config.cause)\n\nSolución:\n\(config.remediation)"
    let scrollView = NSScrollView(frame: NSRect(x: 0, y: 0, width: 560, height: 420))
    scrollView.hasVerticalScroller = true
    scrollView.hasHorizontalScroller = false
    scrollView.borderType = .bezelBorder

    let textView = NSTextView(frame: scrollView.contentView.bounds)
    textView.string = details
    textView.isEditable = false
    textView.isSelectable = true
    textView.drawsBackground = false
    textView.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
    textView.textContainerInset = NSSize(width: 8, height: 8)
    textView.textContainer?.widthTracksTextView = true
    textView.textContainer?.containerSize = NSSize(width: scrollView.contentSize.width, height: CGFloat.greatestFiniteMagnitude)
    textView.isVerticallyResizable = true
    textView.isHorizontallyResizable = false
    textView.autoresizingMask = [.width]
    scrollView.documentView = textView
    alert.accessoryView = scrollView

    alert.addButton(withTitle: config.keepButton)
    alert.addButton(withTitle: config.muteButton)
    alert.addButton(withTitle: config.disableButton)

    DispatchQueue.main.asyncAfter(deadline: .now() + config.timeoutSeconds) {
      if alert.window.isVisible {
        alert.window.orderOut(nil)
        NSApp.stopModal(withCode: .alertFirstButtonReturn)
      }
    }

    let response = alert.runModal()
    let choice: String
    switch response {
    case .alertFirstButtonReturn:
      choice = config.keepButton
    case .alertSecondButtonReturn:
      choice = config.muteButton
    case .alertThirdButtonReturn:
      choice = config.disableButton
    default:
      choice = config.keepButton
    }

    FileHandle.standardOutput.write(Data("button returned:\(choice)\n".utf8))
    NSApp.terminate(nil)
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    true
  }
}

let config = parseArguments()
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let delegate = DialogAppDelegate(config: config)
app.delegate = delegate
app.run()
`;
