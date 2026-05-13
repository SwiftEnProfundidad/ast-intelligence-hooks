import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findSwiftLiskovSubstitutionMatch,
  findSwiftInterfaceSegregationMatch,
  findSwiftOpenClosedSwitchMatch,
  findSwiftConcreteDependencyDipMatch,
  findSwiftPresentationSrpMatch,
  hasSwiftAnyViewUsage,
  hasSwiftCallbackStyleSignature,
  hasSwiftCornerRadiusUsage,
  hasSwiftDispatchGroupUsage,
  hasSwiftDispatchQueueUsage,
  hasSwiftDispatchSemaphoreUsage,
  hasSwiftAdHocLoggingUsage,
  hasSwiftAlamofireUsage,
  hasSwiftForEachIndicesUsage,
  hasSwiftForceCastUsage,
  hasSwiftFontWeightBoldUsage,
  hasSwiftFixedFontSizeUsage,
  hasSwiftForegroundColorUsage,
  hasSwiftForceTryUsage,
  hasSwiftForceUnwrap,
  hasSwiftGeometryReaderUsage,
  hasSwiftHardcodedUiStringUsage,
  hasSwiftHardcodedSensitiveStringUsage,
  hasSwiftIconOnlyControlWithoutAccessibilityLabelUsage,
  hasSwiftLooseAssetResourceUsage,
  hasSwiftLegacyOnChangeUsage,
  hasSwiftLegacyExpectationDescriptionUsage,
  hasSwiftLegacySwiftUiObservableWrapperUsage,
  hasSwiftMainThreadBlockingSleepUsage,
  hasSwiftMassiveViewControllerResponsibilityUsage,
  hasSwiftMagicNumberLayoutUsage,
  hasSwiftMixedTestingFrameworksUsage,
  hasSwiftLegacyXCTestImportUsage,
  hasSwiftModernizableXCTestSuiteUsage,
  hasSwiftNonLazyScrollForEachUsage,
  hasSwiftViewBodyObjectCreationUsage,
  hasSwiftUiImageDataDecodingUsage,
  hasSwiftAssumeIsolatedUsage,
  hasSwiftCoreDataLayerLeakUsage,
  hasSwiftSwiftDataLayerLeakUsage,
  hasSwiftNonisolatedUnsafeUsage,
  hasSwiftNSManagedObjectAsyncBoundaryUsage,
  hasSwiftNSManagedObjectBoundaryUsage,
  hasSwiftNSManagedObjectStateLeakUsage,
  hasSwiftNavigationViewUsage,
  hasSwiftNonPrivateStateOwnershipUsage,
  hasSwiftNonIBOutletImplicitlyUnwrappedOptionalUsage,
  hasSwiftObservableObjectUsage,
  hasSwiftOnAppearTaskUsage,
  hasSwiftOnTapGestureUsage,
  hasSwiftOperationQueueUsage,
  hasSwiftContainsUserFilterUsage,
  hasSwiftCustomSingletonUsage,
  hasSwiftPassedValueStateWrapperUsage,
  hasSwiftPhysicalTextAlignmentUsage,
  hasSwiftPreconcurrencyUsage,
  hasSwiftQuickNimbleUsage,
  hasSwiftSheetIsPresentedUsage,
  hasSwiftScrollViewShowsIndicatorsUsage,
  hasSwiftSensitiveLoggingUsage,
  hasSwiftSensitiveUserDefaultsStorageUsage,
  hasSwiftInsecureTransportUsage,
  hasSwiftJSONSerializationUsage,
  hasSwiftExplicitColorStaticMemberUsage,
  hasSwiftClosureBasedViewBuilderContentUsage,
  hasSwiftRedundantReactiveStateAssignmentUsage,
  hasSwiftInlineForEachTransformUsage,
  hasSwiftStringFormatUsage,
  hasSwiftStrongDelegateReferenceUsage,
  hasSwiftStrongSelfEscapingClosureUsage,
  hasSwiftSwinjectUsage,
  hasSwiftTabItemUsage,
  hasSwiftTaskDetachedUsage,
  hasSwiftWaitForExpectationsUsage,
  hasSwiftUIScreenMainBoundsUsage,
  hasSwiftXCTestAssertionUsage,
  hasSwiftXCTUnwrapUsage,
  hasSwiftUncheckedSendableUsage,
} from './ios';

test('hasSwiftForceUnwrap detecta force unwrap postfix en expresiones', () => {
  const source = `
let token = optionalToken!
let value = loadUser()!
`;
  assert.equal(hasSwiftForceUnwrap(source), true);
});

test('hasSwiftForceUnwrap excluye type annotations, force cast y operadores', () => {
  const source = `
let name: String!
let model = payload as! User
if left != right { print("ok") }
let flag = value!!
`;
  assert.equal(hasSwiftForceUnwrap(source), false);
});

test('hasSwiftForceUnwrap excluye comparaciones seguras contra nil', () => {
  const source = `
if ProcessInfo.processInfo.environment["SIMULATOR_UDID"] != nil {
  return
}

if waitersByKey[key] != nil {
  consume()
}
`;
  assert.equal(hasSwiftForceUnwrap(source), false);
});

test('hasSwiftAnyViewUsage detecta AnyView en codigo real', () => {
  const source = `
func render() -> some View {
  AnyView(Text("hello"))
}
`;
  assert.equal(hasSwiftAnyViewUsage(source), true);
});

test('hasSwiftAnyViewUsage ignora comentarios, strings y coincidencias parciales', () => {
  const source = `\n// AnyView(Text("debug"))\nlet value = "AnyView(Text(\\"debug\\"))"\nlet customAnyViewBuilder = true\n`;
  assert.equal(hasSwiftAnyViewUsage(source), false);
});

test('hasSwiftNonLazyScrollForEachUsage detecta ScrollView con stack no lazy y preserva LazyVStack', () => {
  const source = `
struct FeedView: View {
  let items: [Item]

  var body: some View {
    ScrollView {
      VStack(spacing: 12) {
        ForEach(items) { item in
          FeedRow(item: item)
        }
      }
    }
  }
}
`;
  const safe = `
struct FeedView: View {
  let items: [Item]

  var body: some View {
    ScrollView {
      LazyVStack(spacing: 12) {
        ForEach(items) { item in
          FeedRow(item: item)
        }
      }
    }
    let sample = "ScrollView { VStack { ForEach(items) } }"
    // ScrollView { VStack { ForEach(items) } }
  }
}
`;

  assert.equal(hasSwiftNonLazyScrollForEachUsage(source), true);
  assert.equal(hasSwiftNonLazyScrollForEachUsage(safe), false);
});

test('hasSwiftViewBodyObjectCreationUsage detecta formatter creado en body y preserva dependencia externa', () => {
  const source = `
struct PriceView: View {
  let amount: Decimal

  var body: some View {
    let formatter = NumberFormatter()
    Text(formatter.string(from: amount as NSDecimalNumber) ?? "")
  }
}
`;
  const safe = `
struct PriceView: View {
  let formatter: NumberFormatter
  let amount: Decimal

  var body: some View {
    Text(formatter.string(from: amount as NSDecimalNumber) ?? "")
    let sample = "var body: some View { NumberFormatter() }"
    // var body: some View { NumberFormatter() }
  }
}
`;

  assert.equal(hasSwiftViewBodyObjectCreationUsage(source), true);
  assert.equal(hasSwiftViewBodyObjectCreationUsage(safe), false);
});

test('hasSwiftUiImageDataDecodingUsage detecta UIImage(data:) y preserva strings y comentarios', () => {
  const source = `
struct AvatarView: View {
  let imageData: Data

  var body: some View {
    if let image = UIImage(data: imageData) {
      Image(uiImage: image)
    }
  }
}
`;
  const safe = `
struct AvatarView: View {
  let image: UIImage

  var body: some View {
    Image(uiImage: image)
    let sample = "UIImage(data: imageData)"
    // UIImage(data: imageData)
  }
}
`;

  assert.equal(hasSwiftUiImageDataDecodingUsage(source), true);
  assert.equal(hasSwiftUiImageDataDecodingUsage(safe), false);
});

test('hasSwiftForceTryUsage detecta try! y descarta try?', () => {
  const positive = `
func load() {
  let user = try! repository.fetch()
}
`;
  const negative = `
func load() {
  let user = try? repository.fetch()
}
`;
  assert.equal(hasSwiftForceTryUsage(positive), true);
  assert.equal(hasSwiftForceTryUsage(negative), false);
});

test('hasSwiftForceCastUsage detecta as! y descarta as?', () => {
  const positive = `
let model = payload as! User
`;
  const negative = `
let model = payload as? User
`;
  assert.equal(hasSwiftForceCastUsage(positive), true);
  assert.equal(hasSwiftForceCastUsage(negative), false);
});

test('hasSwiftCallbackStyleSignature detecta firmas callback con @escaping', () => {
  const completionSignature = `
func fetch(completion: @escaping (Result<Void, Error>) -> Void) {}
`;
  const handlerSignature = `
func run(handler: @MainActor @escaping () -> Void) {}
`;
  assert.equal(hasSwiftCallbackStyleSignature(completionSignature), true);
  assert.equal(hasSwiftCallbackStyleSignature(handlerSignature), true);
});

test('hasSwiftCallbackStyleSignature ignora usos fuera de firmas callback', () => {
  const source = `\n// @escaping completion: @escaping () -> Void\nlet text = "@escaping completion: @escaping () -> Void"\n`;
  assert.equal(hasSwiftCallbackStyleSignature(source), false);
});

test('detecta primitivas GCD y OperationQueue en codigo ejecutable', () => {
  const source = `
DispatchQueue.main.async { }
DispatchGroup()
DispatchSemaphore(value: 1)
OperationQueue()
`;

  assert.equal(hasSwiftDispatchQueueUsage(source), true);
  assert.equal(hasSwiftDispatchGroupUsage(source), true);
  assert.equal(hasSwiftDispatchSemaphoreUsage(source), true);
  assert.equal(hasSwiftOperationQueueUsage(source), true);
});

test('hasSwiftTaskDetachedUsage detecta Task.detached y evita Task normal', () => {
  const positive = `
Task.detached(priority: .background) { }
`;
  const negative = `
Task {
  await work()
}
`;
  assert.equal(hasSwiftTaskDetachedUsage(positive), true);
  assert.equal(hasSwiftTaskDetachedUsage(negative), false);
});

test('hasSwiftOnAppearTaskUsage detecta Task dentro de onAppear y preserva task modifier', () => {
  const source = `
struct FeedView: View {
  var body: some View {
    List(items) { item in
      Text(item.title)
    }
    .onAppear {
      Task {
        await viewModel.load()
      }
    }
  }
}
`;
  const safe = `
struct FeedView: View {
  var body: some View {
    List(items) { item in
      Text(item.title)
    }
    .task {
      await viewModel.load()
    }
    .onAppear {
      analytics.trackScreen()
    }
    let text = ".onAppear { Task { await load() } }"
    // .onAppear { Task { await load() } }
  }
}
`;

  assert.equal(hasSwiftOnAppearTaskUsage(source), true);
  assert.equal(hasSwiftOnAppearTaskUsage(safe), false);
});

test('hasSwiftStrongDelegateReferenceUsage detecta delegates fuertes y preserva weak delegates', () => {
  const positive = `
final class CheckoutCoordinator {
  var delegate: CheckoutCoordinatorDelegate?
  let tableDataSource: OrdersTableDataSource
}
`;
  const negative = `
final class CheckoutCoordinator {
  weak var delegate: CheckoutCoordinatorDelegate?
  private weak var dataSource: OrdersTableDataSource?
  let text = "var delegate: CheckoutCoordinatorDelegate?"
  // var delegate: CheckoutCoordinatorDelegate?
}
`;

  assert.equal(hasSwiftStrongDelegateReferenceUsage(positive), true);
  assert.equal(hasSwiftStrongDelegateReferenceUsage(negative), false);
});

test('hasSwiftStrongDelegateReferenceUsage no marca propiedades no delegate', () => {
  const source = `
final class CheckoutCoordinator {
  var repository: OrdersRepository
  let presenter: CheckoutPresenter
}
`;

  assert.equal(hasSwiftStrongDelegateReferenceUsage(source), false);
});

test('hasSwiftStrongSelfEscapingClosureUsage detecta self fuerte en closures escapables iOS', () => {
  const source = `
final class CartViewModel {
  private var cancellables = Set<AnyCancellable>()

  func bind() {
    Task {
      await self.reload()
    }
    DispatchQueue.main.async {
      self.render()
    }
    Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { timer in
      self.tick(timer)
    }
    NotificationCenter.default.addObserver(forName: .cartChanged, object: nil, queue: .main) { notification in
      self.handle(notification)
    }
    publisher.sink { value in
      self.consume(value)
    }
  }
}
`;

  assert.equal(hasSwiftStrongSelfEscapingClosureUsage(source), true);
});

test('hasSwiftStrongSelfEscapingClosureUsage preserva capture lists weak/unowned e ignora comentarios y strings', () => {
  const source = `
final class CartViewModel {
  func bind() {
    Task { [weak self] in
      await self?.reload()
    }
    DispatchQueue.main.async { [unowned self] in
      render()
    }
    publisher.sink(receiveValue: { [weak self] value in
      self?.consume(value)
    })
    let text = "Task { self.reload() }"
    // Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in self.tick() }
  }
}
`;

  assert.equal(hasSwiftStrongSelfEscapingClosureUsage(source), false);
});

test('hasSwiftCustomSingletonUsage detecta singletons propios y excluye usos de singletons del sistema', () => {
  const source = `
final class SessionStore {
  static let shared = SessionStore()
}

final class MutableStore {
  public static var shared: MutableStore = MutableStore()
}
`;
  const ignored = `
final class APIClient {
  let session = URLSession.shared
  let text = "static let shared = SessionStore()"
  // static let shared = SessionStore()
}
`;

  assert.equal(hasSwiftCustomSingletonUsage(source), true);
  assert.equal(hasSwiftCustomSingletonUsage(ignored), false);
});

test('hasSwiftSwinjectUsage detecta DI de terceros y preserva DI nativa', () => {
  const source = `
import Swinject

final class AppAssembly {
  private let container = Container()
  private let assembler = Assembler([])
}
`;
  const native = `
struct AppDependencies {
  let apiClient: APIClient
}

private struct DependenciesKey: EnvironmentKey {
  static let defaultValue = AppDependencies(apiClient: URLSessionAPIClient())
}
`;
  const ignored = `
let text = "import Swinject"
// let container = Container()
`;

  assert.equal(hasSwiftSwinjectUsage(source), true);
  assert.equal(hasSwiftSwinjectUsage(native), false);
  assert.equal(hasSwiftSwinjectUsage(ignored), false);
});

test('hasSwiftMassiveViewControllerResponsibilityUsage detecta ViewControllers con acceso directo a infraestructura', () => {
  const source = `
final class CheckoutViewController: UIViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    URLSession.shared.dataTask(with: URL(string: "https://example.com")!)
    UserDefaults.standard.set(true, forKey: "seen")
  }
}
`;
  const ignored = `
final class CheckoutViewController: UIViewController {
  private let viewModel: CheckoutViewModel

  init(viewModel: CheckoutViewModel) {
    self.viewModel = viewModel
    super.init(nibName: nil, bundle: nil)
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    viewModel.load()
  }
}

let text = "URLSession.shared.dataTask"
// UserDefaults.standard.set(true, forKey: "seen")
`;

  assert.equal(hasSwiftMassiveViewControllerResponsibilityUsage(source), true);
  assert.equal(hasSwiftMassiveViewControllerResponsibilityUsage(ignored), false);
});

test('hasSwiftNonIBOutletImplicitlyUnwrappedOptionalUsage detecta IUO fuera de IBOutlet', () => {
  const source = `
final class CheckoutViewModel {
  var selectedOrder: Order!
  private let formatter: DateFormatter!
}
`;
  const ignored = `
final class CheckoutViewController: UIViewController {
  @IBOutlet weak var titleLabel: UILabel!
  @IBOutlet
  private weak var tableView: UITableView!
  let text = "var selectedOrder: Order!"
  // var selectedOrder: Order!
}
`;

  assert.equal(hasSwiftNonIBOutletImplicitlyUnwrappedOptionalUsage(source), true);
  assert.equal(hasSwiftNonIBOutletImplicitlyUnwrappedOptionalUsage(ignored), false);
});

test('hasSwiftMagicNumberLayoutUsage detecta numeros magicos de layout SwiftUI', () => {
  const source = `
struct ProfileView: View {
  var body: some View {
    VStack(spacing: 12) {
      Text("Profile")
        .padding(16)
        .frame(width: 320, height: 44)
    }
  }
}
`;
  const constants = `
struct ProfileView: View {
  private enum Metrics {
    static let spacing: CGFloat = 12
    static let cardPadding: CGFloat = 16
  }

  var body: some View {
    VStack(spacing: Metrics.spacing) {
      Text("Profile")
        .padding(Metrics.cardPadding)
    }
  }
}
`;

  assert.equal(hasSwiftMagicNumberLayoutUsage(source), true);
  assert.equal(hasSwiftMagicNumberLayoutUsage(constants), false);
});

test('detectores de logging iOS detectan logs ad-hoc y PII en produccion', () => {
  const adHoc = `
print(user.id)
debugPrint(response)
dump(model)
NSLog("legacy")
os_log("legacy")
`;
  const structuredSafe = `
logger.info("Screen loaded")
let text = "print(accessToken)"
// print(accessToken)
`;
  const sensitive = `
print(accessToken)
logger.error("Refresh failed \\(refreshToken)")
`;

  assert.equal(hasSwiftAdHocLoggingUsage(adHoc), true);
  assert.equal(hasSwiftAdHocLoggingUsage(structuredSafe), false);
  assert.equal(hasSwiftSensitiveLoggingUsage(sensitive), true);
  assert.equal(hasSwiftSensitiveLoggingUsage(structuredSafe), false);
});

test('hasSwiftHardcodedSensitiveStringUsage detecta secretos hardcodeados en Swift productivo', () => {
  const source = `
final class Credentials {
  let apiKey = "sk_live_123456789"
  private var refreshToken: String = "refresh-token-123456"
}
`;
  const safe = `
final class Credentials {
  let apiKey = keychain.read("api_key")
  let label = "public title"
  // let apiKey = "sk_live_123456789"
}
`;

  assert.equal(hasSwiftHardcodedSensitiveStringUsage(source), true);
  assert.equal(hasSwiftHardcodedSensitiveStringUsage(safe), false);
});

test('detectores iOS de networking y JSON detectan Alamofire y JSONSerialization sin leer comentarios ni strings', () => {
  const source = `
import Alamofire

final class APIClient {
  func load() {
    AF.request("https://example.com")
    let object = try? JSONSerialization.jsonObject(with: Data())
  }
}
`;
  const ignored = `
import Foundation

final class APIClient {
  func load() async throws {
    let url = URL(string: "https://example.com")
    let dto = try JSONDecoder().decode(UserDTO.self, from: Data())
    let text = "JSONSerialization.jsonObject"
    // AF.request("debug")
  }
}
`;

  assert.equal(hasSwiftAlamofireUsage(source), true);
  assert.equal(hasSwiftJSONSerializationUsage(source), true);
  assert.equal(hasSwiftAlamofireUsage(ignored), false);
  assert.equal(hasSwiftJSONSerializationUsage(ignored), false);
});

test('detector iOS de seguridad detecta secretos en UserDefaults y AppStorage', () => {
  const source = `
UserDefaults.standard.set(accessToken, forKey: "accessToken")
@AppStorage("refreshToken") private var refreshToken = ""
`;
  const ignored = `
UserDefaults.standard.set(theme, forKey: "selectedTheme")
@AppStorage("preferredTab") private var preferredTab = "home"
let text = "UserDefaults.standard.set(accessToken, forKey: \\"accessToken\\")"
// UserDefaults.standard.set(accessToken, forKey: "accessToken")
`;

  assert.equal(hasSwiftSensitiveUserDefaultsStorageUsage(source), true);
  assert.equal(hasSwiftSensitiveUserDefaultsStorageUsage(ignored), false);
});

test('detector iOS de seguridad detecta transporte inseguro HTTP y ATS permisivo', () => {
  const source = `
final class CatalogClient {
  func load() {
    _ = URL(string: "http://example.com/catalog.json")
  }
}
`;
  const plist = `
<dict>
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
  </dict>
</dict>
`;
  const ignored = `
// _ = URL(string: "http://example.com/catalog.json")
let text = "https://example.com/catalog.json"
`;

  assert.equal(hasSwiftInsecureTransportUsage(source), true);
  assert.equal(hasSwiftInsecureTransportUsage(plist), true);
  assert.equal(hasSwiftInsecureTransportUsage(ignored), false);
});

test('detector iOS de localización detecta strings UI hardcodeadas sin confundir keys ni comentarios', () => {
  const source = `
struct PaywallView: View {
  var body: some View {
    VStack {
      Text("Start premium trial")
      Button("Continue") {}
      Label("Your orders", systemImage: "cart")
      TextField("Search products", text: $query)
      EmptyView().navigationTitle("Account details")
    }
  }
}
`;
  const ignored = `
struct OrdersView: View {
  var body: some View {
    Text(String(localized: "orders.title"))
    Text("orders.title")
    Button(String(localized: "orders.checkout")) {}
    let sample = "Text(\\"Start premium trial\\")"
    // Text("Debug")
  }
}
`;

  assert.equal(hasSwiftHardcodedUiStringUsage(source), true);
  assert.equal(hasSwiftHardcodedUiStringUsage(ignored), false);
});

test('detector iOS de assets detecta recursos sueltos sin confundir asset catalogs', () => {
  const source = `
let path = Bundle.main.path(forResource: "hero", withExtension: "png")
let url = Bundle.main.url(forResource: "logo", withExtension: "pdf")
let image = UIImage(contentsOfFile: path)
`;
  const ignored = `
Image("hero")
UIImage(named: "hero")
let text = "UIImage(contentsOfFile: path)"
// Bundle.main.path(forResource: "hero", withExtension: "png")
`;

  assert.equal(hasSwiftLooseAssetResourceUsage(source), true);
  assert.equal(hasSwiftLooseAssetResourceUsage(ignored), false);
});

test('detector iOS de accesibilidad detecta tamaños de fuente fijos sin confundir estilos semánticos', () => {
  const source = `
Text("Total").font(.system(size: 18))
let title = Font.system(size: 24, weight: .bold)
label.font = UIFont.systemFont(ofSize: 16)
`;
  const ignored = `
Text("Total").font(.headline)
Text("Body").font(.body)
let text = "UIFont.systemFont(ofSize: 16)"
// Text("Total").font(.system(size: 18))
`;

  assert.equal(hasSwiftFixedFontSizeUsage(source), true);
  assert.equal(hasSwiftFixedFontSizeUsage(ignored), false);
});

test('detector iOS de localización detecta alineación física sin confundir leading/trailing', () => {
  const source = `
Text("Name").multilineTextAlignment(.left)
Text("Price").frame(maxWidth: .infinity, alignment: .right)
let textAlignment = TextAlignment.right
label.textAlignment = NSTextAlignment.left
`;
  const ignored = `
Text("Name").multilineTextAlignment(.leading)
Text("Price").frame(maxWidth: .infinity, alignment: .trailing)
let sample = "TextAlignment.right"
// Text("Name").multilineTextAlignment(.left)
`;

  assert.equal(hasSwiftPhysicalTextAlignmentUsage(source), true);
  assert.equal(hasSwiftPhysicalTextAlignmentUsage(ignored), false);
});

test('detector iOS de performance detecta sleeps bloqueantes sin confundir Task.sleep', () => {
  const source = `
final class SplashDelay {
  func wait() {
    Thread.sleep(forTimeInterval: 0.25)
    sleep(1)
    usleep(100)
  }
}
`;
  const ignored = `
func wait() async throws {
  try await Task.sleep(for: .seconds(1))
  let text = "Thread.sleep(forTimeInterval: 1)"
  // sleep(1)
}
`;

  assert.equal(hasSwiftMainThreadBlockingSleepUsage(source), true);
  assert.equal(hasSwiftMainThreadBlockingSleepUsage(ignored), false);
});

test('detector iOS de accesibilidad detecta botones icon-only sin label explicita', () => {
  const source = `
struct ToolbarView: View {
  var body: some View {
    Button {
      delete()
    } label: {
      Image(systemName: "trash")
    }
  }
}
`;
  const ignored = `
struct ToolbarView: View {
  var body: some View {
    Button {
      delete()
    } label: {
      Image(systemName: "trash")
    }
    .accessibilityLabel(Text("Delete item"))
    Button("Delete") { delete() }
    let text = "Button { Image(systemName: \\"trash\\") }"
    // Button { Image(systemName: "trash") }
  }
}
`;

  assert.equal(hasSwiftIconOnlyControlWithoutAccessibilityLabelUsage(source), true);
  assert.equal(hasSwiftIconOnlyControlWithoutAccessibilityLabelUsage(ignored), false);
});

test('hasSwiftUncheckedSendableUsage detecta @unchecked Sendable', () => {
  const source = `
final class LegacyBox: @unchecked Sendable {}
`;
  assert.equal(hasSwiftUncheckedSendableUsage(source), true);
});

test('detectores de hardening de concurrencia detectan escapes inseguros', () => {
  const source = `
@preconcurrency import LegacyFramework

struct APIProvider: Sendable {
  nonisolated(unsafe) static private(set) var shared: APIProvider!
}

func renderFromLegacyCallback() {
  MainActor.assumeIsolated {
    updateUI()
  }
}
`;

  assert.equal(hasSwiftPreconcurrencyUsage(source), true);
  assert.equal(hasSwiftNonisolatedUnsafeUsage(source), true);
  assert.equal(hasSwiftAssumeIsolatedUsage(source), true);
});

test('detectores SwiftUI modernos detectan patrones legacy relevantes', () => {
  const source = `
@preconcurrency import LegacyFramework
final class LegacyViewModel: ObservableObject {}
@StateObject private var ownedViewModel = LegacyViewModel()
@ObservedObject var injectedViewModel: LegacyViewModel
NavigationView { Text("x") }
GeometryReader { proxy in
  Text("x").frame(width: proxy.size.width)
}
Text("Headline").fontWeight(.bold)
Text("State").foregroundStyle(Color.green)
let content: () -> Content
.onChange(of: query) { newValue in
  query = newValue
}
let filtered = items.filter { $0.title.contains(searchText) }
ForEach(items.indices, id: \\.self) { index in
  Text(items[index].title)
}
ForEach(items.filter { $0.isVisible }) { item in
  Text(item.title)
}
Text("Primary").foregroundColor(.blue)
Image("hero").cornerRadius(12)
TabView {
  HomeView().tabItem {
    Label("Home", systemImage: "house")
  }
}
Text("Tap").onTapGesture { }
let value = String(format: "%d", 1)
let width = UIScreen.main.bounds.width
ScrollView(.horizontal, showsIndicators: false) {
  Text("feed")
}
.sheet(isPresented: $showDetails) {
  DetailView()
}
.onChange(of: query) { newValue in
  print(newValue)
}
struct DetailView: View {
  @State private var filter: String
  @StateObject private var detailViewModel: LegacyViewModel

  init(filter: String, detailViewModel: LegacyViewModel) {
    _filter = State(initialValue: filter)
    _detailViewModel = StateObject(wrappedValue: detailViewModel)
  }
}
nonisolated(unsafe) static var sharedBridge: LegacyViewModel?
MainActor.assumeIsolated { reload() }
`;
  assert.equal(hasSwiftPreconcurrencyUsage(source), true);
  assert.equal(hasSwiftNonisolatedUnsafeUsage(source), true);
  assert.equal(hasSwiftAssumeIsolatedUsage(source), true);
  assert.equal(hasSwiftForEachIndicesUsage(source), true);
  assert.equal(hasSwiftInlineForEachTransformUsage(source), true);
  assert.equal(hasSwiftContainsUserFilterUsage(source), true);
  assert.equal(hasSwiftGeometryReaderUsage(source), true);
  assert.equal(hasSwiftFontWeightBoldUsage(source), true);
  assert.equal(hasSwiftExplicitColorStaticMemberUsage(source), true);
  assert.equal(hasSwiftClosureBasedViewBuilderContentUsage(source), true);
  assert.equal(hasSwiftRedundantReactiveStateAssignmentUsage(source), true);
  assert.equal(hasSwiftObservableObjectUsage(source), true);
  assert.equal(hasSwiftLegacySwiftUiObservableWrapperUsage(source), true);
  assert.equal(hasSwiftNavigationViewUsage(source), true);
  assert.equal(hasSwiftForegroundColorUsage(source), true);
  assert.equal(hasSwiftCornerRadiusUsage(source), true);
  assert.equal(hasSwiftTabItemUsage(source), true);
  assert.equal(hasSwiftOnTapGestureUsage(source), true);
  assert.equal(hasSwiftStringFormatUsage(source), true);
  assert.equal(hasSwiftUIScreenMainBoundsUsage(source), true);
  assert.equal(hasSwiftScrollViewShowsIndicatorsUsage(source), true);
  assert.equal(hasSwiftSheetIsPresentedUsage(source), true);
  assert.equal(hasSwiftLegacyOnChangeUsage(source), true);
  assert.equal(hasSwiftPassedValueStateWrapperUsage(source), true);
});

test('detectores legacy ignoran strings y comentarios', () => {
  const source = `
// Task.detached { }
let a = "Task.detached { }"
let b = "NavigationView { }"
let c = "String(format: \\\"%d\\\", 1)"
let d = "UIScreen.main.bounds.width"
let e = ".foregroundColor(.blue)"
let f = ".cornerRadius(12)"
let g = ".tabItem { Label(\\\"Home\\\", systemImage: \\\"house\\\") }"
let h = "ScrollView(showsIndicators: false) { }"
let i = ".sheet(isPresented: $showDetails) { DetailView() }"
let j = ".onChange(of: query) { newValue in }"
let k = "@StateObject private var ownedViewModel = LegacyViewModel()"
let l = "@ObservedObject var injectedViewModel: LegacyViewModel"
let m = "_filter = State(initialValue: filter)"
let n = "ForEach(items.indices, id: \\.self) { index in }"
let o = "items.filter { $0.title.contains(searchText) }"
let p = "GeometryReader { proxy in }"
let q = ".fontWeight(.bold)"
let r = "@preconcurrency import LegacyFramework"
let s = "nonisolated(unsafe) static var sharedBridge: Model?"
let t = "MainActor.assumeIsolated { reload() }"
let u = "ForEach(items.filter { $0.isVisible }) { item in }"
let v = "Color.green"
let w = "let content: () -> Content"
let x = ".onChange(of: query) { newValue in query = newValue }"
`;
  assert.equal(hasSwiftPreconcurrencyUsage(source), false);
  assert.equal(hasSwiftNonisolatedUnsafeUsage(source), false);
  assert.equal(hasSwiftAssumeIsolatedUsage(source), false);
  assert.equal(hasSwiftForEachIndicesUsage(source), false);
  assert.equal(hasSwiftInlineForEachTransformUsage(source), false);
  assert.equal(hasSwiftContainsUserFilterUsage(source), false);
  assert.equal(hasSwiftGeometryReaderUsage(source), false);
  assert.equal(hasSwiftFontWeightBoldUsage(source), false);
  assert.equal(hasSwiftExplicitColorStaticMemberUsage(source), false);
  assert.equal(hasSwiftClosureBasedViewBuilderContentUsage(source), false);
  assert.equal(hasSwiftRedundantReactiveStateAssignmentUsage(source), false);
  assert.equal(hasSwiftTaskDetachedUsage(source), false);
  assert.equal(hasSwiftNavigationViewUsage(source), false);
  assert.equal(hasSwiftForegroundColorUsage(source), false);
  assert.equal(hasSwiftCornerRadiusUsage(source), false);
  assert.equal(hasSwiftTabItemUsage(source), false);
  assert.equal(hasSwiftStringFormatUsage(source), false);
  assert.equal(hasSwiftUIScreenMainBoundsUsage(source), false);
  assert.equal(hasSwiftScrollViewShowsIndicatorsUsage(source), false);
  assert.equal(hasSwiftSheetIsPresentedUsage(source), false);
  assert.equal(hasSwiftLegacyOnChangeUsage(source), false);
  assert.equal(hasSwiftLegacySwiftUiObservableWrapperUsage(source), false);
  assert.equal(hasSwiftPassedValueStateWrapperUsage(source), false);
});

test('detectores snapshot SwiftUI ignoran reemplazos modernos', () => {
  const source = `
Text("Primary").foregroundStyle(.blue)
Text("State").foregroundStyle(.green)
@ViewBuilder let content: Content
Image("hero").clipShape(.rect(cornerRadius: 12))
Text("Headline").bold()
TabView {
  Tab("Home", systemImage: "house") {
    HomeView()
  }
}
let filtered = items.filter { $0.title.localizedStandardContains(searchText) }
ForEach(items) { item in
  Text(item.title)
}
containerRelativeFrame(.horizontal)
ScrollView {
  Text("feed")
}
.scrollIndicators(.hidden)
.sheet(item: $selectedItem) { item in
  DetailView(item: item)
}
.onChange(of: query) { oldValue, newValue in
  print(oldValue, newValue)
}
.onChange(of: selection) {
  reloadSelection()
}
`;
  assert.equal(hasSwiftPreconcurrencyUsage(source), false);
  assert.equal(hasSwiftNonisolatedUnsafeUsage(source), false);
  assert.equal(hasSwiftAssumeIsolatedUsage(source), false);
  assert.equal(hasSwiftForEachIndicesUsage(source), false);
  assert.equal(hasSwiftContainsUserFilterUsage(source), false);
  assert.equal(hasSwiftGeometryReaderUsage(source), false);
  assert.equal(hasSwiftFontWeightBoldUsage(source), false);
  assert.equal(hasSwiftExplicitColorStaticMemberUsage(source), false);
  assert.equal(hasSwiftClosureBasedViewBuilderContentUsage(source), false);
  assert.equal(hasSwiftRedundantReactiveStateAssignmentUsage(source), false);
  assert.equal(hasSwiftForegroundColorUsage(source), false);
  assert.equal(hasSwiftCornerRadiusUsage(source), false);
  assert.equal(hasSwiftTabItemUsage(source), false);
  assert.equal(hasSwiftScrollViewShowsIndicatorsUsage(source), false);
  assert.equal(hasSwiftSheetIsPresentedUsage(source), false);
  assert.equal(hasSwiftLegacyOnChangeUsage(source), false);
});

test('hasSwiftExplicitColorStaticMemberUsage detecta Color.* y preserva static member lookup', () => {
  const source = `
struct StatusView: View {
  var body: some View {
    Text("Ready").foregroundStyle(Color.green)
    Circle().fill(Color.primary)
  }
}
`;
  const safe = `
struct StatusView: View {
  var body: some View {
    Text("Ready").foregroundStyle(.green)
    Circle().fill(.primary)
    Rectangle().fill(Color("BrandPrimary"))
  }
}
let ignored = "Color.green"
// Color.primary
`;

  assert.equal(hasSwiftExplicitColorStaticMemberUsage(source), true);
  assert.equal(hasSwiftExplicitColorStaticMemberUsage(safe), false);
});

test('hasSwiftClosureBasedViewBuilderContentUsage detecta content closure y preserva @ViewBuilder let content', () => {
  const source = `
struct Card<Content: View>: View {
  private let content: () -> Content

  init(@ViewBuilder content: @escaping () -> Content) {
    self.content = content
  }
}
`;
  const safe = `
struct Card<Content: View>: View {
  @ViewBuilder let content: Content
}
let ignored = "let content: () -> Content"
// let content: () -> Content
`;

  assert.equal(hasSwiftClosureBasedViewBuilderContentUsage(source), true);
  assert.equal(hasSwiftClosureBasedViewBuilderContentUsage(safe), false);
});

test('hasSwiftRedundantReactiveStateAssignmentUsage detecta asignaciones reactivas redundantes y preserva guard de cambio', () => {
  const source = `
struct SearchView: View {
  @State private var query = ""

  var body: some View {
    TextField("Search", text: $query)
      .onChange(of: query) { newValue in
        query = newValue
      }
      .onReceive(model.$value) { value in
        self.query = value
      }
  }
}
`;
  const safe = `
struct SearchView: View {
  @State private var query = ""

  var body: some View {
    TextField("Search", text: $query)
      .onChange(of: query) { newValue in
        if query != newValue {
          query = newValue
        }
      }
      .onReceive(model.$value) { value in
        guard self.query != value else { return }
        self.query = value
      }
  }
}
let ignored = ".onChange(of: query) { newValue in query = newValue }"
// .onReceive(model.$value) { value in query = value }
`;

  assert.equal(hasSwiftRedundantReactiveStateAssignmentUsage(source), true);
  assert.equal(hasSwiftRedundantReactiveStateAssignmentUsage(safe), false);
});

test('hasSwiftLegacyXCTestImportUsage detecta XCTest unitario y excluye UI/performance', () => {
  const unitTest = `
import XCTest

final class LoginTests: XCTestCase {}
`;
  const uiTest = `
import XCTest

final class LoginUITests: XCTestCase {
  func testLoginFlow() {
    let app = XCUIApplication()
    app.launch()
  }
}
`;
  const performanceTest = `
import XCTest

final class SyncTests: XCTestCase {
  func testPerformance() {
    measure {
      runSync()
    }
  }
}
`;

  assert.equal(hasSwiftLegacyXCTestImportUsage(unitTest), true);
  assert.equal(hasSwiftLegacyXCTestImportUsage(uiTest), false);
  assert.equal(hasSwiftLegacyXCTestImportUsage(performanceTest), false);
});

test('hasSwiftLegacySwiftUiObservableWrapperUsage detecta @StateObject/@ObservedObject legacy', () => {
  const legacyWrapper = `
@StateObject private var viewModel = LegacyViewModel()
@ObservedObject var sessionViewModel: SessionViewModel
`;
  const modernWrapper = `
@Observable
final class SessionViewModel {}

struct ContentView: View {
  @State private var viewModel = SessionViewModel()
}
`;

  assert.equal(hasSwiftLegacySwiftUiObservableWrapperUsage(legacyWrapper), true);
  assert.equal(hasSwiftLegacySwiftUiObservableWrapperUsage(modernWrapper), false);
});

test('hasSwiftNonPrivateStateOwnershipUsage detecta @State y @StateObject no privados', () => {
  const source = `
struct DashboardView: View {
  @State var query = ""
  @StateObject var viewModel = DashboardViewModel()
}
`;
  const safe = `
struct DashboardView: View {
  @State private var query = ""
  @StateObject private var viewModel = DashboardViewModel()
  let text = "@State var query = \\"\\""
  // @State var query = ""
}
`;

  assert.equal(hasSwiftNonPrivateStateOwnershipUsage(source), true);
  assert.equal(hasSwiftNonPrivateStateOwnershipUsage(safe), false);
});

test('hasSwiftInlineForEachTransformUsage detecta transformaciones inline y preserva colecciones precomputadas', () => {
  const source = `
struct FeedView: View {
  var body: some View {
    List {
      ForEach(items.filter { $0.isVisible }) { item in
        Text(item.title)
      }
      ForEach(Array(sections.sorted(by: { $0.title < $1.title }))) { section in
        Text(section.title)
      }
    }
  }
}
`;
  const safe = `
struct FeedView: View {
  let filteredItems: [Item]
  let sortedSections: [Section]

  var body: some View {
    List {
      ForEach(filteredItems) { item in
        Text(item.title)
      }
      ForEach(sortedSections) { section in
        Text(section.title)
      }
    }
  }
}
let ignored = "ForEach(items.filter { $0.isVisible }) { item in }"
// ForEach(items.filter { $0.isVisible }) { item in }
`;

  assert.equal(hasSwiftInlineForEachTransformUsage(source), true);
  assert.equal(hasSwiftInlineForEachTransformUsage(safe), false);
});

test('hasSwiftPassedValueStateWrapperUsage detecta valores inyectados guardados como @State o @StateObject', () => {
  const invalidOwnership = `
struct DetailView: View {
  @State private var filter: String
  @StateObject private var viewModel: DetailViewModel

  init(filter: String, viewModel: DetailViewModel) {
    _filter = State(initialValue: filter)
    _viewModel = StateObject(wrappedValue: viewModel)
  }
}
`;
  const validOwnership = `
@Observable
final class DetailViewModel {}

struct DetailView: View {
  let filter: String
  @State private var viewModel = DetailViewModel()
}
`;

  assert.equal(hasSwiftPassedValueStateWrapperUsage(invalidOwnership), true);
  assert.equal(hasSwiftPassedValueStateWrapperUsage(validOwnership), false);
});

test('hasSwiftModernizableXCTestSuiteUsage detecta suites legacy y excluye mixed/UI', () => {
  const legacySuite = `
import XCTest

final class LoginTests: XCTestCase {
  func testLogin() async throws {
    XCTAssertEqual(result, expected)
  }
}
`;
  const mixedSuite = `
import XCTest
import Testing

final class LoginTests: XCTestCase {
  func testLegacyLogin() {}
}

@Suite
struct LoginModernTests {
  @Test func login() async {}
}
`;
  const uiSuite = `
import XCTest

final class LoginUITests: XCTestCase {
  func testLoginFlow() {
    let app = XCUIApplication()
    app.launch()
  }
}
`;

  assert.equal(hasSwiftModernizableXCTestSuiteUsage(legacySuite), true);
  assert.equal(hasSwiftModernizableXCTestSuiteUsage(mixedSuite), false);
  assert.equal(hasSwiftModernizableXCTestSuiteUsage(uiSuite), false);
});

test('hasSwiftMixedTestingFrameworksUsage detecta mezcla XCTestCase y Testing/@Test', () => {
  const mixedSuite = `
import XCTest
import Testing

final class LoginTests: XCTestCase {
  func testLegacyLogin() {}
}

@Suite
struct LoginModernTests {
  @Test func login() async {}
}
`;
  const legacyOnly = `
import XCTest

final class LoginTests: XCTestCase {
  func testLegacyLogin() {}
}
`;
  const modernOnly = `
import Testing

@Suite
struct LoginModernTests {
  @Test func login() async {}
}
`;

  assert.equal(hasSwiftMixedTestingFrameworksUsage(mixedSuite), true);
  assert.equal(hasSwiftMixedTestingFrameworksUsage(legacyOnly), false);
  assert.equal(hasSwiftMixedTestingFrameworksUsage(modernOnly), false);
});

test('hasSwiftQuickNimbleUsage detecta Quick y Nimble en tests Swift', () => {
  const quickSpec = `
import Quick
import Nimble

final class CheckoutSpec: QuickSpec {
  override class func spec() {
    describe("checkout") {
      it("loads") {
        expect(true).to(beTrue())
      }
    }
  }
}
`;
  const nativeSwiftTesting = `
import Testing

@Suite
struct CheckoutTests {
  @Test func loads() {
    #expect(true)
  }
}
`;
  const ignored = `
let text = "import Quick"
// import Nimble
`;

  assert.equal(hasSwiftQuickNimbleUsage(quickSpec), true);
  assert.equal(hasSwiftQuickNimbleUsage(nativeSwiftTesting), false);
  assert.equal(hasSwiftQuickNimbleUsage(ignored), false);
});

test('hasSwiftXCTestAssertionUsage detecta XCTAssert y XCTFail reales', () => {
  const source = `
XCTAssertEqual(value, expected)
XCTFail("boom")
`;
  const ignored = `
// XCTAssertEqual(value, expected)
let text = "XCTAssertEqual(value, expected)"
`;

  assert.equal(hasSwiftXCTestAssertionUsage(source), true);
  assert.equal(hasSwiftXCTestAssertionUsage(ignored), false);
});

test('hasSwiftXCTUnwrapUsage detecta XCTUnwrap real y evita strings', () => {
  const source = `
let value = try XCTUnwrap(optionalValue)
`;
  const ignored = `
let text = "XCTUnwrap(optionalValue)"
`;

  assert.equal(hasSwiftXCTUnwrapUsage(source), true);
  assert.equal(hasSwiftXCTUnwrapUsage(ignored), false);
});

test('hasSwiftWaitForExpectationsUsage detecta waits legacy y excluye await fulfillment', () => {
  const legacyWait = `
let expectation = expectation(description: "Done")
wait(for: [expectation], timeout: 1)
waitForExpectations(timeout: 1)
`;
  const modernWait = `
let expectation = expectation(description: "Done")
await fulfillment(of: [expectation], timeout: 1)
`;

  assert.equal(hasSwiftWaitForExpectationsUsage(legacyWait), true);
  assert.equal(hasSwiftWaitForExpectationsUsage(modernWait), false);
});

test('hasSwiftLegacyExpectationDescriptionUsage detecta expectation(description:) sin flujo moderno', () => {
  const legacyExpectation = `
let expectation = expectation(description: "Done")
doWork { expectation.fulfill() }
waitForExpectations(timeout: 1)
`;
  const modernExpectation = `
let expectation = expectation(description: "Done")
doWork { expectation.fulfill() }
await fulfillment(of: [expectation], timeout: 1)
`;
  const confirmationOnly = `
await confirmation("Done") { confirm in
  await doWork { confirm() }
}
`;

  assert.equal(hasSwiftLegacyExpectationDescriptionUsage(legacyExpectation), true);
  assert.equal(hasSwiftLegacyExpectationDescriptionUsage(modernExpectation), false);
  assert.equal(hasSwiftLegacyExpectationDescriptionUsage(confirmationOnly), false);
});

test('hasSwiftNSManagedObjectBoundaryUsage detecta boundaries con NSManagedObject y excluye IDs o subclases', () => {
  const source = `
func persist(_ entity: NSManagedObject) {}
var selectedEntity: NSManagedObject?
`;
  const ignored = `
final class TodoEntity: NSManagedObject {}
var selectedID: NSManagedObjectID?
let context: NSManagedObjectContext
`;

  assert.equal(hasSwiftNSManagedObjectBoundaryUsage(source), true);
  assert.equal(hasSwiftNSManagedObjectBoundaryUsage(ignored), false);
});

test('hasSwiftNSManagedObjectAsyncBoundaryUsage detecta async APIs con NSManagedObject', () => {
  const source = `
func fetchEntity() async throws -> NSManagedObject {
  fatalError()
}
`;
  const ignored = `
func fetchEntityID() async throws -> NSManagedObjectID {
  fatalError()
}
`;

  assert.equal(hasSwiftNSManagedObjectAsyncBoundaryUsage(source), true);
  assert.equal(hasSwiftNSManagedObjectAsyncBoundaryUsage(ignored), false);
});

test('hasSwiftCoreDataLayerLeakUsage detecta Core Data fuera de infraestructura', () => {
  const source = `
import CoreData

struct DetailView: View {
  @Environment(\\.managedObjectContext) private var context
  @FetchRequest(sortDescriptors: []) private var items: FetchedResults<TodoEntity>
}

final class DetailUseCase {
  private let container: NSPersistentContainer
}
`;
  const ignored = `
import Foundation

struct DetailView: View {
  let selectedID: NSManagedObjectID?
}
`;

  assert.equal(hasSwiftCoreDataLayerLeakUsage(source), true);
  assert.equal(hasSwiftCoreDataLayerLeakUsage(ignored), false);
});

test('hasSwiftSwiftDataLayerLeakUsage detecta SwiftData fuera de infraestructura', () => {
  const source = `
import SwiftData

struct DetailView: View {
  @Environment(\\.modelContext) private var modelContext
  @Query(sort: \\TodoModel.title) private var todos: [TodoModel]
}

final class DetailUseCase {
  private let container: ModelContainer
  private let context: ModelContext
  private let descriptor = FetchDescriptor<TodoModel>()
}

@Model
final class TodoModel {
  var title: String
}
`;
  const ignored = `
import Foundation

struct DetailView: View {
  let selectedID: Todo.ID?
}

final class DetailUseCase {
  func execute() async throws -> [Todo] { [] }
  private let predicate: Predicate<Todo>?
  private let sort = SortDescriptor(\\Todo.title)
}
`;

  assert.equal(hasSwiftSwiftDataLayerLeakUsage(source), true);
  assert.equal(hasSwiftSwiftDataLayerLeakUsage(ignored), false);
});

test('hasSwiftNSManagedObjectStateLeakUsage detecta fugas a SwiftUI state y ViewModels', () => {
  const source = `
final class TodoEntity: NSManagedObject {}

struct DetailView: View {
  @State private var selectedEntity: TodoEntity?
}

final class DetailViewModel: ObservableObject {
  @Published var entity: TodoEntity?
}
`;
  const ignored = `
final class TodoEntity: NSManagedObject {}

struct DetailView: View {
  let selectedID: NSManagedObjectID?
}

final class DetailViewModel: ObservableObject {
  @Published var entityID: NSManagedObjectID?
}
`;

  assert.equal(hasSwiftNSManagedObjectStateLeakUsage(source), true);
  assert.equal(hasSwiftNSManagedObjectStateLeakUsage(ignored), false);
});

test('findSwiftPresentationSrpMatch devuelve payload semantico para SRP-iOS en presentation', () => {
  const source = `
@MainActor
final class PumukiSrpIosCanaryViewModel {
  private let coordinator: StoreMapCoordinator

  func restoreSessionSnapshot() async {}

  func fetchRemoteCatalog() async throws {
    _ = URLSession.shared
  }

  func cacheLastStoreID(_ storeID: String) {
    UserDefaults.standard.set(storeID, forKey: "last-store-id")
  }

  func openStoreMap() {
    coordinator.navigate(to: .storeMap)
  }
}
`;

  const match = findSwiftPresentationSrpMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiSrpIosCanaryViewModel',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'session/auth flow', lines: [6] },
    { kind: 'call', name: 'remote networking', lines: [9] },
    { kind: 'call', name: 'local persistence', lines: [13] },
    { kind: 'member', name: 'navigation flow', lines: [17] },
  ]);
  assert.match(match.why, /SRP/i);
  assert.match(match.impact, /múltiples razones de cambio/i);
  assert.match(match.expected_fix, /estado|coordinador|casos de uso/i);
});

test('findSwiftConcreteDependencyDipMatch devuelve payload semantico para DIP-iOS en application', () => {
  const source = `
import Foundation

final class PumukiDipIosCanaryUseCase {
  private let session: URLSession
  private let preferences: UserDefaults

  init() {
    self.session = URLSession.shared
    self.preferences = UserDefaults.standard
  }

  func execute() async throws {
    guard let url = URL(string: "https://example.com/catalog.json") else {
      return
    }

    _ = try await session.data(from: url)
    preferences.set(Date().timeIntervalSince1970, forKey: "last-sync")
  }
}
`;

  const match = findSwiftConcreteDependencyDipMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiDipIosCanaryUseCase',
    lines: [4],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'concrete dependency: URLSession', lines: [5] },
    { kind: 'call', name: 'URLSession.shared', lines: [9] },
    { kind: 'property', name: 'concrete dependency: UserDefaults', lines: [6] },
    { kind: 'call', name: 'UserDefaults.standard', lines: [10] },
  ]);
  assert.match(match.why, /DIP/i);
  assert.match(match.impact, /infraestructura concretos|coste de sustituir/i);
  assert.match(match.expected_fix, /puertos|infrastructure/i);
});

test('findSwiftOpenClosedSwitchMatch devuelve payload semantico para OCP-iOS en application', () => {
  const source = `enum PumukiOcpIosCanaryChannel {
  case groceryPickup
  case homeDelivery
}

final class PumukiOcpIosCanaryUseCase {
  func makeBanner(for channel: PumukiOcpIosCanaryChannel) -> String {
    switch channel {
    case .groceryPickup:
      return "pickup"
    case .homeDelivery:
      return "delivery"
    }
  }
}
`;

  const match = findSwiftOpenClosedSwitchMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiOcpIosCanaryUseCase',
    lines: [6],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'discriminator switch: channel', lines: [8] },
    { kind: 'member', name: 'case .groceryPickup', lines: [9] },
    { kind: 'member', name: 'case .homeDelivery', lines: [11] },
  ]);
  assert.match(match.why, /OCP/i);
  assert.match(match.impact, /nuevo caso|nuevo comportamiento/i);
  assert.match(match.expected_fix, /estrategia|protocolo|registry/i);
});

test('findSwiftInterfaceSegregationMatch devuelve payload semantico para ISP-iOS en application', () => {
  const source = `
protocol PumukiIspIosCanarySessionManaging {
  func restoreSession() async throws
  func persistSessionID(_ id: String) async
  func clearSession() async
  func refreshToken() async throws -> String
}

final class PumukiIspIosCanaryUseCase {
  private let sessionManager: PumukiIspIosCanarySessionManaging

  init(sessionManager: PumukiIspIosCanarySessionManaging) {
    self.sessionManager = sessionManager
  }

  func execute() async throws {
    try await sessionManager.restoreSession()
  }
}
`;

  const match = findSwiftInterfaceSegregationMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiIspIosCanaryUseCase',
    lines: [9],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'fat protocol: PumukiIspIosCanarySessionManaging', lines: [2] },
    { kind: 'call', name: 'used member: restoreSession', lines: [17] },
    { kind: 'member', name: 'unused contract member: persistSessionID', lines: [4] },
    { kind: 'member', name: 'unused contract member: clearSession', lines: [5] },
  ]);
  assert.match(match.why, /ISP/i);
  assert.match(match.impact, /contrato demasiado ancho|cambios ajenos/i);
  assert.match(match.expected_fix, /protocolos pequeños|puerto mínimo/i);
});

test('detectores SOLID iOS no convierten tamaño o cardinalidad en violacion', () => {
  const presentationWithoutMixedResponsibilities = `
final class CatalogViewModel {
  func restoreSessionSnapshot() async {}
  func refreshSessionToken() async {}
  func resumeSessionIfNeeded() async {}
  func signOut() async {}
}
`;
  const dipWithPortOnly = `
protocol CatalogFetching {
  func fetchCatalog() async throws -> [String]
}

final class CatalogUseCase {
  private let catalog: CatalogFetching

  init(catalog: CatalogFetching) {
    self.catalog = catalog
  }
}
`;
  const cohesiveProtocol = `
protocol CatalogReading {
  func fetchCatalog() async throws -> [String]
  func loadCachedCatalog() async throws -> [String]
  func readCatalogVersion() async throws -> String
  func getFeaturedCatalog() async throws -> [String]
}

final class CatalogUseCase {
  private let catalog: CatalogReading

  init(catalog: CatalogReading) {
    self.catalog = catalog
  }

  func execute() async throws {
    _ = try await catalog.fetchCatalog()
  }
}
`;

  assert.equal(findSwiftPresentationSrpMatch(presentationWithoutMixedResponsibilities), undefined);
  assert.equal(findSwiftConcreteDependencyDipMatch(dipWithPortOnly), undefined);
  assert.equal(findSwiftInterfaceSegregationMatch(cohesiveProtocol), undefined);
});

test('findSwiftLiskovSubstitutionMatch devuelve payload semantico para LSP-iOS en application', () => {
  const source = `
protocol PumukiLspIosCanaryDiscountApplying {
  func apply(to amount: Decimal) -> Decimal
}

final class PumukiLspIosCanaryStandardDiscount: PumukiLspIosCanaryDiscountApplying {
  func apply(to amount: Decimal) -> Decimal {
    amount * 0.9
  }
}

final class PumukiLspIosCanaryPremiumDiscount: PumukiLspIosCanaryDiscountApplying {
  func apply(to amount: Decimal) -> Decimal {
    guard amount >= 100 else {
      fatalError("premium-only")
    }
    return amount * 0.8
  }
}
`;

  const match = findSwiftLiskovSubstitutionMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiLspIosCanaryPremiumDiscount',
    lines: [12],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'base contract: PumukiLspIosCanaryDiscountApplying', lines: [2] },
    { kind: 'member', name: 'safe substitute: PumukiLspIosCanaryStandardDiscount', lines: [6] },
    { kind: 'member', name: 'narrowed precondition: apply', lines: [14] },
    { kind: 'call', name: 'fatalError', lines: [15] },
  ]);
  assert.match(match.why, /LSP/i);
  assert.match(match.impact, /sustitución|precondiciones|regresiones/i);
  assert.match(match.expected_fix, /contrato base|adaptador|estrategia/i);
});
