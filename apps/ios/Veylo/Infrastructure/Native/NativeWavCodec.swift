import Foundation

struct NativeWavCodec {
    func canonical(_ data: Data) throws -> Data {
        let bytes = [UInt8](data)
        func value(_ offset: Int, _ length: Int) -> Int {
            (0..<length).reduce(0) { $0 | Int(bytes[offset + $1]) << ($1 * 8) }
        }
        func label(_ offset: Int) -> String { String(decoding: bytes[offset..<offset + 4], as: UTF8.self) }
        let failure = NativeFailure(
            code: "INVALID_RECORDING", message: "This recording could not be prepared. Record your answer again.")
        guard bytes.count >= 44, bytes.count <= 20_971_520, label(0) == "RIFF", label(8) == "WAVE" else {
            throw failure
        }
        var offset = 12
        var formatValid = false
        var samples: ArraySlice<UInt8>?
        while offset + 8 <= bytes.count {
            let count = value(offset + 4, 4)
            let start = offset + 8
            guard count <= bytes.count - start else { throw failure }
            if label(offset) == "fmt " {
                guard count >= 16 else { throw failure }
                formatValid =
                    value(start, 2) == 1 && value(start + 2, 2) == 1 && value(start + 4, 4) == 16000
                    && value(start + 8, 4) == 32000 && value(start + 12, 2) == 2 && value(start + 14, 2) == 16
            } else if label(offset) == "data" {
                samples = bytes[start..<start + count]
            }
            offset = start + count + count % 2
        }
        guard formatValid, let samples, samples.count.isMultiple(of: 2) else { throw failure }
        var result = Data()
        func append(_ value: Int, bytes count: Int) {
            result.append(contentsOf: (0..<count).map { UInt8(truncatingIfNeeded: value >> ($0 * 8)) })
        }
        result.append(Data("RIFF".utf8))
        append(36 + samples.count, bytes: 4)
        result.append(Data("WAVEfmt ".utf8))
        append(16, bytes: 4)
        append(1, bytes: 2)
        append(1, bytes: 2)
        append(16000, bytes: 4)
        append(32000, bytes: 4)
        append(2, bytes: 2)
        append(16, bytes: 2)
        result.append(Data("data".utf8))
        append(samples.count, bytes: 4)
        result.append(contentsOf: samples)
        return result
    }
}
