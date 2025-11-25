// ═══════════════════════════════════════════════════════════════
// Swift 6 - Async Image Loading Validator
// ═══════════════════════════════════════════════════════════════
// Validates proper async image loading with SwiftUI AsyncImage

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AsyncImageValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swift6_async_image",
        name: "Swift 6 - Async Image Loading",
        description: "Use AsyncImage with proper placeholder and error handling (iOS 15+)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            AsyncImage(url: url) { phase in
                switch phase {
                case .empty:
                    ProgressView()
                case .success(let image):
                    image.resizable()
                case .failure:
                    Image(systemName: "exclamationmark.triangle")
                @unknown default:
                    EmptyView()
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            ↓AsyncImage(url: url)
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let asyncImagePattern = "AsyncImage\\(url:\\s*[^)]+\\)(?!\\s*\\{)"
        guard let regex = try? NSRegularExpression(pattern: asyncImagePattern) else {
            return []
        }
        
        let nsString = contents as NSString
        let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            let byteOffset = ByteCount(nsString.substring(with: NSRange(location: 0, length: match.range.location)).utf8.count)
            
            let message = """
            AsyncImage without phase handling
            
            Swift 6 + iOS 18 Async Image Loading:
            
            Problem: No placeholder or error state
            - User sees blank space during load
            - No feedback on network failure
            - Poor UX
            
            Current (BAD):
            AsyncImage(url: url)  // ❌ No states
            
            Solution 1 (Phase Handling):
            AsyncImage(url: url) { phase in
                switch phase {
                case .empty:
                    ProgressView()
                        .frame(width: 100, height: 100)
                
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                
                case .failure(let error):
                    VStack {
                        Image(systemName: "photo.fill")
                            .foregroundColor(.gray)
                        Text("Failed to load")
                            .font(.caption)
                    }
                
                @unknown default:
                    EmptyView()
                }
            }
            
            Solution 2 (Task-based):
            @State private var image: UIImage?
            @State private var isLoading = false
            
            var body: some View {
                Group {
                    if let image {
                        Image(uiImage: image)
                    } else if isLoading {
                        ProgressView()
                    } else {
                        placeholder
                    }
                }
                .task {
                    await loadImage()
                }
            }
            
            func loadImage() async {
                isLoading = true
                defer { isLoading = false }
                
                do {
                    let (data, _) = try await URLSession.shared.data(from: url)
                    if let img = UIImage(data: data) {
                        await MainActor.run {
                            self.image = img
                        }
                    }
                } catch {
                    // Handle error
                }
            }
            
            Benefits:
            - Professional UX
            - Error handling
            - Loading states
            - Cancellation support
            """
            
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file, byteOffset: byteOffset),
                reason: message
            ))
        }
        
        return violations
    }
}

