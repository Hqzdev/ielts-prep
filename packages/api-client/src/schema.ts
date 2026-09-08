export interface paths {
    "/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getProfile"];
        put?: never;
        post?: never;
        delete: operations["deleteAccount"];
        options?: never;
        head?: never;
        patch: operations["saveProfile"];
        trace?: never;
    };
    "/chat/threads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listChatThreads"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chat/threads/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listChatMessages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listTasks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tasks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTask"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createAttempt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attempts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAttempt"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["saveAttempt"];
        trace?: never;
    };
    "/attempts/{id}/result": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getResult"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attempts/{id}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["submitAttempt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attempts/{id}/revisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reviseAttempt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attempts/{id}/retry-assessment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["retryAssessment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getDashboard"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/statistics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getStatistics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/streak": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getStreak"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/learning/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["startStudySession"];
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["moveStudySession"];
        trace?: never;
    };
    "/invitations/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["acceptInvitation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audio/upload-ticket": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["uploadAudioTicket"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audio/{id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["completeAudio"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audio/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["playAudio"];
        put?: never;
        post?: never;
        delete: operations["deleteAudio"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audio/question": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["questionAudio"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chat/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["chatHistory"];
        put?: never;
        post: operations["replyToConversation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chat/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["startConversation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chat/audio/transcribe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["transcribeVoice"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chat/audio/speak": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["speakReply"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chat/audio/welcome": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["welcomeAudio"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chat/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["conversationFeedback"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vocabulary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listVocabulary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vocabulary/suggest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["suggestWord"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vocabulary/words": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["addWord"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vocabulary/saved": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["saveWord"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vocabulary/quizzes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createVocabularyQuiz"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vocabulary/quizzes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getVocabularyQuiz"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/vocabulary/quizzes/{id}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["submitVocabularyQuiz"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/arcade-rounds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["startArcadeRound"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/arcade-rounds/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["finishArcadeRound"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/arcade": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["startSpeakingArcade"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/arcade/{id}/finish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["finishSpeakingArcade"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["issueInvitation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["publishTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["importContent"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosGetProfile"];
        put?: never;
        post?: never;
        delete: operations["iosDeleteAccount"];
        options?: never;
        head?: never;
        patch: operations["iosSaveProfile"];
        trace?: never;
    };
    "/ios/chat/threads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosListChatThreads"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/chat/threads/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosListChatMessages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosListTasks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/tasks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosGetTask"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosCreateAttempt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/attempts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosGetAttempt"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["iosSaveAttempt"];
        trace?: never;
    };
    "/ios/attempts/{id}/result": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosGetResult"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/attempts/{id}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosSubmitAttempt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/attempts/{id}/revisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosReviseAttempt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/attempts/{id}/retry-assessment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosRetryAssessment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/audio/upload-ticket": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosUploadAudioTicket"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/audio/{id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosCompleteAudio"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/audio/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosPlayAudio"];
        put?: never;
        post?: never;
        delete: operations["iosDeleteAudio"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/chat/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosReplyToConversation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/chat/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosConversationFeedback"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/vocabulary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosListVocabulary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/vocabulary/suggest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosSuggestWord"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/vocabulary/words": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosAddWord"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/vocabulary/saved": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosSaveWord"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/vocabulary/quizzes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosCreateVocabularyQuiz"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/vocabulary/quizzes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosGetVocabularyQuiz"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/vocabulary/quizzes/{id}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosSubmitVocabularyQuiz"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/bootstrap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosBootstrap"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/onboarding": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosGetOnboarding"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["iosSaveOnboarding"];
        trace?: never;
    };
    "/ios/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["iosSavePreferences"];
        trace?: never;
    };
    "/ios/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosDashboard"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/statistics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosStatistics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/attempts/{id}/notes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosGetNotes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["iosSaveNotes"];
        trace?: never;
    };
    "/ios/attempts/{id}/hints": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosHint"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosRecordEvent"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/word-sprints": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["iosStartSprint"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ios/word-sprints/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["iosGetSprint"];
        put?: never;
        post: operations["iosAnswerSprint"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ApiError: {
            error: {
                code: string;
                message: string;
                requestId?: string;
            };
        };
        GetProfileResponse: {
            name: string;
            targetBand: number;
            selfReportedBand: number | null;
            examDate: string | null;
            dailyMinutes: number;
            studyDays: number[];
            timezone: string;
            id: string;
            email: string;
            role: "student" | "admin";
            betaAccess: boolean;
            onboarded: boolean;
        };
        ListChatThreadsResponse: {
            id: string;
            title: string;
            attemptId: string | null;
            createdAt: string;
        }[];
        ListChatMessagesResponse: {
            provider?: string;
            model?: string | null;
            id: string;
            role: "user" | "assistant";
            content: string;
            status: string;
        }[];
        ListTasksResponse: {
            items: {
                task: {
                    id: string;
                    version: number;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    part: number;
                    topic: string;
                    format: string;
                    durationSeconds: number;
                    minimumWords: number;
                    prompt: string;
                    instructions: string;
                    createdAt: string;
                    source: string;
                    passageId?: string;
                    paragraphs: {
                        label: string;
                        text: string;
                    }[];
                    readingQuestions: {
                        number: number;
                        statement: string;
                        mode: "single" | "multiple" | "text";
                        options: {
                            value: string;
                            label: string;
                        }[];
                        selectCount: number;
                        maxWords?: number;
                        allowNumber: boolean;
                        group?: string;
                        label?: string;
                    }[];
                    readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                    reuseAllowed: boolean;
                    diagram?: {
                        title: string;
                        nodes: {
                            id: string;
                            label: string;
                            x: number;
                            y: number;
                            questionNumber?: number;
                        }[];
                        edges: {
                            source: string;
                            target: string;
                        }[];
                    };
                    visual?: {
                        chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                        title: string;
                        unit?: string;
                        periods: string[];
                        dataSeries: {
                            category: string;
                            values: {
                                [key: string]: number;
                            };
                        }[];
                        processKind?: "linear" | "cyclical";
                        processSteps: string[];
                    };
                    speakingQuestions: string[];
                    cuePoints: string[];
                    preparationSeconds: number;
                    relatedTaskId?: string;
                };
                status: "new" | "started" | "completed";
                lastAttemptId: string | null;
                lastBand: number | null;
                lastAccuracy: number | null;
                lastActivity: string | null;
            }[];
            total: number;
            page: number;
        };
        GetTaskResponse: {
            id: string;
            version: number;
            title: string;
            skill: "writing" | "speaking" | "reading";
            part: number;
            topic: string;
            format: string;
            durationSeconds: number;
            minimumWords: number;
            prompt: string;
            instructions: string;
            createdAt: string;
            source: string;
            passageId?: string;
            paragraphs: {
                label: string;
                text: string;
            }[];
            readingQuestions: {
                number: number;
                statement: string;
                mode: "single" | "multiple" | "text";
                options: {
                    value: string;
                    label: string;
                }[];
                selectCount: number;
                maxWords?: number;
                allowNumber: boolean;
                group?: string;
                label?: string;
            }[];
            readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
            reuseAllowed: boolean;
            diagram?: {
                title: string;
                nodes: {
                    id: string;
                    label: string;
                    x: number;
                    y: number;
                    questionNumber?: number;
                }[];
                edges: {
                    source: string;
                    target: string;
                }[];
            };
            visual?: {
                chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                title: string;
                unit?: string;
                periods: string[];
                dataSeries: {
                    category: string;
                    values: {
                        [key: string]: number;
                    };
                }[];
                processKind?: "linear" | "cyclical";
                processSteps: string[];
            };
            speakingQuestions: string[];
            cuePoints: string[];
            preparationSeconds: number;
            relatedTaskId?: string;
        };
        CreateAttemptResponse: {
            client?: "web" | "ios";
            requestedModel?: string | null;
            id: string;
            userId: string;
            taskId: string;
            taskVersion: number;
            taskSnapshot: {
                id: string;
                version: number;
                title: string;
                skill: "writing" | "speaking" | "reading";
                part: number;
                topic: string;
                format: string;
                durationSeconds: number;
                minimumWords: number;
                prompt: string;
                instructions: string;
                createdAt: string;
                source: string;
                passageId?: string;
                paragraphs: {
                    label: string;
                    text: string;
                }[];
                readingQuestions: {
                    number: number;
                    statement: string;
                    mode: "single" | "multiple" | "text";
                    options: {
                        value: string;
                        label: string;
                    }[];
                    selectCount: number;
                    maxWords?: number;
                    allowNumber: boolean;
                    group?: string;
                    label?: string;
                }[];
                readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                reuseAllowed: boolean;
                diagram?: {
                    title: string;
                    nodes: {
                        id: string;
                        label: string;
                        x: number;
                        y: number;
                        questionNumber?: number;
                    }[];
                    edges: {
                        source: string;
                        target: string;
                    }[];
                };
                visual?: {
                    chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                    title: string;
                    unit?: string;
                    periods: string[];
                    dataSeries: {
                        category: string;
                        values: {
                            [key: string]: number;
                        };
                    }[];
                    processKind?: "linear" | "cyclical";
                    processSteps: string[];
                };
                speakingQuestions: string[];
                cuePoints: string[];
                preparationSeconds: number;
                relatedTaskId?: string;
            };
            mode: "practice" | "strict";
            status: "in_progress" | "paused" | "submitted" | "completed";
            answer: {
                text: string;
                reading: {
                    [key: string]: string | string[];
                };
                audioIds: string[];
            };
            revision: number;
            parentAttemptId: string | null;
            startedAt: string;
            deadlineAt: string | null;
            submittedAt: string | null;
            elapsedSeconds: number;
            activeSince: string | null;
            createdAt: string;
            updatedAt: string;
        };
        CreateAttemptRequest: {
            taskId: string;
            mode: "practice" | "strict";
        };
        GetAttemptResponse: {
            attempt: {
                client?: "web" | "ios";
                requestedModel?: string | null;
                id: string;
                userId: string;
                taskId: string;
                taskVersion: number;
                taskSnapshot: {
                    id: string;
                    version: number;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    part: number;
                    topic: string;
                    format: string;
                    durationSeconds: number;
                    minimumWords: number;
                    prompt: string;
                    instructions: string;
                    createdAt: string;
                    source: string;
                    passageId?: string;
                    paragraphs: {
                        label: string;
                        text: string;
                    }[];
                    readingQuestions: {
                        number: number;
                        statement: string;
                        mode: "single" | "multiple" | "text";
                        options: {
                            value: string;
                            label: string;
                        }[];
                        selectCount: number;
                        maxWords?: number;
                        allowNumber: boolean;
                        group?: string;
                        label?: string;
                    }[];
                    readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                    reuseAllowed: boolean;
                    diagram?: {
                        title: string;
                        nodes: {
                            id: string;
                            label: string;
                            x: number;
                            y: number;
                            questionNumber?: number;
                        }[];
                        edges: {
                            source: string;
                            target: string;
                        }[];
                    };
                    visual?: {
                        chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                        title: string;
                        unit?: string;
                        periods: string[];
                        dataSeries: {
                            category: string;
                            values: {
                                [key: string]: number;
                            };
                        }[];
                        processKind?: "linear" | "cyclical";
                        processSteps: string[];
                    };
                    speakingQuestions: string[];
                    cuePoints: string[];
                    preparationSeconds: number;
                    relatedTaskId?: string;
                };
                mode: "practice" | "strict";
                status: "in_progress" | "paused" | "submitted" | "completed";
                answer: {
                    text: string;
                    reading: {
                        [key: string]: string | string[];
                    };
                    audioIds: string[];
                };
                revision: number;
                parentAttemptId: string | null;
                startedAt: string;
                deadlineAt: string | null;
                submittedAt: string | null;
                elapsedSeconds: number;
                activeSince: string | null;
                createdAt: string;
                updatedAt: string;
            };
            assessment: {
                provider?: "gemini" | "gigachat" | "deterministic";
                requestedModel?: string | null;
                id: string;
                attemptId: string;
                userId: string;
                status: "unavailable" | "queued" | "processing" | "ready" | "failed" | "insufficient_evidence";
                band: number | null;
                grade: {
                    sufficientEvidence: boolean;
                    insufficientReason: string | null;
                    criteria: {
                        key: string;
                        label: string;
                        score: number;
                        explanation: string;
                    }[];
                    errors: {
                        category: "grammar" | "vocabulary" | "coherence" | "task_response" | "task_achievement" | "data_accuracy" | "fluency" | "pronunciation" | "reading";
                        subcategory: string;
                        issue: string;
                        correction: string;
                        anchor: {
                            type: "text";
                            quote: string;
                        } | {
                            type: "requirement";
                            requirement: string;
                        } | {
                            type: "audio";
                            audioId: string;
                            startSeconds: number;
                            endSeconds: number;
                            quote: string;
                        } | {
                            type: "question";
                            number: number;
                            quote: string;
                        };
                    }[];
                    strengths: string[];
                    nextFocus: string;
                    fulfilledRequirements: {
                        requirement: string;
                        fulfilled: boolean;
                        explanation: string;
                    }[];
                } | null;
                reading: {
                    number: number;
                    statement: string;
                    given: string[];
                    expected: string[];
                    correct: boolean;
                    earned: number;
                    possible: number;
                    paragraph: string;
                    evidence: string;
                    explanation: string;
                }[] | null;
                transcripts: {
                    audioId: string;
                    text: string;
                    segments: {
                        startSeconds: number;
                        endSeconds: number;
                        text: string;
                    }[];
                }[];
                model: string | null;
                rubricVersion: string;
                errorCode: string | null;
                createdAt: string;
                completedAt: string | null;
            } | null;
        };
        SaveAttemptResponse: {
            client?: "web" | "ios";
            requestedModel?: string | null;
            id: string;
            userId: string;
            taskId: string;
            taskVersion: number;
            taskSnapshot: {
                id: string;
                version: number;
                title: string;
                skill: "writing" | "speaking" | "reading";
                part: number;
                topic: string;
                format: string;
                durationSeconds: number;
                minimumWords: number;
                prompt: string;
                instructions: string;
                createdAt: string;
                source: string;
                passageId?: string;
                paragraphs: {
                    label: string;
                    text: string;
                }[];
                readingQuestions: {
                    number: number;
                    statement: string;
                    mode: "single" | "multiple" | "text";
                    options: {
                        value: string;
                        label: string;
                    }[];
                    selectCount: number;
                    maxWords?: number;
                    allowNumber: boolean;
                    group?: string;
                    label?: string;
                }[];
                readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                reuseAllowed: boolean;
                diagram?: {
                    title: string;
                    nodes: {
                        id: string;
                        label: string;
                        x: number;
                        y: number;
                        questionNumber?: number;
                    }[];
                    edges: {
                        source: string;
                        target: string;
                    }[];
                };
                visual?: {
                    chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                    title: string;
                    unit?: string;
                    periods: string[];
                    dataSeries: {
                        category: string;
                        values: {
                            [key: string]: number;
                        };
                    }[];
                    processKind?: "linear" | "cyclical";
                    processSteps: string[];
                };
                speakingQuestions: string[];
                cuePoints: string[];
                preparationSeconds: number;
                relatedTaskId?: string;
            };
            mode: "practice" | "strict";
            status: "in_progress" | "paused" | "submitted" | "completed";
            answer: {
                text: string;
                reading: {
                    [key: string]: string | string[];
                };
                audioIds: string[];
            };
            revision: number;
            parentAttemptId: string | null;
            startedAt: string;
            deadlineAt: string | null;
            submittedAt: string | null;
            elapsedSeconds: number;
            activeSince: string | null;
            createdAt: string;
            updatedAt: string;
        };
        SaveAttemptRequest: {
            revision: number;
            answer: {
                text?: string;
                reading?: {
                    [key: string]: string | string[];
                };
                audioIds?: string[];
            };
            action?: "pause" | "resume";
        };
        GetResultResponse: {
            attempt: {
                client?: "web" | "ios";
                requestedModel?: string | null;
                id: string;
                userId: string;
                taskId: string;
                taskVersion: number;
                taskSnapshot: {
                    id: string;
                    version: number;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    part: number;
                    topic: string;
                    format: string;
                    durationSeconds: number;
                    minimumWords: number;
                    prompt: string;
                    instructions: string;
                    createdAt: string;
                    source: string;
                    passageId?: string;
                    paragraphs: {
                        label: string;
                        text: string;
                    }[];
                    readingQuestions: {
                        number: number;
                        statement: string;
                        mode: "single" | "multiple" | "text";
                        options: {
                            value: string;
                            label: string;
                        }[];
                        selectCount: number;
                        maxWords?: number;
                        allowNumber: boolean;
                        group?: string;
                        label?: string;
                    }[];
                    readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                    reuseAllowed: boolean;
                    diagram?: {
                        title: string;
                        nodes: {
                            id: string;
                            label: string;
                            x: number;
                            y: number;
                            questionNumber?: number;
                        }[];
                        edges: {
                            source: string;
                            target: string;
                        }[];
                    };
                    visual?: {
                        chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                        title: string;
                        unit?: string;
                        periods: string[];
                        dataSeries: {
                            category: string;
                            values: {
                                [key: string]: number;
                            };
                        }[];
                        processKind?: "linear" | "cyclical";
                        processSteps: string[];
                    };
                    speakingQuestions: string[];
                    cuePoints: string[];
                    preparationSeconds: number;
                    relatedTaskId?: string;
                };
                mode: "practice" | "strict";
                status: "in_progress" | "paused" | "submitted" | "completed";
                answer: {
                    text: string;
                    reading: {
                        [key: string]: string | string[];
                    };
                    audioIds: string[];
                };
                revision: number;
                parentAttemptId: string | null;
                startedAt: string;
                deadlineAt: string | null;
                submittedAt: string | null;
                elapsedSeconds: number;
                activeSince: string | null;
                createdAt: string;
                updatedAt: string;
            };
            assessment: {
                provider?: "gemini" | "gigachat" | "deterministic";
                requestedModel?: string | null;
                id: string;
                attemptId: string;
                userId: string;
                status: "unavailable" | "queued" | "processing" | "ready" | "failed" | "insufficient_evidence";
                band: number | null;
                grade: {
                    sufficientEvidence: boolean;
                    insufficientReason: string | null;
                    criteria: {
                        key: string;
                        label: string;
                        score: number;
                        explanation: string;
                    }[];
                    errors: {
                        category: "grammar" | "vocabulary" | "coherence" | "task_response" | "task_achievement" | "data_accuracy" | "fluency" | "pronunciation" | "reading";
                        subcategory: string;
                        issue: string;
                        correction: string;
                        anchor: {
                            type: "text";
                            quote: string;
                        } | {
                            type: "requirement";
                            requirement: string;
                        } | {
                            type: "audio";
                            audioId: string;
                            startSeconds: number;
                            endSeconds: number;
                            quote: string;
                        } | {
                            type: "question";
                            number: number;
                            quote: string;
                        };
                    }[];
                    strengths: string[];
                    nextFocus: string;
                    fulfilledRequirements: {
                        requirement: string;
                        fulfilled: boolean;
                        explanation: string;
                    }[];
                } | null;
                reading: {
                    number: number;
                    statement: string;
                    given: string[];
                    expected: string[];
                    correct: boolean;
                    earned: number;
                    possible: number;
                    paragraph: string;
                    evidence: string;
                    explanation: string;
                }[] | null;
                transcripts: {
                    audioId: string;
                    text: string;
                    segments: {
                        startSeconds: number;
                        endSeconds: number;
                        text: string;
                    }[];
                }[];
                model: string | null;
                rubricVersion: string;
                errorCode: string | null;
                createdAt: string;
                completedAt: string | null;
            } | null;
        };
        SubmitAttemptResponse: {
            provider?: "gemini" | "gigachat" | "deterministic";
            requestedModel?: string | null;
            id: string;
            attemptId: string;
            userId: string;
            status: "unavailable" | "queued" | "processing" | "ready" | "failed" | "insufficient_evidence";
            band: number | null;
            grade: {
                sufficientEvidence: boolean;
                insufficientReason: string | null;
                criteria: {
                    key: string;
                    label: string;
                    score: number;
                    explanation: string;
                }[];
                errors: {
                    category: "grammar" | "vocabulary" | "coherence" | "task_response" | "task_achievement" | "data_accuracy" | "fluency" | "pronunciation" | "reading";
                    subcategory: string;
                    issue: string;
                    correction: string;
                    anchor: {
                        type: "text";
                        quote: string;
                    } | {
                        type: "requirement";
                        requirement: string;
                    } | {
                        type: "audio";
                        audioId: string;
                        startSeconds: number;
                        endSeconds: number;
                        quote: string;
                    } | {
                        type: "question";
                        number: number;
                        quote: string;
                    };
                }[];
                strengths: string[];
                nextFocus: string;
                fulfilledRequirements: {
                    requirement: string;
                    fulfilled: boolean;
                    explanation: string;
                }[];
            } | null;
            reading: {
                number: number;
                statement: string;
                given: string[];
                expected: string[];
                correct: boolean;
                earned: number;
                possible: number;
                paragraph: string;
                evidence: string;
                explanation: string;
            }[] | null;
            transcripts: {
                audioId: string;
                text: string;
                segments: {
                    startSeconds: number;
                    endSeconds: number;
                    text: string;
                }[];
            }[];
            model: string | null;
            rubricVersion: string;
            errorCode: string | null;
            createdAt: string;
            completedAt: string | null;
        };
        SubmitAttemptRequest: Record<string, never>;
        ReviseAttemptResponse: {
            client?: "web" | "ios";
            requestedModel?: string | null;
            id: string;
            userId: string;
            taskId: string;
            taskVersion: number;
            taskSnapshot: {
                id: string;
                version: number;
                title: string;
                skill: "writing" | "speaking" | "reading";
                part: number;
                topic: string;
                format: string;
                durationSeconds: number;
                minimumWords: number;
                prompt: string;
                instructions: string;
                createdAt: string;
                source: string;
                passageId?: string;
                paragraphs: {
                    label: string;
                    text: string;
                }[];
                readingQuestions: {
                    number: number;
                    statement: string;
                    mode: "single" | "multiple" | "text";
                    options: {
                        value: string;
                        label: string;
                    }[];
                    selectCount: number;
                    maxWords?: number;
                    allowNumber: boolean;
                    group?: string;
                    label?: string;
                }[];
                readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                reuseAllowed: boolean;
                diagram?: {
                    title: string;
                    nodes: {
                        id: string;
                        label: string;
                        x: number;
                        y: number;
                        questionNumber?: number;
                    }[];
                    edges: {
                        source: string;
                        target: string;
                    }[];
                };
                visual?: {
                    chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                    title: string;
                    unit?: string;
                    periods: string[];
                    dataSeries: {
                        category: string;
                        values: {
                            [key: string]: number;
                        };
                    }[];
                    processKind?: "linear" | "cyclical";
                    processSteps: string[];
                };
                speakingQuestions: string[];
                cuePoints: string[];
                preparationSeconds: number;
                relatedTaskId?: string;
            };
            mode: "practice" | "strict";
            status: "in_progress" | "paused" | "submitted" | "completed";
            answer: {
                text: string;
                reading: {
                    [key: string]: string | string[];
                };
                audioIds: string[];
            };
            revision: number;
            parentAttemptId: string | null;
            startedAt: string;
            deadlineAt: string | null;
            submittedAt: string | null;
            elapsedSeconds: number;
            activeSince: string | null;
            createdAt: string;
            updatedAt: string;
        };
        ReviseAttemptRequest: Record<string, never>;
        RetryAssessmentResponse: {
            provider?: "gemini" | "gigachat" | "deterministic";
            requestedModel?: string | null;
            id: string;
            attemptId: string;
            userId: string;
            status: "unavailable" | "queued" | "processing" | "ready" | "failed" | "insufficient_evidence";
            band: number | null;
            grade: {
                sufficientEvidence: boolean;
                insufficientReason: string | null;
                criteria: {
                    key: string;
                    label: string;
                    score: number;
                    explanation: string;
                }[];
                errors: {
                    category: "grammar" | "vocabulary" | "coherence" | "task_response" | "task_achievement" | "data_accuracy" | "fluency" | "pronunciation" | "reading";
                    subcategory: string;
                    issue: string;
                    correction: string;
                    anchor: {
                        type: "text";
                        quote: string;
                    } | {
                        type: "requirement";
                        requirement: string;
                    } | {
                        type: "audio";
                        audioId: string;
                        startSeconds: number;
                        endSeconds: number;
                        quote: string;
                    } | {
                        type: "question";
                        number: number;
                        quote: string;
                    };
                }[];
                strengths: string[];
                nextFocus: string;
                fulfilledRequirements: {
                    requirement: string;
                    fulfilled: boolean;
                    explanation: string;
                }[];
            } | null;
            reading: {
                number: number;
                statement: string;
                given: string[];
                expected: string[];
                correct: boolean;
                earned: number;
                possible: number;
                paragraph: string;
                evidence: string;
                explanation: string;
            }[] | null;
            transcripts: {
                audioId: string;
                text: string;
                segments: {
                    startSeconds: number;
                    endSeconds: number;
                    text: string;
                }[];
            }[];
            model: string | null;
            rubricVersion: string;
            errorCode: string | null;
            createdAt: string;
            completedAt: string | null;
        };
        RetryAssessmentRequest: Record<string, never>;
        GetDashboardResponse: {
            today: string;
            week: string;
            sessions: {
                id: string;
                scheduledDate: string;
                weekStart: string;
                taskId: string;
                plannedMinutes: number;
                status: "planned" | "started" | "completed" | "skipped";
                attemptId: string | null;
                position: number;
                task: {
                    id: string;
                    version: number;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    part: number;
                    topic: string;
                    format: string;
                    durationSeconds: number;
                    minimumWords: number;
                    prompt: string;
                    instructions: string;
                    createdAt: string;
                    source: string;
                    passageId?: string;
                    paragraphs: {
                        label: string;
                        text: string;
                    }[];
                    readingQuestions: {
                        number: number;
                        statement: string;
                        mode: "single" | "multiple" | "text";
                        options: {
                            value: string;
                            label: string;
                        }[];
                        selectCount: number;
                        maxWords?: number;
                        allowNumber: boolean;
                        group?: string;
                        label?: string;
                    }[];
                    readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                    reuseAllowed: boolean;
                    diagram?: {
                        title: string;
                        nodes: {
                            id: string;
                            label: string;
                            x: number;
                            y: number;
                            questionNumber?: number;
                        }[];
                        edges: {
                            source: string;
                            target: string;
                        }[];
                    };
                    visual?: {
                        chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                        title: string;
                        unit?: string;
                        periods: string[];
                        dataSeries: {
                            category: string;
                            values: {
                                [key: string]: number;
                            };
                        }[];
                        processKind?: "linear" | "cyclical";
                        processSteps: string[];
                    };
                    speakingQuestions: string[];
                    cuePoints: string[];
                    preparationSeconds: number;
                    relatedTaskId?: string;
                };
            }[];
            statistics: {
                skills: {
                    skill: "writing" | "speaking" | "reading";
                    count: number;
                    latest: number | null;
                    average: number | null;
                    unit: "band";
                    series: {
                        date: string;
                        value: number;
                        part: number;
                        mode: string;
                    }[];
                    criteria: {
                        key: string;
                        label: string;
                        average: number;
                    }[];
                    formats: {
                        format: string;
                        correct: number;
                        total: number;
                        accuracy: number;
                    }[];
                    errors: {
                        category: string;
                        count: number;
                    }[];
                }[];
                independentCount: number;
                revisionCount: number;
                totalMinutes: number;
                history: {
                    id: string;
                    date: string;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    mode: "practice" | "strict";
                    band: number | null;
                    accuracy: number | null;
                    durationMinutes: number;
                }[];
                activity: {
                    date: string;
                    count: number;
                }[];
            };
            resume: {
                client?: "web" | "ios";
                requestedModel?: string | null;
                id: string;
                userId: string;
                taskId: string;
                taskVersion: number;
                taskSnapshot: {
                    id: string;
                    version: number;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    part: number;
                    topic: string;
                    format: string;
                    durationSeconds: number;
                    minimumWords: number;
                    prompt: string;
                    instructions: string;
                    createdAt: string;
                    source: string;
                    passageId?: string;
                    paragraphs: {
                        label: string;
                        text: string;
                    }[];
                    readingQuestions: {
                        number: number;
                        statement: string;
                        mode: "single" | "multiple" | "text";
                        options: {
                            value: string;
                            label: string;
                        }[];
                        selectCount: number;
                        maxWords?: number;
                        allowNumber: boolean;
                        group?: string;
                        label?: string;
                    }[];
                    readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                    reuseAllowed: boolean;
                    diagram?: {
                        title: string;
                        nodes: {
                            id: string;
                            label: string;
                            x: number;
                            y: number;
                            questionNumber?: number;
                        }[];
                        edges: {
                            source: string;
                            target: string;
                        }[];
                    };
                    visual?: {
                        chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                        title: string;
                        unit?: string;
                        periods: string[];
                        dataSeries: {
                            category: string;
                            values: {
                                [key: string]: number;
                            };
                        }[];
                        processKind?: "linear" | "cyclical";
                        processSteps: string[];
                    };
                    speakingQuestions: string[];
                    cuePoints: string[];
                    preparationSeconds: number;
                    relatedTaskId?: string;
                };
                mode: "practice" | "strict";
                status: "in_progress" | "paused" | "submitted" | "completed";
                answer: {
                    text: string;
                    reading: {
                        [key: string]: string | string[];
                    };
                    audioIds: string[];
                };
                revision: number;
                parentAttemptId: string | null;
                startedAt: string;
                deadlineAt: string | null;
                submittedAt: string | null;
                elapsedSeconds: number;
                activeSince: string | null;
                createdAt: string;
                updatedAt: string;
            } | null;
            focus: {
                category: string;
                count: number;
            } | null;
        };
        GetStatisticsResponse: {
            skills: {
                skill: "writing" | "speaking" | "reading";
                count: number;
                latest: number | null;
                average: number | null;
                unit: "band";
                series: {
                    date: string;
                    value: number;
                    part: number;
                    mode: string;
                }[];
                criteria: {
                    key: string;
                    label: string;
                    average: number;
                }[];
                formats: {
                    format: string;
                    correct: number;
                    total: number;
                    accuracy: number;
                }[];
                errors: {
                    category: string;
                    count: number;
                }[];
            }[];
            independentCount: number;
            revisionCount: number;
            totalMinutes: number;
            history: {
                id: string;
                date: string;
                title: string;
                skill: "writing" | "speaking" | "reading";
                mode: "practice" | "strict";
                band: number | null;
                accuracy: number | null;
                durationMinutes: number;
            }[];
            activity: {
                date: string;
                count: number;
            }[];
        };
        GetStreakResponse: {
            today: string;
            timezone: string;
            current: number;
            best: number;
            todayComplete: boolean;
            week: {
                date: string;
                label: string;
                state: "earned" | "today" | "missed" | "upcoming";
            }[];
        };
        StartStudySessionResponse: {
            client?: "web" | "ios";
            requestedModel?: string | null;
            id: string;
            userId: string;
            taskId: string;
            taskVersion: number;
            taskSnapshot: {
                id: string;
                version: number;
                title: string;
                skill: "writing" | "speaking" | "reading";
                part: number;
                topic: string;
                format: string;
                durationSeconds: number;
                minimumWords: number;
                prompt: string;
                instructions: string;
                createdAt: string;
                source: string;
                passageId?: string;
                paragraphs: {
                    label: string;
                    text: string;
                }[];
                readingQuestions: {
                    number: number;
                    statement: string;
                    mode: "single" | "multiple" | "text";
                    options: {
                        value: string;
                        label: string;
                    }[];
                    selectCount: number;
                    maxWords?: number;
                    allowNumber: boolean;
                    group?: string;
                    label?: string;
                }[];
                readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                reuseAllowed: boolean;
                diagram?: {
                    title: string;
                    nodes: {
                        id: string;
                        label: string;
                        x: number;
                        y: number;
                        questionNumber?: number;
                    }[];
                    edges: {
                        source: string;
                        target: string;
                    }[];
                };
                visual?: {
                    chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                    title: string;
                    unit?: string;
                    periods: string[];
                    dataSeries: {
                        category: string;
                        values: {
                            [key: string]: number;
                        };
                    }[];
                    processKind?: "linear" | "cyclical";
                    processSteps: string[];
                };
                speakingQuestions: string[];
                cuePoints: string[];
                preparationSeconds: number;
                relatedTaskId?: string;
            };
            mode: "practice" | "strict";
            status: "in_progress" | "paused" | "submitted" | "completed";
            answer: {
                text: string;
                reading: {
                    [key: string]: string | string[];
                };
                audioIds: string[];
            };
            revision: number;
            parentAttemptId: string | null;
            startedAt: string;
            deadlineAt: string | null;
            submittedAt: string | null;
            elapsedSeconds: number;
            activeSince: string | null;
            createdAt: string;
            updatedAt: string;
        };
        StartStudySessionRequest: Record<string, never>;
        MoveStudySessionResponse: {
            saved: boolean;
        };
        MoveStudySessionRequest: {
            date: string;
        };
        SaveProfileResponse: {
            saved: boolean;
        };
        SaveProfileRequest: {
            name: string;
            targetBand: number;
            selfReportedBand?: number | null;
            examDate?: string | null;
            dailyMinutes: number;
            studyDays: number[];
            timezone: string;
        };
        DeleteAccountResponse: {
            deleted: boolean;
        };
        DeleteAccountRequest: {
            confirmation: "DELETE";
        };
        AcceptInvitationResponse: {
            accepted: boolean;
        };
        AcceptInvitationRequest: {
            token: string;
        };
        UploadAudioTicketResponse: {
            id: string;
            path: string;
            token: string;
        };
        UploadAudioTicketRequest: {
            attemptId: string;
            questionIndex: number;
            bytes: number;
        };
        CompleteAudioResponse: {
            id: string;
            duration: number;
        };
        CompleteAudioRequest: Record<string, never>;
        PlayAudioResponse: {
            url: string;
            duration: number | null;
            expiresAt: string;
        };
        DeleteAudioResponse: {
            deleted: boolean;
        };
        DeleteAudioRequest: Record<string, never>;
        QuestionAudioResponse: {
            url: string;
        };
        QuestionAudioRequest: {
            taskId: string;
            questionIndex: number;
        };
        ChatHistoryResponse: {
            id: string;
            title: string;
            attemptId: string | null;
            createdAt: string;
        }[] | {
            provider?: string;
            model?: string | null;
            id: string;
            role: "user" | "assistant";
            content: string;
            status: string;
        }[];
        StartConversationEvent: {
            type: "thread";
            threadId: string;
            assistantId: string;
        } | {
            type: "expression";
            expression: "happy" | "cheeky" | "angry" | "sad" | "horrified" | "sheepish" | "smug" | "neutral" | "excited" | "skeptical" | "love" | "wince" | "surprised" | "annoyed" | "devastated" | "unamused" | "asleep" | "furious";
            position: "default" | "center" | "mid-left" | "mid-right" | "top-mid";
        } | {
            type: "token";
            text: string;
        } | {
            type: "error";
            message: string;
        } | {
            type: "done";
            status: string;
        };
        StartConversationRequest: {
            personality?: "classic" | "angry" | "kind" | "sarcastic";
            explicit?: boolean;
        };
        ReplyToConversationEvent: {
            type: "thread";
            threadId: string;
            assistantId: string;
        } | {
            type: "expression";
            expression: "happy" | "cheeky" | "angry" | "sad" | "horrified" | "sheepish" | "smug" | "neutral" | "excited" | "skeptical" | "love" | "wince" | "surprised" | "annoyed" | "devastated" | "unamused" | "asleep" | "furious";
            position: "default" | "center" | "mid-left" | "mid-right" | "top-mid";
        } | {
            type: "token";
            text: string;
        } | {
            type: "error";
            message: string;
        } | {
            type: "done";
            status: string;
        };
        ReplyToConversationRequest: {
            personality?: "classic" | "angry" | "kind" | "sarcastic";
            explicit?: boolean;
            content?: string;
            retryAssistantId?: string;
            threadId?: string;
            attemptId?: string;
        };
        TranscribeVoiceResponse: {
            text: string;
        };
        SpeakReplyResponse: {
            url: string;
        };
        SpeakReplyRequest: {
            personality?: "classic" | "angry" | "kind" | "sarcastic";
            explicit?: boolean;
            threadId: string;
            messageId: string;
        };
        WelcomeAudioResponse: {
            url: string;
        };
        WelcomeAudioRequest: Record<string, never>;
        ConversationFeedbackResponse: {
            status: "too_short";
        } | {
            status: "ready";
            feedback: {
                strengths: string[];
                improvements: {
                    quote: string;
                    correction: string;
                    explanation: string;
                }[];
                words: {
                    term: string;
                    meaning: string;
                    partOfSpeech: string;
                    example: string;
                }[];
            };
        };
        ConversationFeedbackRequest: {
            threadId: string;
        };
        ListVocabularyResponse: {
            id: string;
            ownerId: string | null;
            topic: string;
            term: string;
            translation: string;
            partOfSpeech: string;
            example: string;
            gapSentence: string;
            alternatives: string[];
            saved: boolean;
            correct: number;
            total: number;
        }[];
        SuggestWordResponse: {
            term: string;
            translation: string;
            partOfSpeech: string;
            example: string;
            topic: string;
        };
        SuggestWordRequest: {
            term: string;
            topic: string;
        };
        AddWordResponse: {
            id: string;
        };
        AddWordRequest: {
            term: string;
            translation: string;
            partOfSpeech: string;
            example: string;
            topic: string;
        };
        SaveWordResponse: {
            saved: boolean;
        };
        SaveWordRequest: {
            wordId: string;
            saved: boolean;
        };
        CreateVocabularyQuizResponse: {
            id: string;
            questions: {
                id: string;
                wordId: string;
                type: "translation" | "gap";
                prompt: string;
                options: string[];
            }[];
            result: {
                questionId: string;
                wordId: string;
                type: "translation" | "gap";
                given: string;
                expected: string;
                correct: boolean;
                term: string;
                translation: string;
                example: string;
            }[] | null;
        };
        CreateVocabularyQuizRequest: {
            topic?: string;
            personal?: boolean;
        };
        GetVocabularyQuizResponse: {
            id: string;
            questions: {
                id: string;
                wordId: string;
                type: "translation" | "gap";
                prompt: string;
                options: string[];
            }[];
            result: {
                questionId: string;
                wordId: string;
                type: "translation" | "gap";
                given: string;
                expected: string;
                correct: boolean;
                term: string;
                translation: string;
                example: string;
            }[] | null;
        };
        SubmitVocabularyQuizResponse: {
            questionId: string;
            wordId: string;
            type: "translation" | "gap";
            given: string;
            expected: string;
            correct: boolean;
            term: string;
            translation: string;
            example: string;
        }[];
        SubmitVocabularyQuizRequest: {
            answers: {
                [key: string]: string;
            };
        };
        StartArcadeRoundResponse: {
            id: string;
        };
        StartArcadeRoundRequest: {
            game: "challenge" | "survival" | "runner";
            duration: 30 | 60;
        };
        FinishArcadeRoundResponse: {
            saved: boolean;
            completed: boolean;
        };
        FinishArcadeRoundRequest: {
            elapsed: number;
            speechSeconds: number;
            answers: number;
        };
        StartSpeakingArcadeResponse: {
            id: string;
        };
        StartSpeakingArcadeRequest: {
            taskId: string;
        };
        FinishSpeakingArcadeResponse: {
            saved: boolean;
        };
        FinishSpeakingArcadeRequest: {
            durationSeconds: number;
            speechSeconds: number;
            longestPause: number;
            completed: boolean;
        };
        IssueInvitationResponse: {
            url: string;
            expiresAt: string;
        };
        IssueInvitationRequest: {
            email: string;
        };
        PublishTaskResponse: {
            published: boolean;
        };
        PublishTaskRequest: {
            id: string;
            published: boolean;
        };
        ImportContentResponse: {
            created: number;
            updated: number;
            unchanged: number;
        };
        ImportContentRequest: {
            entries: {
                task: {
                    id: string;
                    version?: number;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    part: number;
                    topic: string;
                    format: string;
                    durationSeconds: number;
                    minimumWords?: number;
                    prompt: string;
                    instructions: string;
                    createdAt: string;
                    source?: string;
                    passageId?: string;
                    paragraphs?: {
                        label: string;
                        text: string;
                    }[];
                    readingQuestions?: {
                        number: number;
                        statement: string;
                        mode: "single" | "multiple" | "text";
                        options?: {
                            value: string;
                            label: string;
                        }[];
                        selectCount?: number;
                        maxWords?: number;
                        allowNumber?: boolean;
                        group?: string;
                        label?: string;
                    }[];
                    readingLayout?: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                    reuseAllowed?: boolean;
                    diagram?: {
                        title: string;
                        nodes: {
                            id: string;
                            label: string;
                            x: number;
                            y: number;
                            questionNumber?: number;
                        }[];
                        edges: {
                            source: string;
                            target: string;
                        }[];
                    };
                    visual?: {
                        chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                        title: string;
                        unit?: string;
                        periods?: string[];
                        dataSeries?: {
                            category: string;
                            values: {
                                [key: string]: number;
                            };
                        }[];
                        processKind?: "linear" | "cyclical";
                        processSteps?: string[];
                    };
                    speakingQuestions?: string[];
                    cuePoints?: string[];
                    preparationSeconds?: number;
                    relatedTaskId?: string;
                };
                readingKey?: {
                    number: number;
                    answers: string[];
                    paragraph: string;
                    evidence: string;
                    explanation: string;
                    alternatives?: string[];
                }[];
            }[];
        };
        IosGetProfileResponse: {
            name: string;
            targetBand: number;
            selfReportedBand: number | null;
            examDate: string | null;
            dailyMinutes: number;
            studyDays: number[];
            timezone: string;
            id: string;
            email: string;
            role: "student" | "admin";
            betaAccess: boolean;
            onboarded: boolean;
        };
        IosListChatThreadsResponse: {
            id: string;
            title: string;
            attemptId: string | null;
            createdAt: string;
        }[];
        IosListChatMessagesResponse: {
            provider?: string;
            model?: string | null;
            id: string;
            role: "user" | "assistant";
            content: string;
            status: string;
        }[];
        IosListTasksResponse: {
            items: {
                task: {
                    id: string;
                    version: number;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    part: number;
                    topic: string;
                    format: string;
                    durationSeconds: number;
                    minimumWords: number;
                    prompt: string;
                    instructions: string;
                    createdAt: string;
                    source: string;
                    passageId?: string;
                    paragraphs: {
                        label: string;
                        text: string;
                    }[];
                    readingQuestions: {
                        number: number;
                        statement: string;
                        mode: "single" | "multiple" | "text";
                        options: {
                            value: string;
                            label: string;
                        }[];
                        selectCount: number;
                        maxWords?: number;
                        allowNumber: boolean;
                        group?: string;
                        label?: string;
                    }[];
                    readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                    reuseAllowed: boolean;
                    diagram?: {
                        title: string;
                        nodes: {
                            id: string;
                            label: string;
                            x: number;
                            y: number;
                            questionNumber?: number;
                        }[];
                        edges: {
                            source: string;
                            target: string;
                        }[];
                    };
                    visual?: {
                        chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                        title: string;
                        unit?: string;
                        periods: string[];
                        dataSeries: {
                            category: string;
                            values: {
                                [key: string]: number;
                            };
                        }[];
                        processKind?: "linear" | "cyclical";
                        processSteps: string[];
                    };
                    speakingQuestions: string[];
                    cuePoints: string[];
                    preparationSeconds: number;
                    relatedTaskId?: string;
                };
                status: "new" | "started" | "completed";
                lastAttemptId: string | null;
                lastBand: number | null;
                lastAccuracy: number | null;
                lastActivity: string | null;
            }[];
            total: number;
            page: number;
        };
        IosGetTaskResponse: {
            id: string;
            version: number;
            title: string;
            skill: "writing" | "speaking" | "reading";
            part: number;
            topic: string;
            format: string;
            durationSeconds: number;
            minimumWords: number;
            prompt: string;
            instructions: string;
            createdAt: string;
            source: string;
            passageId?: string;
            paragraphs: {
                label: string;
                text: string;
            }[];
            readingQuestions: {
                number: number;
                statement: string;
                mode: "single" | "multiple" | "text";
                options: {
                    value: string;
                    label: string;
                }[];
                selectCount: number;
                maxWords?: number;
                allowNumber: boolean;
                group?: string;
                label?: string;
            }[];
            readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
            reuseAllowed: boolean;
            diagram?: {
                title: string;
                nodes: {
                    id: string;
                    label: string;
                    x: number;
                    y: number;
                    questionNumber?: number;
                }[];
                edges: {
                    source: string;
                    target: string;
                }[];
            };
            visual?: {
                chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                title: string;
                unit?: string;
                periods: string[];
                dataSeries: {
                    category: string;
                    values: {
                        [key: string]: number;
                    };
                }[];
                processKind?: "linear" | "cyclical";
                processSteps: string[];
            };
            speakingQuestions: string[];
            cuePoints: string[];
            preparationSeconds: number;
            relatedTaskId?: string;
        };
        IosCreateAttemptResponse: {
            client?: "web" | "ios";
            requestedModel?: string | null;
            id: string;
            userId: string;
            taskId: string;
            taskVersion: number;
            taskSnapshot: {
                id: string;
                version: number;
                title: string;
                skill: "writing" | "speaking" | "reading";
                part: number;
                topic: string;
                format: string;
                durationSeconds: number;
                minimumWords: number;
                prompt: string;
                instructions: string;
                createdAt: string;
                source: string;
                passageId?: string;
                paragraphs: {
                    label: string;
                    text: string;
                }[];
                readingQuestions: {
                    number: number;
                    statement: string;
                    mode: "single" | "multiple" | "text";
                    options: {
                        value: string;
                        label: string;
                    }[];
                    selectCount: number;
                    maxWords?: number;
                    allowNumber: boolean;
                    group?: string;
                    label?: string;
                }[];
                readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                reuseAllowed: boolean;
                diagram?: {
                    title: string;
                    nodes: {
                        id: string;
                        label: string;
                        x: number;
                        y: number;
                        questionNumber?: number;
                    }[];
                    edges: {
                        source: string;
                        target: string;
                    }[];
                };
                visual?: {
                    chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                    title: string;
                    unit?: string;
                    periods: string[];
                    dataSeries: {
                        category: string;
                        values: {
                            [key: string]: number;
                        };
                    }[];
                    processKind?: "linear" | "cyclical";
                    processSteps: string[];
                };
                speakingQuestions: string[];
                cuePoints: string[];
                preparationSeconds: number;
                relatedTaskId?: string;
            };
            mode: "practice" | "strict";
            status: "in_progress" | "paused" | "submitted" | "completed";
            answer: {
                text: string;
                reading: {
                    [key: string]: string | string[];
                };
                audioIds: string[];
            };
            revision: number;
            parentAttemptId: string | null;
            startedAt: string;
            deadlineAt: string | null;
            submittedAt: string | null;
            elapsedSeconds: number;
            activeSince: string | null;
            createdAt: string;
            updatedAt: string;
        };
        IosCreateAttemptRequest: {
            taskId: string;
            mode: "practice" | "strict";
        };
        IosGetAttemptResponse: {
            attempt: {
                client?: "web" | "ios";
                requestedModel?: string | null;
                id: string;
                userId: string;
                taskId: string;
                taskVersion: number;
                taskSnapshot: {
                    id: string;
                    version: number;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    part: number;
                    topic: string;
                    format: string;
                    durationSeconds: number;
                    minimumWords: number;
                    prompt: string;
                    instructions: string;
                    createdAt: string;
                    source: string;
                    passageId?: string;
                    paragraphs: {
                        label: string;
                        text: string;
                    }[];
                    readingQuestions: {
                        number: number;
                        statement: string;
                        mode: "single" | "multiple" | "text";
                        options: {
                            value: string;
                            label: string;
                        }[];
                        selectCount: number;
                        maxWords?: number;
                        allowNumber: boolean;
                        group?: string;
                        label?: string;
                    }[];
                    readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                    reuseAllowed: boolean;
                    diagram?: {
                        title: string;
                        nodes: {
                            id: string;
                            label: string;
                            x: number;
                            y: number;
                            questionNumber?: number;
                        }[];
                        edges: {
                            source: string;
                            target: string;
                        }[];
                    };
                    visual?: {
                        chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                        title: string;
                        unit?: string;
                        periods: string[];
                        dataSeries: {
                            category: string;
                            values: {
                                [key: string]: number;
                            };
                        }[];
                        processKind?: "linear" | "cyclical";
                        processSteps: string[];
                    };
                    speakingQuestions: string[];
                    cuePoints: string[];
                    preparationSeconds: number;
                    relatedTaskId?: string;
                };
                mode: "practice" | "strict";
                status: "in_progress" | "paused" | "submitted" | "completed";
                answer: {
                    text: string;
                    reading: {
                        [key: string]: string | string[];
                    };
                    audioIds: string[];
                };
                revision: number;
                parentAttemptId: string | null;
                startedAt: string;
                deadlineAt: string | null;
                submittedAt: string | null;
                elapsedSeconds: number;
                activeSince: string | null;
                createdAt: string;
                updatedAt: string;
            };
            assessment: {
                provider?: "gemini" | "gigachat" | "deterministic";
                requestedModel?: string | null;
                id: string;
                attemptId: string;
                userId: string;
                status: "unavailable" | "queued" | "processing" | "ready" | "failed" | "insufficient_evidence";
                band: number | null;
                grade: {
                    sufficientEvidence: boolean;
                    insufficientReason: string | null;
                    criteria: {
                        key: string;
                        label: string;
                        score: number;
                        explanation: string;
                    }[];
                    errors: {
                        category: "grammar" | "vocabulary" | "coherence" | "task_response" | "task_achievement" | "data_accuracy" | "fluency" | "pronunciation" | "reading";
                        subcategory: string;
                        issue: string;
                        correction: string;
                        anchor: {
                            type: "text";
                            quote: string;
                        } | {
                            type: "requirement";
                            requirement: string;
                        } | {
                            type: "audio";
                            audioId: string;
                            startSeconds: number;
                            endSeconds: number;
                            quote: string;
                        } | {
                            type: "question";
                            number: number;
                            quote: string;
                        };
                    }[];
                    strengths: string[];
                    nextFocus: string;
                    fulfilledRequirements: {
                        requirement: string;
                        fulfilled: boolean;
                        explanation: string;
                    }[];
                } | null;
                reading: {
                    number: number;
                    statement: string;
                    given: string[];
                    expected: string[];
                    correct: boolean;
                    earned: number;
                    possible: number;
                    paragraph: string;
                    evidence: string;
                    explanation: string;
                }[] | null;
                transcripts: {
                    audioId: string;
                    text: string;
                    segments: {
                        startSeconds: number;
                        endSeconds: number;
                        text: string;
                    }[];
                }[];
                model: string | null;
                rubricVersion: string;
                errorCode: string | null;
                createdAt: string;
                completedAt: string | null;
            } | null;
        };
        IosSaveAttemptResponse: {
            client?: "web" | "ios";
            requestedModel?: string | null;
            id: string;
            userId: string;
            taskId: string;
            taskVersion: number;
            taskSnapshot: {
                id: string;
                version: number;
                title: string;
                skill: "writing" | "speaking" | "reading";
                part: number;
                topic: string;
                format: string;
                durationSeconds: number;
                minimumWords: number;
                prompt: string;
                instructions: string;
                createdAt: string;
                source: string;
                passageId?: string;
                paragraphs: {
                    label: string;
                    text: string;
                }[];
                readingQuestions: {
                    number: number;
                    statement: string;
                    mode: "single" | "multiple" | "text";
                    options: {
                        value: string;
                        label: string;
                    }[];
                    selectCount: number;
                    maxWords?: number;
                    allowNumber: boolean;
                    group?: string;
                    label?: string;
                }[];
                readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                reuseAllowed: boolean;
                diagram?: {
                    title: string;
                    nodes: {
                        id: string;
                        label: string;
                        x: number;
                        y: number;
                        questionNumber?: number;
                    }[];
                    edges: {
                        source: string;
                        target: string;
                    }[];
                };
                visual?: {
                    chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                    title: string;
                    unit?: string;
                    periods: string[];
                    dataSeries: {
                        category: string;
                        values: {
                            [key: string]: number;
                        };
                    }[];
                    processKind?: "linear" | "cyclical";
                    processSteps: string[];
                };
                speakingQuestions: string[];
                cuePoints: string[];
                preparationSeconds: number;
                relatedTaskId?: string;
            };
            mode: "practice" | "strict";
            status: "in_progress" | "paused" | "submitted" | "completed";
            answer: {
                text: string;
                reading: {
                    [key: string]: string | string[];
                };
                audioIds: string[];
            };
            revision: number;
            parentAttemptId: string | null;
            startedAt: string;
            deadlineAt: string | null;
            submittedAt: string | null;
            elapsedSeconds: number;
            activeSince: string | null;
            createdAt: string;
            updatedAt: string;
        };
        IosSaveAttemptRequest: {
            revision: number;
            answer: {
                text?: string;
                reading?: {
                    [key: string]: string | string[];
                };
                audioIds?: string[];
            };
            action?: "pause" | "resume";
        };
        IosGetResultResponse: {
            attempt: {
                client?: "web" | "ios";
                requestedModel?: string | null;
                id: string;
                userId: string;
                taskId: string;
                taskVersion: number;
                taskSnapshot: {
                    id: string;
                    version: number;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    part: number;
                    topic: string;
                    format: string;
                    durationSeconds: number;
                    minimumWords: number;
                    prompt: string;
                    instructions: string;
                    createdAt: string;
                    source: string;
                    passageId?: string;
                    paragraphs: {
                        label: string;
                        text: string;
                    }[];
                    readingQuestions: {
                        number: number;
                        statement: string;
                        mode: "single" | "multiple" | "text";
                        options: {
                            value: string;
                            label: string;
                        }[];
                        selectCount: number;
                        maxWords?: number;
                        allowNumber: boolean;
                        group?: string;
                        label?: string;
                    }[];
                    readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                    reuseAllowed: boolean;
                    diagram?: {
                        title: string;
                        nodes: {
                            id: string;
                            label: string;
                            x: number;
                            y: number;
                            questionNumber?: number;
                        }[];
                        edges: {
                            source: string;
                            target: string;
                        }[];
                    };
                    visual?: {
                        chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                        title: string;
                        unit?: string;
                        periods: string[];
                        dataSeries: {
                            category: string;
                            values: {
                                [key: string]: number;
                            };
                        }[];
                        processKind?: "linear" | "cyclical";
                        processSteps: string[];
                    };
                    speakingQuestions: string[];
                    cuePoints: string[];
                    preparationSeconds: number;
                    relatedTaskId?: string;
                };
                mode: "practice" | "strict";
                status: "in_progress" | "paused" | "submitted" | "completed";
                answer: {
                    text: string;
                    reading: {
                        [key: string]: string | string[];
                    };
                    audioIds: string[];
                };
                revision: number;
                parentAttemptId: string | null;
                startedAt: string;
                deadlineAt: string | null;
                submittedAt: string | null;
                elapsedSeconds: number;
                activeSince: string | null;
                createdAt: string;
                updatedAt: string;
            };
            assessment: {
                provider?: "gemini" | "gigachat" | "deterministic";
                requestedModel?: string | null;
                id: string;
                attemptId: string;
                userId: string;
                status: "unavailable" | "queued" | "processing" | "ready" | "failed" | "insufficient_evidence";
                band: number | null;
                grade: {
                    sufficientEvidence: boolean;
                    insufficientReason: string | null;
                    criteria: {
                        key: string;
                        label: string;
                        score: number;
                        explanation: string;
                    }[];
                    errors: {
                        category: "grammar" | "vocabulary" | "coherence" | "task_response" | "task_achievement" | "data_accuracy" | "fluency" | "pronunciation" | "reading";
                        subcategory: string;
                        issue: string;
                        correction: string;
                        anchor: {
                            type: "text";
                            quote: string;
                        } | {
                            type: "requirement";
                            requirement: string;
                        } | {
                            type: "audio";
                            audioId: string;
                            startSeconds: number;
                            endSeconds: number;
                            quote: string;
                        } | {
                            type: "question";
                            number: number;
                            quote: string;
                        };
                    }[];
                    strengths: string[];
                    nextFocus: string;
                    fulfilledRequirements: {
                        requirement: string;
                        fulfilled: boolean;
                        explanation: string;
                    }[];
                } | null;
                reading: {
                    number: number;
                    statement: string;
                    given: string[];
                    expected: string[];
                    correct: boolean;
                    earned: number;
                    possible: number;
                    paragraph: string;
                    evidence: string;
                    explanation: string;
                }[] | null;
                transcripts: {
                    audioId: string;
                    text: string;
                    segments: {
                        startSeconds: number;
                        endSeconds: number;
                        text: string;
                    }[];
                }[];
                model: string | null;
                rubricVersion: string;
                errorCode: string | null;
                createdAt: string;
                completedAt: string | null;
            } | null;
        };
        IosSubmitAttemptResponse: {
            provider?: "gemini" | "gigachat" | "deterministic";
            requestedModel?: string | null;
            id: string;
            attemptId: string;
            userId: string;
            status: "unavailable" | "queued" | "processing" | "ready" | "failed" | "insufficient_evidence";
            band: number | null;
            grade: {
                sufficientEvidence: boolean;
                insufficientReason: string | null;
                criteria: {
                    key: string;
                    label: string;
                    score: number;
                    explanation: string;
                }[];
                errors: {
                    category: "grammar" | "vocabulary" | "coherence" | "task_response" | "task_achievement" | "data_accuracy" | "fluency" | "pronunciation" | "reading";
                    subcategory: string;
                    issue: string;
                    correction: string;
                    anchor: {
                        type: "text";
                        quote: string;
                    } | {
                        type: "requirement";
                        requirement: string;
                    } | {
                        type: "audio";
                        audioId: string;
                        startSeconds: number;
                        endSeconds: number;
                        quote: string;
                    } | {
                        type: "question";
                        number: number;
                        quote: string;
                    };
                }[];
                strengths: string[];
                nextFocus: string;
                fulfilledRequirements: {
                    requirement: string;
                    fulfilled: boolean;
                    explanation: string;
                }[];
            } | null;
            reading: {
                number: number;
                statement: string;
                given: string[];
                expected: string[];
                correct: boolean;
                earned: number;
                possible: number;
                paragraph: string;
                evidence: string;
                explanation: string;
            }[] | null;
            transcripts: {
                audioId: string;
                text: string;
                segments: {
                    startSeconds: number;
                    endSeconds: number;
                    text: string;
                }[];
            }[];
            model: string | null;
            rubricVersion: string;
            errorCode: string | null;
            createdAt: string;
            completedAt: string | null;
        };
        IosSubmitAttemptRequest: Record<string, never>;
        IosReviseAttemptResponse: {
            client?: "web" | "ios";
            requestedModel?: string | null;
            id: string;
            userId: string;
            taskId: string;
            taskVersion: number;
            taskSnapshot: {
                id: string;
                version: number;
                title: string;
                skill: "writing" | "speaking" | "reading";
                part: number;
                topic: string;
                format: string;
                durationSeconds: number;
                minimumWords: number;
                prompt: string;
                instructions: string;
                createdAt: string;
                source: string;
                passageId?: string;
                paragraphs: {
                    label: string;
                    text: string;
                }[];
                readingQuestions: {
                    number: number;
                    statement: string;
                    mode: "single" | "multiple" | "text";
                    options: {
                        value: string;
                        label: string;
                    }[];
                    selectCount: number;
                    maxWords?: number;
                    allowNumber: boolean;
                    group?: string;
                    label?: string;
                }[];
                readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                reuseAllowed: boolean;
                diagram?: {
                    title: string;
                    nodes: {
                        id: string;
                        label: string;
                        x: number;
                        y: number;
                        questionNumber?: number;
                    }[];
                    edges: {
                        source: string;
                        target: string;
                    }[];
                };
                visual?: {
                    chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                    title: string;
                    unit?: string;
                    periods: string[];
                    dataSeries: {
                        category: string;
                        values: {
                            [key: string]: number;
                        };
                    }[];
                    processKind?: "linear" | "cyclical";
                    processSteps: string[];
                };
                speakingQuestions: string[];
                cuePoints: string[];
                preparationSeconds: number;
                relatedTaskId?: string;
            };
            mode: "practice" | "strict";
            status: "in_progress" | "paused" | "submitted" | "completed";
            answer: {
                text: string;
                reading: {
                    [key: string]: string | string[];
                };
                audioIds: string[];
            };
            revision: number;
            parentAttemptId: string | null;
            startedAt: string;
            deadlineAt: string | null;
            submittedAt: string | null;
            elapsedSeconds: number;
            activeSince: string | null;
            createdAt: string;
            updatedAt: string;
        };
        IosReviseAttemptRequest: Record<string, never>;
        IosRetryAssessmentResponse: {
            provider?: "gemini" | "gigachat" | "deterministic";
            requestedModel?: string | null;
            id: string;
            attemptId: string;
            userId: string;
            status: "unavailable" | "queued" | "processing" | "ready" | "failed" | "insufficient_evidence";
            band: number | null;
            grade: {
                sufficientEvidence: boolean;
                insufficientReason: string | null;
                criteria: {
                    key: string;
                    label: string;
                    score: number;
                    explanation: string;
                }[];
                errors: {
                    category: "grammar" | "vocabulary" | "coherence" | "task_response" | "task_achievement" | "data_accuracy" | "fluency" | "pronunciation" | "reading";
                    subcategory: string;
                    issue: string;
                    correction: string;
                    anchor: {
                        type: "text";
                        quote: string;
                    } | {
                        type: "requirement";
                        requirement: string;
                    } | {
                        type: "audio";
                        audioId: string;
                        startSeconds: number;
                        endSeconds: number;
                        quote: string;
                    } | {
                        type: "question";
                        number: number;
                        quote: string;
                    };
                }[];
                strengths: string[];
                nextFocus: string;
                fulfilledRequirements: {
                    requirement: string;
                    fulfilled: boolean;
                    explanation: string;
                }[];
            } | null;
            reading: {
                number: number;
                statement: string;
                given: string[];
                expected: string[];
                correct: boolean;
                earned: number;
                possible: number;
                paragraph: string;
                evidence: string;
                explanation: string;
            }[] | null;
            transcripts: {
                audioId: string;
                text: string;
                segments: {
                    startSeconds: number;
                    endSeconds: number;
                    text: string;
                }[];
            }[];
            model: string | null;
            rubricVersion: string;
            errorCode: string | null;
            createdAt: string;
            completedAt: string | null;
        };
        IosRetryAssessmentRequest: Record<string, never>;
        IosSaveProfileResponse: {
            saved: boolean;
        };
        IosSaveProfileRequest: {
            name: string;
            targetBand: number;
            selfReportedBand?: number | null;
            examDate?: string | null;
            dailyMinutes: number;
            studyDays: number[];
            timezone: string;
        };
        IosDeleteAccountResponse: {
            deleted: boolean;
        };
        IosDeleteAccountRequest: {
            confirmation: "DELETE";
        };
        IosUploadAudioTicketResponse: {
            id: string;
            path: string;
            token: string;
        };
        IosUploadAudioTicketRequest: {
            attemptId: string;
            questionIndex: number;
            bytes: number;
        };
        IosCompleteAudioResponse: {
            id: string;
            duration: number;
        };
        IosCompleteAudioRequest: Record<string, never>;
        IosPlayAudioResponse: {
            url: string;
            duration: number | null;
            expiresAt: string;
        };
        IosDeleteAudioResponse: {
            deleted: boolean;
        };
        IosDeleteAudioRequest: Record<string, never>;
        IosReplyToConversationEvent: {
            type: "thread";
            threadId: string;
            assistantId: string;
        } | {
            type: "expression";
            expression: "happy" | "cheeky" | "angry" | "sad" | "horrified" | "sheepish" | "smug" | "neutral" | "excited" | "skeptical" | "love" | "wince" | "surprised" | "annoyed" | "devastated" | "unamused" | "asleep" | "furious";
            position: "default" | "center" | "mid-left" | "mid-right" | "top-mid";
        } | {
            type: "token";
            text: string;
        } | {
            type: "error";
            message: string;
        } | {
            type: "done";
            status: string;
        };
        IosReplyToConversationRequest: {
            personality?: "classic" | "angry" | "kind" | "sarcastic";
            explicit?: boolean;
            content?: string;
            retryAssistantId?: string;
            threadId?: string;
            attemptId?: string;
        };
        IosConversationFeedbackResponse: {
            status: "too_short";
        } | {
            status: "ready";
            feedback: {
                strengths: string[];
                improvements: {
                    quote: string;
                    correction: string;
                    explanation: string;
                }[];
                words: {
                    term: string;
                    meaning: string;
                    partOfSpeech: string;
                    example: string;
                }[];
            };
        };
        IosConversationFeedbackRequest: {
            threadId: string;
        };
        IosListVocabularyResponse: {
            id: string;
            ownerId: string | null;
            topic: string;
            term: string;
            translation: string;
            partOfSpeech: string;
            example: string;
            gapSentence: string;
            alternatives: string[];
            saved: boolean;
            correct: number;
            total: number;
        }[];
        IosSuggestWordResponse: {
            term: string;
            translation: string;
            partOfSpeech: string;
            example: string;
            topic: string;
        };
        IosSuggestWordRequest: {
            term: string;
            topic: string;
        };
        IosAddWordResponse: {
            id: string;
        };
        IosAddWordRequest: {
            term: string;
            translation: string;
            partOfSpeech: string;
            example: string;
            topic: string;
        };
        IosSaveWordResponse: {
            saved: boolean;
        };
        IosSaveWordRequest: {
            wordId: string;
            saved: boolean;
        };
        IosCreateVocabularyQuizResponse: {
            id: string;
            questions: {
                id: string;
                wordId: string;
                type: "translation" | "gap";
                prompt: string;
                options: string[];
            }[];
            result: {
                questionId: string;
                wordId: string;
                type: "translation" | "gap";
                given: string;
                expected: string;
                correct: boolean;
                term: string;
                translation: string;
                example: string;
            }[] | null;
        };
        IosCreateVocabularyQuizRequest: {
            topic?: string;
            personal?: boolean;
        };
        IosGetVocabularyQuizResponse: {
            id: string;
            questions: {
                id: string;
                wordId: string;
                type: "translation" | "gap";
                prompt: string;
                options: string[];
            }[];
            result: {
                questionId: string;
                wordId: string;
                type: "translation" | "gap";
                given: string;
                expected: string;
                correct: boolean;
                term: string;
                translation: string;
                example: string;
            }[] | null;
        };
        IosSubmitVocabularyQuizResponse: {
            questionId: string;
            wordId: string;
            type: "translation" | "gap";
            given: string;
            expected: string;
            correct: boolean;
            term: string;
            translation: string;
            example: string;
        }[];
        IosSubmitVocabularyQuizRequest: {
            answers: {
                [key: string]: string;
            };
        };
        IosBootstrapResponse: {
            profile: {
                name: string;
                targetBand: number;
                selfReportedBand: number | null;
                examDate: string | null;
                dailyMinutes: number;
                studyDays: number[];
                timezone: string;
                id: string;
                email: string;
                role: "student" | "admin";
                betaAccess: boolean;
                onboarded: boolean;
            };
            onboarding: {
                revision: number;
                version: 1;
                step: number;
                completedAt: string | null;
                answers: {
                    startingLevel: "below_5_5" | "5_5_6_0" | "6_5_7_0" | "7_5_plus" | "unknown" | null;
                    targetBand: number | null;
                    examStatus: "unanswered" | "not_booked" | "scheduled";
                    examDate: string | null;
                    focus: ("reading" | "writing")[];
                    barrier: "time" | "direction" | "anxiety" | "previous_attempt" | "other" | "private" | null;
                };
                preferences: {
                    dailyReminder: boolean;
                    reminderHour: number;
                    soundEffects: boolean;
                };
            };
            capabilities: {
                skills: ("reading" | "writing")[];
                writingAssessment: boolean;
                textAI: boolean;
                speakingRecording: boolean;
                voiceAI: false;
                fullExam: false;
            };
        };
        IosGetOnboardingResponse: {
            revision: number;
            version: 1;
            step: number;
            completedAt: string | null;
            answers: {
                startingLevel: "below_5_5" | "5_5_6_0" | "6_5_7_0" | "7_5_plus" | "unknown" | null;
                targetBand: number | null;
                examStatus: "unanswered" | "not_booked" | "scheduled";
                examDate: string | null;
                focus: ("reading" | "writing")[];
                barrier: "time" | "direction" | "anxiety" | "previous_attempt" | "other" | "private" | null;
            };
            preferences: {
                dailyReminder: boolean;
                reminderHour: number;
                soundEffects: boolean;
            };
        };
        IosSaveOnboardingResponse: {
            revision: number;
            version: 1;
            step: number;
            completedAt: string | null;
            answers: {
                startingLevel: "below_5_5" | "5_5_6_0" | "6_5_7_0" | "7_5_plus" | "unknown" | null;
                targetBand: number | null;
                examStatus: "unanswered" | "not_booked" | "scheduled";
                examDate: string | null;
                focus: ("reading" | "writing")[];
                barrier: "time" | "direction" | "anxiety" | "previous_attempt" | "other" | "private" | null;
            };
            preferences: {
                dailyReminder: boolean;
                reminderHour: number;
                soundEffects: boolean;
            };
        };
        IosSaveOnboardingRequest: {
            revision: number;
            step: number;
            answers: {
                startingLevel?: "below_5_5" | "5_5_6_0" | "6_5_7_0" | "7_5_plus" | "unknown" | null;
                targetBand?: number | null;
                examStatus: "unanswered" | "not_booked" | "scheduled";
                examDate?: string | null;
                focus: ("reading" | "writing")[];
                barrier?: "time" | "direction" | "anxiety" | "previous_attempt" | "other" | "private" | null;
            };
            complete?: boolean;
        };
        IosSavePreferencesResponse: {
            saved: boolean;
        };
        IosSavePreferencesRequest: {
            dailyReminder: boolean;
            reminderHour: number;
            soundEffects: boolean;
        };
        IosDashboardResponse: {
            today: string;
            tasks: {
                task: {
                    id: string;
                    version: number;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    part: number;
                    topic: string;
                    format: string;
                    durationSeconds: number;
                    minimumWords: number;
                    prompt: string;
                    instructions: string;
                    createdAt: string;
                    source: string;
                    passageId?: string;
                    paragraphs: {
                        label: string;
                        text: string;
                    }[];
                    readingQuestions: {
                        number: number;
                        statement: string;
                        mode: "single" | "multiple" | "text";
                        options: {
                            value: string;
                            label: string;
                        }[];
                        selectCount: number;
                        maxWords?: number;
                        allowNumber: boolean;
                        group?: string;
                        label?: string;
                    }[];
                    readingLayout: "list" | "summary" | "notes" | "table" | "flowchart" | "diagram";
                    reuseAllowed: boolean;
                    diagram?: {
                        title: string;
                        nodes: {
                            id: string;
                            label: string;
                            x: number;
                            y: number;
                            questionNumber?: number;
                        }[];
                        edges: {
                            source: string;
                            target: string;
                        }[];
                    };
                    visual?: {
                        chartType: "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
                        title: string;
                        unit?: string;
                        periods: string[];
                        dataSeries: {
                            category: string;
                            values: {
                                [key: string]: number;
                            };
                        }[];
                        processKind?: "linear" | "cyclical";
                        processSteps: string[];
                    };
                    speakingQuestions: string[];
                    cuePoints: string[];
                    preparationSeconds: number;
                    relatedTaskId?: string;
                };
                status: "new" | "started" | "completed";
                lastAttemptId: string | null;
                lastBand: number | null;
                lastAccuracy: number | null;
                lastActivity: string | null;
            }[];
            streak: {
                today: string;
                timezone: string;
                current: number;
                best: number;
                todayComplete: boolean;
                week: {
                    date: string;
                    label: string;
                    state: "earned" | "today" | "missed" | "upcoming";
                }[];
            };
            completed: number;
            total: number;
        };
        IosStatisticsResponse: {
            statistics: {
                skills: {
                    skill: "writing" | "speaking" | "reading";
                    count: number;
                    latest: number | null;
                    average: number | null;
                    unit: "band";
                    series: {
                        date: string;
                        value: number;
                        part: number;
                        mode: string;
                    }[];
                    criteria: {
                        key: string;
                        label: string;
                        average: number;
                    }[];
                    formats: {
                        format: string;
                        correct: number;
                        total: number;
                        accuracy: number;
                    }[];
                    errors: {
                        category: string;
                        count: number;
                    }[];
                }[];
                independentCount: number;
                revisionCount: number;
                totalMinutes: number;
                history: {
                    id: string;
                    date: string;
                    title: string;
                    skill: "writing" | "speaking" | "reading";
                    mode: "practice" | "strict";
                    band: number | null;
                    accuracy: number | null;
                    durationMinutes: number;
                }[];
                activity: {
                    date: string;
                    count: number;
                }[];
            };
            forecasts: {
                skill: "reading" | "writing";
                target: number;
                estimatedDate: string | null;
                reason: "insufficient_data" | "no_growth" | "too_distant" | "reached" | "projected";
                resultCount: number;
            }[];
            streak: {
                today: string;
                timezone: string;
                current: number;
                best: number;
                todayComplete: boolean;
                week: {
                    date: string;
                    label: string;
                    state: "earned" | "today" | "missed" | "upcoming";
                }[];
            };
        };
        IosGetNotesResponse: {
            revision: number;
            flaggedQuestions: number[];
            highlights: string[];
        };
        IosSaveNotesResponse: {
            revision: number;
            flaggedQuestions: number[];
            highlights: string[];
        };
        IosSaveNotesRequest: {
            revision: number;
            flaggedQuestions: number[];
            highlights: string[];
        };
        IosHintEvent: {
            type: "thread";
            threadId: string;
            assistantId: string;
        } | {
            type: "expression";
            expression: "happy" | "cheeky" | "angry" | "sad" | "horrified" | "sheepish" | "smug" | "neutral" | "excited" | "skeptical" | "love" | "wince" | "surprised" | "annoyed" | "devastated" | "unamused" | "asleep" | "furious";
            position: "default" | "center" | "mid-left" | "mid-right" | "top-mid";
        } | {
            type: "token";
            text: string;
        } | {
            type: "error";
            message: string;
        } | {
            type: "done";
            status: string;
        };
        IosHintRequest: {
            content: string;
            questionNumber?: number;
        };
        IosRecordEventResponse: {
            saved: boolean;
        };
        IosRecordEventRequest: {
            id: string;
            event: "onboarding_started" | "onboarding_step_viewed" | "onboarding_answer_saved" | "onboarding_review_viewed" | "onboarding_completed";
            step: number;
            entry: "forward" | "back" | "resume" | "review";
            version: 1;
        };
        IosStartSprintResponse: {
            id: string;
            score: number;
            lives: number;
            index: number;
            total: number;
            finished: boolean;
            question: {
                id: string;
                wordId: string;
                type: "translation" | "gap";
                prompt: string;
                options: string[];
            } | null;
            lastAnswer: {
                questionId: string;
                wordId: string;
                type: "translation" | "gap";
                given: string;
                expected: string;
                correct: boolean;
                term: string;
                translation: string;
                example: string;
            } | null;
        };
        IosStartSprintRequest: {
            id: string;
        };
        IosGetSprintResponse: {
            id: string;
            score: number;
            lives: number;
            index: number;
            total: number;
            finished: boolean;
            question: {
                id: string;
                wordId: string;
                type: "translation" | "gap";
                prompt: string;
                options: string[];
            } | null;
            lastAnswer: {
                questionId: string;
                wordId: string;
                type: "translation" | "gap";
                given: string;
                expected: string;
                correct: boolean;
                term: string;
                translation: string;
                example: string;
            } | null;
        };
        IosAnswerSprintResponse: {
            id: string;
            score: number;
            lives: number;
            index: number;
            total: number;
            finished: boolean;
            question: {
                id: string;
                wordId: string;
                type: "translation" | "gap";
                prompt: string;
                options: string[];
            } | null;
            lastAnswer: {
                questionId: string;
                wordId: string;
                type: "translation" | "gap";
                given: string;
                expected: string;
                correct: boolean;
                term: string;
                translation: string;
                example: string;
            } | null;
        };
        IosAnswerSprintRequest: {
            questionId: string;
            answer: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GetProfileResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    deleteAccount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeleteAccountRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeleteAccountResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    saveProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveProfileRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SaveProfileResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listChatThreads: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListChatThreadsResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listChatMessages: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListChatMessagesResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listTasks: {
        parameters: {
            query?: {
                skill?: "reading" | "writing" | "speaking";
                topic?: string;
                format?: string;
                part?: string;
                status?: "new" | "started" | "completed";
                q?: string;
                sort?: "title" | "recent" | "newest";
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListTasksResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GetTaskResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    createAttempt: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateAttemptRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateAttemptResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getAttempt: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GetAttemptResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    saveAttempt: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveAttemptRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SaveAttemptResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getResult: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GetResultResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    submitAttempt: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubmitAttemptRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubmitAttemptResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    reviseAttempt: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviseAttemptRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviseAttemptResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    retryAssessment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RetryAssessmentRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RetryAssessmentResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getDashboard: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GetDashboardResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getStatistics: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GetStatisticsResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getStreak: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GetStreakResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    startStudySession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StartStudySessionRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StartStudySessionResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    moveStudySession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MoveStudySessionRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MoveStudySessionResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    acceptInvitation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AcceptInvitationRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AcceptInvitationResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    uploadAudioTicket: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UploadAudioTicketRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UploadAudioTicketResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    completeAudio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompleteAudioRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompleteAudioResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    playAudio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlayAudioResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    deleteAudio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeleteAudioRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeleteAudioResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    questionAudio: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuestionAudioRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["QuestionAudioResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    chatHistory: {
        parameters: {
            query?: {
                thread?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatHistoryResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    replyToConversation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReplyToConversationRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/x-ndjson": Blob;
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    startConversation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StartConversationRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/x-ndjson": Blob;
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    transcribeVoice: {
        parameters: {
            query: {
                thread: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "audio/wav": Blob;
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TranscribeVoiceResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    speakReply: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SpeakReplyRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SpeakReplyResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    welcomeAudio: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WelcomeAudioRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WelcomeAudioResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    conversationFeedback: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConversationFeedbackRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConversationFeedbackResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listVocabulary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListVocabularyResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    suggestWord: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SuggestWordRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuggestWordResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    addWord: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddWordRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AddWordResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    saveWord: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveWordRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SaveWordResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    createVocabularyQuiz: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateVocabularyQuizRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateVocabularyQuizResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getVocabularyQuiz: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GetVocabularyQuizResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    submitVocabularyQuiz: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubmitVocabularyQuizRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubmitVocabularyQuizResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    startArcadeRound: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StartArcadeRoundRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StartArcadeRoundResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    finishArcadeRound: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FinishArcadeRoundRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FinishArcadeRoundResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    startSpeakingArcade: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StartSpeakingArcadeRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StartSpeakingArcadeResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    finishSpeakingArcade: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FinishSpeakingArcadeRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FinishSpeakingArcadeResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    issueInvitation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IssueInvitationRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IssueInvitationResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    publishTask: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PublishTaskRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublishTaskResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    importContent: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ImportContentRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImportContentResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosGetProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosGetProfileResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosDeleteAccount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosDeleteAccountRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosDeleteAccountResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosSaveProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosSaveProfileRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosSaveProfileResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosListChatThreads: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosListChatThreadsResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosListChatMessages: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosListChatMessagesResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosListTasks: {
        parameters: {
            query?: {
                skill?: "reading" | "writing" | "speaking";
                topic?: string;
                format?: string;
                part?: string;
                status?: "new" | "started" | "completed";
                q?: string;
                sort?: "title" | "recent" | "newest";
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosListTasksResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosGetTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosGetTaskResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosCreateAttempt: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosCreateAttemptRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosCreateAttemptResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosGetAttempt: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosGetAttemptResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosSaveAttempt: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosSaveAttemptRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosSaveAttemptResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosGetResult: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosGetResultResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosSubmitAttempt: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosSubmitAttemptRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosSubmitAttemptResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosReviseAttempt: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosReviseAttemptRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosReviseAttemptResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosRetryAssessment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosRetryAssessmentRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosRetryAssessmentResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosUploadAudioTicket: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosUploadAudioTicketRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosUploadAudioTicketResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosCompleteAudio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosCompleteAudioRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosCompleteAudioResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosPlayAudio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosPlayAudioResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosDeleteAudio: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosDeleteAudioRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosDeleteAudioResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosReplyToConversation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosReplyToConversationRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/x-ndjson": Blob;
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosConversationFeedback: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosConversationFeedbackRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosConversationFeedbackResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosListVocabulary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosListVocabularyResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosSuggestWord: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosSuggestWordRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosSuggestWordResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosAddWord: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosAddWordRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosAddWordResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosSaveWord: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosSaveWordRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosSaveWordResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosCreateVocabularyQuiz: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosCreateVocabularyQuizRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosCreateVocabularyQuizResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosGetVocabularyQuiz: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosGetVocabularyQuizResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosSubmitVocabularyQuiz: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosSubmitVocabularyQuizRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosSubmitVocabularyQuizResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosBootstrap: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosBootstrapResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosGetOnboarding: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosGetOnboardingResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosSaveOnboarding: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosSaveOnboardingRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosSaveOnboardingResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosSavePreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosSavePreferencesRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosSavePreferencesResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosDashboard: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosDashboardResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosStatistics: {
        parameters: {
            query?: {
                days?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosStatisticsResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosGetNotes: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosGetNotesResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosSaveNotes: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosSaveNotesRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosSaveNotesResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosHint: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosHintRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/x-ndjson": Blob;
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosRecordEvent: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosRecordEventRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosRecordEventResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosStartSprint: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosStartSprintRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosStartSprintResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosGetSprint: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosGetSprintResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    iosAnswerSprint: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IosAnswerSprintRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IosAnswerSprintResponse"];
                };
            };
            default: {
                headers: {
                    "X-Request-ID"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
}
