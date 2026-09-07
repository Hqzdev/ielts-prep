import Foundation

final class LocalDemoRepository: DemoRepository {
    private let fileURL: URL

    init(directory: URL) {
        fileURL = directory.appendingPathComponent("veylo-demo.json")
    }

    func load() throws -> DemoSnapshot? {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        let snapshot = try JSONDecoder().decode(DemoSnapshot.self, from: Data(contentsOf: fileURL))
        guard snapshot.version == 1 else { throw CocoaError(.coderReadCorrupt) }
        return snapshot
    }

    func save(_ snapshot: DemoSnapshot) throws {
        try FileManager.default.createDirectory(
            at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(snapshot).write(to: fileURL, options: .atomic)
    }
}
