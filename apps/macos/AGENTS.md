# Native application rules

- Follow the repository root AGENTS.md and docs/adr/003-native-app-layers.md.
- Keep Interfaces → Application → Domain. Infrastructure implements Application protocols; Composition constructs and injects adapters.
- Domain and Application must not import SwiftUI, UIKit, AppKit, AVFoundation, Security or third-party platform SDKs, or perform network, storage or global platform access.
- Views must not create infrastructure adapters or access network, persistence, Keychain or audio directly.
- Keep this platform's sources and resources inside this project. Do not reference the sibling platform's files.
- Add real use cases and adapters when needed; no empty types or unused abstraction layers. Use composition and initializer injection.
- No comments in owned Swift code. Preserve required tool directives and third-party licenses.
- Build the relevant shared workspace scheme after changes; run relevant tests when behavior changes.
