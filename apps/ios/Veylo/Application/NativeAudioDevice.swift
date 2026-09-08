import Foundation

@MainActor
protocol NativeAudioLibrary {
    func device(user: String, attempt: String) -> any NativeAudioDevice
    func clear(user: String) throws
}

@MainActor
protocol NativeAudioDevice {
    var isRecording: Bool { get }
    var hasRecording: Bool { get }
    var duration: TimeInterval { get }
    var level: Float { get }
    func start() async throws
    func stop()
    func data() throws -> Data
    func play() throws
    func play(url: URL) throws
    func delete() throws
}
