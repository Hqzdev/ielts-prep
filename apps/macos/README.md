# Veylo for macOS

Open `../Veylo.xcworkspace` and choose **Veylo macOS**. Minimum OS version: 27.0, preserved from the supplied project.

Sources live in `Veylo/`:

- `Domain`: pure entities and business rules.
- `Application`: use cases and service protocols; depends on Domain.
- `Infrastructure`: implementations of Application protocols.
- `Interfaces/Views`: SwiftUI screens; calls Application.
- `Composition`: app entry point, dependency construction and injection.
- `Resources`: platform-specific assets.

Only Composition and Interfaces currently contain Swift code from the supplied template. Other layers contain responsibility documentation until actual features need them. Xcode excludes this documentation from the app bundle. Layers currently share one app target; compiler-level module isolation is not implemented.

The projects own separate sources, assets and bundle identifiers. No references to the sibling platform are allowed. Shared Swift packages require a concrete shared use case.

See [native architecture](../../docs/adr/003-native-app-layers.md).
