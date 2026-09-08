// swift-tools-version:6.1
import PackageDescription
let package = Package(
    name: "VeyloAPI",
    platforms: [.iOS(.v18), .macOS(.v13)],
    products: [.library(name: "VeyloAPI", targets: ["VeyloAPI"])],
    dependencies: [
        .package(url: "https://github.com/apple/swift-openapi-generator", exact: "1.13.1"),
        .package(url: "https://github.com/apple/swift-openapi-runtime", exact: "1.12.1"),
        .package(url: "https://github.com/apple/swift-openapi-urlsession", exact: "1.3.1"),
        .package(url: "https://github.com/supabase/supabase-swift", exact: "2.55.1")
    ],
    targets: [.target(name: "VeyloAPI", dependencies: [
        .product(name: "OpenAPIRuntime", package: "swift-openapi-runtime"),
        .product(name: "OpenAPIURLSession", package: "swift-openapi-urlsession"),
        .product(name: "Supabase", package: "supabase-swift")
    ], plugins: [.plugin(name: "OpenAPIGenerator", package: "swift-openapi-generator")])]
)
