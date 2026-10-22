import java.util.Properties

// OGTV for Android TV and Fire TV: one full-screen WebView on the live site (https://ogtv.thebharat.si/?app=tv).
// No libraries, so the same APK runs on Fire OS (no Google Play services) and Android TV.
plugins {
    id("com.android.application")
}

// Release signing comes from environment variables (CI secrets) or android/keystore.properties (local, not committed).
val keyProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
fun signing(name: String): String? = System.getenv(name) ?: keyProps.getProperty(name)

android {
    namespace = "si.thebharat.ogtv"
    compileSdk = 36

    defaultConfig {
        applicationId = "si.thebharat.ogtv"
        minSdk = 22 // Fire OS 5 (Fire TV Stick 1st gen) and up
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        create("release") {
            val store = signing("OGTV_KEYSTORE")
            if (store != null) {
                storeFile = file(store)
                storePassword = signing("OGTV_KEYSTORE_PASS")
                keyAlias = signing("OGTV_KEY_ALIAS") ?: "ogtv"
                keyPassword = signing("OGTV_KEY_PASS") ?: signing("OGTV_KEYSTORE_PASS")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (signing("OGTV_KEYSTORE") != null) signingConfig = signingConfigs.getByName("release")
        }
    }
}
