export const SWIFT_BLOCKED_DIALOG_SOURCE = String.raw`import AppKit
import Foundation

struct DialogConfig {
  let title: String
  let cause: String
  let remediation: String
  let disableButton: String
  let muteButton: String
  let keepButton: String
}

func parseArguments() -> DialogConfig {
  let args = CommandLine.arguments
  func read(_ key: String, fallback: String) -> String {
    guard let index = args.firstIndex(of: key), index + 1 < args.count else {
      return fallback
    }
    return args[index + 1]
  }
  return DialogConfig(
    title: read("--title", fallback: "Pumuki bloqueado"),
    cause: read("--cause", fallback: "Bloqueo detectado."),
    remediation: read("--remediation", fallback: "Corrige el bloqueo y vuelve a ejecutar."),
    disableButton: read("--disable-button", fallback: "Desactivar"),
    muteButton: read("--mute-button", fallback: "Silenciar 30 min"),
    keepButton: read("--keep-button", fallback: "Mantener activas")
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
    alert.informativeText = "Causa: \(config.cause)\n\nSolución: \(config.remediation)"
    alert.alertStyle = .critical
    alert.addButton(withTitle: config.keepButton)
    alert.addButton(withTitle: config.muteButton)
    alert.addButton(withTitle: config.disableButton)

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
