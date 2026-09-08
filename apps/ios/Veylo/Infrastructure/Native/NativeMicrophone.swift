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
    private var generation = 0
    private var deactivation: Task<Void, Never>?

    init(file: URL) { self.file = file }
    var isRecording: Bool { recorder?.isRecording == true }
    var hasRecording: Bool { FileManager.default.fileExists(atPath: file.path) }
    var duration: TimeInterval {
        let value = isRecording ? recorder?.currentTime ?? 0 : stoppedDuration
        return value.isFinite ? max(0, value) : 0
    }
    var level: Float {
        recorder?.updateMeters()
        let power = recorder?.averagePower(forChannel: 0) ?? -60
        return power.isFinite ? max(0, min(1, (power + 60) / 60)) : 0
    }

    func start() async throws {
        generation += 1
        let current = generation
        logger.info("Requesting record permission")
        var permitted = AVAudioApplication.shared.recordPermission == .granted
        if AVAudioApplication.shared.recordPermission == .undetermined {
            permitted = await AVAudioApplication.requestRecordPermission()
        }
        guard current == generation else { throw CancellationError() }
        guard permitted else {
            throw NativeFailure(
                code: "MICROPHONE_DENIED",
                message: "Enable microphone access for Veylo in Settings to record a practice answer.")
        }
        logger.info("Record permission granted")
        player?.stop()
        remotePlayer?.pause()
        do {
            try await activate(.playAndRecord, options: [.defaultToSpeaker, .allowBluetoothHFP])
            guard current == generation else { throw CancellationError() }
            logger.info("Audio session active")
            let prepared = try await Self.prepareRecorder(file)
            guard current == generation else {
                prepared.stop()
                try? FileManager.default.removeItem(at: file)
                throw CancellationError()
            }
            recorder = prepared
            stoppedDuration = 0
            logger.info("Recorder started")
        } catch {
            stop()
            throw error
        }
    }

    func stop() {
        generation += 1
        stoppedDuration = recorder?.currentTime ?? stoppedDuration
        recorder?.stop()
        player?.stop()
        remotePlayer?.pause()
        let previous = deactivation
        deactivation = Task {
            await previous?.value
            _ = try? await AVAudioSession.sharedInstance().deactivate(options: [.notifyOthersOnDeactivation])
        }
    }

    func data() throws -> Data { try NativeWavCodec().canonical(Data(contentsOf: file)) }

    func play() async throws {
        let current = generation
        try await activate(.playback)
        guard current == generation else { throw CancellationError() }
        player = try AVAudioPlayer(contentsOf: file)
        player?.play()
    }

    func play(url: URL) async throws {
        let current = generation
        try await activate(.playback)
        guard current == generation else { throw CancellationError() }
        remotePlayer = AVPlayer(url: url)
        remotePlayer?.play()
    }

    func delete() throws {
        stop()
        if hasRecording { try FileManager.default.removeItem(at: file) }
    }

    private func activate(
        _ category: AVAudioSession.Category, options: AVAudioSession.CategoryOptions = []
    ) async throws {
        let current = generation
        await deactivation?.value
        guard current == generation else { throw CancellationError() }
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(category, mode: .spokenAudio, options: options)
        let activated = try await session.activate(options: [])
        guard current == generation else {
            stop()
            throw CancellationError()
        }
        guard activated else {
            throw NativeFailure(code: "AUDIO_UNAVAILABLE", message: "Audio is unavailable. Please try again.")
        }
    }

    @concurrent private static func prepareRecorder(_ file: URL) async throws -> sending AVAudioRecorder {
        try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
        var directory = file.deletingLastPathComponent()
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try directory.setResourceValues(values)
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
        try FileManager.default.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: file.path)
        recorder.isMeteringEnabled = true
        guard recorder.record(forDuration: 600) else {
            throw NativeFailure(code: "RECORDING_FAILED", message: "The microphone could not start recording.")
        }
        return recorder
    }
}
