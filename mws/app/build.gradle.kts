plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-parcelize")
}

android {
    namespace = "com.mws"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.mws"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        // Ensure 16 KB page size compatibility
        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64")
        }
    }

    // Signing configs removed for now - will be added later for production

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // Signing config removed for now - will be added later for production

            // Production configuration - BuildConfig fields removed
        }
        debug {
            isMinifyEnabled = false
            isShrinkResources = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")

            // Debug configuration - BuildConfig fields removed
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        dataBinding = true
    }
    
    // NDK configuration for 16 KB page size compatibility
    ndkVersion = "25.2.9519653"

    // Fix 16 KB page size compatibility for Android 15+
    packagingOptions {
        jniLibs {
            useLegacyPackaging = false
        }
        
        // Exclude problematic libraries that don't support 16 KB page sizes
        excludes += listOf(
            "**/lib/x86_64/libimagepipeline.so",
            "**/lib/x86_64/libnative-filters.so", 
            "**/lib/x86_64/libnative-imagetranscoder.so",
            "**/lib/arm64-v8a/libimagepipeline.so",
            "**/lib/arm64-v8a/libnative-filters.so",
            "**/lib/arm64-v8a/libnative-imagetranscoder.so",
            "**/lib/armeabi-v7a/libimagepipeline.so",
            "**/lib/armeabi-v7a/libnative-filters.so",
            "**/lib/armeabi-v7a/libnative-imagetranscoder.so"
        )
        
        // Ensure proper alignment for 16 KB page sizes
        pickFirsts += listOf(
            "**/lib/x86_64/*.so",
            "**/lib/arm64-v8a/*.so",
            "**/lib/armeabi-v7a/*.so"
        )
        
        // Additional 16 KB page size compatibility
        resources {
            excludes += listOf(
                "META-INF/DEPENDENCIES",
                "META-INF/LICENSE",
                "META-INF/LICENSE.txt",
                "META-INF/license.txt",
                "META-INF/NOTICE",
                "META-INF/NOTICE.txt",
                "META-INF/notice.txt",
                "META-INF/ASL2.0",
                "META-INF/*.kotlin_module"
            )
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.9.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    annotationProcessor("androidx.room:room-compiler:2.6.1")

    // Retrofit for API calls
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.11.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // ViewModel and LiveData
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

    // Navigation
    implementation("androidx.navigation:navigation-fragment-ktx:2.7.5")
    implementation("androidx.navigation:navigation-ui-ktx:2.7.5")

    // UI Components
    implementation("androidx.cardview:cardview:1.0.0")
    implementation("androidx.recyclerview:recyclerview:1.3.2")
    implementation("com.github.bumptech.glide:glide:4.16.0")
    annotationProcessor("com.github.bumptech.glide:compiler:4.16.0")

    // Cloudinary - exclude problematic native libraries
    implementation("com.cloudinary:cloudinary-android:2.3.1") {
        exclude(group = "com.facebook.fresco", module = "fresco")
        exclude(group = "com.facebook.fresco", module = "imagepipeline")
        exclude(group = "com.facebook.fresco", module = "native-filters")
        exclude(group = "com.facebook.fresco", module = "native-imagetranscoder")
    }

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
