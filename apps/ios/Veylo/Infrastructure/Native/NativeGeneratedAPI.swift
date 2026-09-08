import Foundation
import VeyloAPI

@MainActor
enum NativeGeneratedAPI {
    static func call(client: Client, method: String, path: String, body: Data?) async throws -> Data {
        guard let url = URLComponents(string: path) else { throw NativeFailure(code: "INVALID_ROUTE", message: "Invalid request.") }
        let parts = url.path.split(separator: "/").map(String.init)
        let query = Dictionary((url.queryItems ?? []).map { ($0.name, $0.value ?? "") }, uniquingKeysWith: { _, last in last })
        if method == "GET" && parts.count == 1 && parts[0] == "profile" {
            let output = try await client.iosGetProfile(.init())
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "PATCH" && parts.count == 1 && parts[0] == "profile" {
            let output = try await client.iosSaveProfile(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosSaveProfileRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "DELETE" && parts.count == 1 && parts[0] == "profile" {
            let output = try await client.iosDeleteAccount(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosDeleteAccountRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 2 && parts[0] == "chat" && parts[1] == "threads" {
            let output = try await client.iosListChatThreads(.init())
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 4 && parts[0] == "chat" && parts[1] == "threads" && parts[3] == "messages" {
            let output = try await client.iosListChatMessages(.init(path: .init(id: parts[2])))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 1 && parts[0] == "tasks" {
            let output = try await client.iosListTasks(.init(query: .init(skill: query["skill"].flatMap { .init(rawValue: $0) }, topic: query["topic"], format: query["format"], part: query["part"], status: query["status"].flatMap { .init(rawValue: $0) }, q: query["q"], sort: query["sort"].flatMap { .init(rawValue: $0) }, page: query["page"].flatMap(Int.init))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 2 && parts[0] == "tasks" {
            let output = try await client.iosGetTask(.init(path: .init(id: parts[1])))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 1 && parts[0] == "attempts" {
            let output = try await client.iosCreateAttempt(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosCreateAttemptRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 2 && parts[0] == "attempts" {
            let output = try await client.iosGetAttempt(.init(path: .init(id: parts[1])))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "PATCH" && parts.count == 2 && parts[0] == "attempts" {
            let output = try await client.iosSaveAttempt(.init(path: .init(id: parts[1]), body: .json(try JSONDecoder().decode(Components.Schemas.IosSaveAttemptRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 3 && parts[0] == "attempts" && parts[2] == "result" {
            let output = try await client.iosGetResult(.init(path: .init(id: parts[1])))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 3 && parts[0] == "attempts" && parts[2] == "submit" {
            let output = try await client.iosSubmitAttempt(.init(path: .init(id: parts[1]), body: .json(try JSONDecoder().decode(Components.Schemas.IosSubmitAttemptRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 3 && parts[0] == "attempts" && parts[2] == "revisions" {
            let output = try await client.iosReviseAttempt(.init(path: .init(id: parts[1]), body: .json(try JSONDecoder().decode(Components.Schemas.IosReviseAttemptRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 3 && parts[0] == "attempts" && parts[2] == "retry-assessment" {
            let output = try await client.iosRetryAssessment(.init(path: .init(id: parts[1]), body: .json(try JSONDecoder().decode(Components.Schemas.IosRetryAssessmentRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 2 && parts[0] == "audio" && parts[1] == "upload-ticket" {
            let output = try await client.iosUploadAudioTicket(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosUploadAudioTicketRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 3 && parts[0] == "audio" && parts[2] == "complete" {
            let output = try await client.iosCompleteAudio(.init(path: .init(id: parts[1]), body: .json(try JSONDecoder().decode(Components.Schemas.IosCompleteAudioRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 2 && parts[0] == "audio" {
            let output = try await client.iosPlayAudio(.init(path: .init(id: parts[1])))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "DELETE" && parts.count == 2 && parts[0] == "audio" {
            let output = try await client.iosDeleteAudio(.init(path: .init(id: parts[1]), body: .json(try JSONDecoder().decode(Components.Schemas.IosDeleteAudioRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 2 && parts[0] == "chat" && parts[1] == "feedback" {
            let output = try await client.iosConversationFeedback(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosConversationFeedbackRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 1 && parts[0] == "vocabulary" {
            let output = try await client.iosListVocabulary(.init())
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 2 && parts[0] == "vocabulary" && parts[1] == "suggest" {
            let output = try await client.iosSuggestWord(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosSuggestWordRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 2 && parts[0] == "vocabulary" && parts[1] == "words" {
            let output = try await client.iosAddWord(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosAddWordRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 2 && parts[0] == "vocabulary" && parts[1] == "saved" {
            let output = try await client.iosSaveWord(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosSaveWordRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 2 && parts[0] == "vocabulary" && parts[1] == "quizzes" {
            let output = try await client.iosCreateVocabularyQuiz(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosCreateVocabularyQuizRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 3 && parts[0] == "vocabulary" && parts[1] == "quizzes" {
            let output = try await client.iosGetVocabularyQuiz(.init(path: .init(id: parts[2])))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 4 && parts[0] == "vocabulary" && parts[1] == "quizzes" && parts[3] == "submit" {
            let output = try await client.iosSubmitVocabularyQuiz(.init(path: .init(id: parts[2]), body: .json(try JSONDecoder().decode(Components.Schemas.IosSubmitVocabularyQuizRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 1 && parts[0] == "bootstrap" {
            let output = try await client.iosBootstrap(.init())
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 1 && parts[0] == "onboarding" {
            let output = try await client.iosGetOnboarding(.init())
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "PATCH" && parts.count == 1 && parts[0] == "onboarding" {
            let output = try await client.iosSaveOnboarding(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosSaveOnboardingRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "PATCH" && parts.count == 1 && parts[0] == "preferences" {
            let output = try await client.iosSavePreferences(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosSavePreferencesRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 1 && parts[0] == "dashboard" {
            let output = try await client.iosDashboard(.init())
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 1 && parts[0] == "statistics" {
            let output = try await client.iosStatistics(.init(query: .init(days: query["days"].flatMap(Int.init))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 3 && parts[0] == "attempts" && parts[2] == "notes" {
            let output = try await client.iosGetNotes(.init(path: .init(id: parts[1])))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "PATCH" && parts.count == 3 && parts[0] == "attempts" && parts[2] == "notes" {
            let output = try await client.iosSaveNotes(.init(path: .init(id: parts[1]), body: .json(try JSONDecoder().decode(Components.Schemas.IosSaveNotesRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 1 && parts[0] == "events" {
            let output = try await client.iosRecordEvent(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosRecordEventRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 1 && parts[0] == "word-sprints" {
            let output = try await client.iosStartSprint(.init(body: .json(try JSONDecoder().decode(Components.Schemas.IosStartSprintRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "GET" && parts.count == 2 && parts[0] == "word-sprints" {
            let output = try await client.iosGetSprint(.init(path: .init(id: parts[1])))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        if method == "POST" && parts.count == 2 && parts[0] == "word-sprints" {
            let output = try await client.iosAnswerSprint(.init(path: .init(id: parts[1]), body: .json(try JSONDecoder().decode(Components.Schemas.IosAnswerSprintRequest.self, from: body ?? Data("{}".utf8)))))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }
        throw NativeFailure(code: "INVALID_ROUTE", message: "This request is not in the API contract.")
    }
}
