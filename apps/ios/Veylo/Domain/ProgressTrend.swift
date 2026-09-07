import Foundation

struct ProgressPoint: Identifiable, Equatable {
    var date: Date
    var band: Double
    var id: Date { date }
}

struct ProgressTrend {
    let points: [ProgressPoint]
    let resultCount: Int
    let target: Double

    init(results: [PracticeResult], target: Double, skill: Skill?, since: Date?) {
        let filtered = results.filter { result in
            (skill == nil || result.skill == skill) && (since.map { result.date >= $0 } ?? true)
        }
        let calendar = Calendar(identifier: .gregorian)
        let grouped = Dictionary(grouping: filtered) { calendar.startOfDay(for: $0.date) }
        points = grouped.keys.sorted().map { date in
            let latest = Dictionary(grouping: grouped[date] ?? [], by: \.skill).values.compactMap {
                $0.max(by: { $0.date < $1.date })?.band
            }
            let average = latest.reduce(0, +) / Double(max(1, latest.count))
            return ProgressPoint(date: date, band: (average * 2).rounded() / 2)
        }
        resultCount = filtered.count
        self.target = target
    }

    var hasEnoughData: Bool { resultCount >= 3 }
    var currentBand: Double? { points.last?.band }
    var change: Double { (points.last?.band ?? 0) - (points.first?.band ?? 0) }
    var targetReached: Bool { (currentBand ?? 0) >= target }

    var projectedDate: Date? {
        guard hasEnoughData, !targetReached, points.count >= 3,
            let first = points.first, let last = points.last,
            last.date.timeIntervalSince(first.date) >= 86_400 * 7, change > 0
        else { return nil }
        let secondsPerBand = last.date.timeIntervalSince(first.date) / change
        let remaining = (target - last.band) * secondsPerBand
        guard remaining <= 86_400 * 365 else { return nil }
        return last.date.addingTimeInterval(remaining)
    }
}
