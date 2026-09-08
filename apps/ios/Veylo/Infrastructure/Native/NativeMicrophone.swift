import AVFoundation
import Foundation
import OSLog

@MainActor
final class NativeMicrophone: NativeAudioDevice {
    private let logger = Logger(subsystem: "app.veylo.ios", category: "microphone")
    private var recorder: AVAudioRecorder?
    private var player: AVAudioPlayer?
    private var remotePlayer: AVPlayer?
    private let file: URL
    private var stoppedDuration: TimeInterval = 0

    init(file: URL) { self.file = file }
    var isRecording: Bool { recorder?.isRecording == true }
    var hasRecording: Bool { FileManager.default.fileExists(atPath: file.path) }
    var duration: TimeInterval { isRecording ? recorder?.currentTime ?? 0 : stoppedDuration }
    var level: Float {
        recorder?.updateMeters()
        return max(0, min(1, ((recorder?.averagePower(forChannel: 0) ?? -60) + 60) / 60))
    }
    func start() async throws {
        logger.info("Requesting record permission")
        var permitted = AVAudioApplication.shared.recordPermission == .granted
        if AVAudioApplication.shared.recordPermission == .undetermined {
            permitted = await AVAudioApplication.requestRecordPermission()
        }
        guard permitted else {
            throw NativeFailure(
                code: "MICROPHONE_DENIED",
                message: "Enable microphone access for Veylo in Settings to record a practice answer.")
        }
        logger.info("Record permission granted")
        player?.stop()
        remotePlayer?.pause()
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker, .allowBluetoothHFP])
        try session.setActive(true)
        logger.info("Audio session active")
        try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
        let recorder = try AVAudioRecorder(
            url: file,
            settings: [
                AVFormatIDKey: kAudioFormatLinearPCM,
                AVSampleRateKey: 16000,
                AVNumberOfChannelsKey: 1,
                AVLinearPCMBitDepthKey: 16,
                AVLinearPCMIsBigEndianKey: false,
                AVLinearPCMIsFloatKey: false,
            ])
        recorder.isMeteringEnabled = true
        guard recorder.record(forDuration: 600) else {
            throw NativeFailure(code: "RECORDING_FAILED", message: "The microphone could not start recording.")
        }
        self.recorder = recorder
        logger.info("Recorder started")
        try FileManager.default.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: file.path)
        var directory = file.deletingLastPathComponent()
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try directory.setResourceValues(values)
    }
    func stop() {
        stoppedDuration = recorder?.currentTime ?? stoppedDuration
        recorder?.stop()
        player?.stop()
        remotePlayer?.pause()
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
    func data() throws -> Data { try NativeWavCodec().canonical(Data(contentsOf: file)) }
    func play() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .spokenAudio)
        try session.setActive(true)
        player = try AVAudioPlayer(contentsOf: file)
        player?.play()
    }
    func play(url: URL) throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .spokenAudio)
        try session.setActive(true)
        remotePlayer = AVPlayer(url: url)
        remotePlayer?.play()
    }
    func delete() throws {
        stop()
        if hasRecording { try FileManager.default.removeItem(at: file) }
    }
}
