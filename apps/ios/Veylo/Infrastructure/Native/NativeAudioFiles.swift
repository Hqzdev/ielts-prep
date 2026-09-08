import Foundation

@MainActor
final class NativeAudioFiles: NativeAudioLibrary {
    private let root: URL
    init(root: URL) { self.root = root }

    func device(user: String, attempt: String) -> any NativeAudioDevice {
        NativeMicrophone(file: root.appendingPathComponent(user).appendingPathComponent(attempt + ".wav"))
    }

    func clear(user: String) throws {
        let directory = root.appendingPathComponent(user)
        if FileManager.default.fileExists(atPath: directory.path) {
            try FileManager.default.removeItem(at: directory)
        }
    }
}
