plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.aion.autonomous.mobile"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.aion.autonomous.mobile"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
        buildConfigField("String", "AION_API_BASE_URL", "\"https://aion-theta-eight.vercel.app/api/mobile\"")
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            buildConfigField("String", "AION_API_BASE_URL", "\"https://aion-theta-eight.vercel.app/api/mobile\"")
        }
    }
    buildFeatures { buildConfig = true }
}
dependencies {
    implementation("org.jetbrains.kotlin:kotlin-stdlib:2.0.21")
}
