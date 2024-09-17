apply(from = rootProject.file("buildSrc/shared.gradle.kts"))

plugins {
    id("reportstream.project-conventions")
}

group = "gov.cdc.prime.reportstream"
version = "0.0.1-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.apache.commons:commons-lang3:3.17.0")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation("com.willowtreeapps.assertk:assertk-jvm:0.28.1")
    testImplementation("org.apache.commons:commons-compress:1.26.2")
}

tasks.test {
    useJUnitPlatform()
}
kotlin {
    jvmToolchain(17)
}