# Node App

Build with:

```
./build-node.sh
```

Afterwards you can start the dev server with

```
pnpm preview
```

# Mobile-App

The entry point for the mobile app is "/welcome". This is nessesary because middlewares for prerendered apps are not working and thus the Dashboard would be displayed for a very short duration because the app detects, that it should redirect the user to the Login Page.

When running the mobile static compiled version and the web node compiled version on the same device it is nessesary to build the static version first, because `pnpm preview` seems to still use the `.env` file provided in the working directory.

To create a production version of your app:

```bash
./build-static.sh
```

Afterwards you can start the server with `pnpm exec serve build-static`.

## Test the App locally

Run both the node frontend as an api for the app & the static app frontend:

```
./build-static.sh && ./build-node.sh && (pnpm preview & pnpm exec serve build-static)
```

Afterwards you can use the app at http://localhost:3000

or

```
./build-static.sh && ./build-node.sh
pnpm exec serve build-static
pnpm dev
```

## Android

### Android Setup

Download the Command line tools: https://developer.android.com/studio#command-line-tools-only

```
mkdir ~/android-sdk
cd ~/android-sdk
mv ?? ~/android-sdk
unzip commandlinetools-linux-???_latest.zip
```

In the folder cmline-tools I created a folder latest and moved the files into that folder for better versioning.

Install the build tools:

```
sdkmanager "build-tools;34.0.0"
```

Install the Java JDK:

```
sudo apt install openjdk-21-jdk
ls /usr/lib/jvm
java --version
```

Setup the path:

```
export ANDROID_SDK_ROOT=~/android-sdk
export PATH=$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH
export PATH=$ANDROID_SDK_ROOT/emulator:$PATH
```

Maybe you could also do:

```
sudo apt install android-sdk
ls /usr/lib/android-sdk
```

Maybe you need to install the emulator and platform-tools:

```
sdkmanager "emulator"
sdkmanager "platform-tools"
```

### Build the SDK

Set the correct SDK path in android/local.properties (If the file does not exist, create it):

```
sdk.dir=/home/marius/android-sdk
```

Sync changes to capacitor:

```
./build-static.sh
pnpm cap sync android
```

#### Debug SDK

Build Debug SDK:

```
./gradlew assembleDebug
```

Install the APK to the emulator:

```
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

#### Release SDK

Build Debug SDK:

```
./gradlew assembleRelease
```

### Use the Emulator under Linux via CLI

> Alternatively just start Android Studio and you can see an open emulator. You can install the APK easily like mentioned in "Building the SDK -> Debug SDK"

List available devices:

```
avdmanager list avd
```

Install a system image:

```
sdkmanager --list
sdkmanager "system-images;android-35;google_apis;x86_64"
```

Create a avd (Android Virtual Device):

```
avdmanager list device
avdmanager create avd --name "name" --package "system-images;android-35;google_apis;x86_64" --device "pixel_9_pro"
```

Start the device:

```
emulator -avd "name"
```

If "This user doesn't have permissions to use KVM (/dev/kvm).":

```
# Check if you are in the kvm group
groups
# If not, add to group:
sudo usermod -aG kvm $USER
# Log out and back in:
newgrp kvm
```

### Generate Android Release Keystore

```
keytool -genkey -v -keystore release.jks -alias release -keyalg RSA -keysize 2048 -validity 10000
base64 release.jks > release.jks.base64
```
