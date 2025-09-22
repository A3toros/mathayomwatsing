# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name of the
# method to be called from JavaScript.
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Keep Room database classes
-keep class com.mws.database.** { *; }
-keep class com.mws.database.entity.** { *; }
-keep class com.mws.database.dao.** { *; }

# Keep model classes
-keep class com.mws.models.** { *; }

# Keep ViewModel classes
-keep class com.mws.viewmodels.** { *; }

# Keep service classes
-keep class com.mws.services.** { *; }

# Keep test logic classes
-keep class com.mws.testlogic.** { *; }

# Keep adapter classes
-keep class com.mws.adapters.** { *; }

# Keep activity classes
-keep class com.mws.activities.** { *; }

# Keep Glide
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule {
 <init>(...);
}
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}

# Keep Retrofit
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Keep OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# Keep Gson
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# 16 KB Page Size Compatibility Rules
# Exclude problematic Fresco libraries
-dontwarn com.facebook.fresco.**
-dontwarn com.facebook.imagepipeline.**
-dontwarn com.facebook.nativefilters.**
-dontwarn com.facebook.nativeimagetranscoder.**

# Keep Cloudinary but exclude Fresco dependencies
-keep class com.cloudinary.** { *; }
-dontwarn com.cloudinary.**

# Ensure proper native library handling
-keep class * implements android.app.Application
-keep class * extends android.app.Application
