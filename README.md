# 🏮 FaroTracker

A premium React Native mobile application built on **Expo SDK 54** designed for customizing, configuring, and viewing high-quality physical notebooks (Cuadernos). FaroTracker provides an interactive editing canvas to customize notebooks, view model catalogs, and manage notebook configurations.

---

## 🚀 Key Features

*   **🎨 Custom Notebook Editor**: An interactive workspace where users can choose layouts, apply, resize, position, and rotate stickers.
*   **📖 Catalog & Model Details**: Browse and inspect detailed information about various notebook models, including sizing, specifications, and customization history.
*   **⚡ State Management with Zustand**: Centralized store handling the notebook designs, canvas status, active sticker placements, and editor state.
*   **🎬 Rich Media Integration**: Utilizes `expo-video` and custom rendering for an immersive experience.
*   **📤 Easy Sharing & Export**: Seamlessly share customized notebook designs using `expo-sharing` and `react-native-view-shot`.

---

## 🛠 Tech Stack

*   **Framework**: [Expo SDK 54](https://expo.dev/) & [React Native 0.81](https://reactnative.dev/)
*   **Navigation**: [React Navigation v7](https://reactnavigation.org/) (Stack Navigator)
*   **State Management**: [Zustand v5](https://github.com/pmndrs/zustand)
*   **Styling**: React Native StyleSheet (with a consistent dark/modern theme)
*   **Build Pipeline**: Expo Application Services (EAS Build)

---

## 📁 Project Structure

```text
FaroTracker/
├── App.js                 # App entry component (Navigation and context setup)
├── index.js               # Root registration point
├── app.json               # Expo configuration settings
├── eas.json               # EAS build profiles (development, preview, production)
├── requirements.md        # Detailed functional and technical requirements
├── src/
│   ├── components/        # Shared presentation components (e.g., Button.js)
│   ├── store/             # Global stores (useDesignStore.js using Zustand)
│   └── features/          # Feature modules
│       ├── splash/        # Intro and video splash screen (IntroScreen.js)
│       ├── hub/           # App navigation dashboard (HubScreen.js)
│       ├── catalog/       # Catalog list (CatalogScreen.js) & model detailed specifications (ModelDetailScreen.js)
│       ├── editor/        # Canvas workspace, sticker rendering, and custom 3D WebView preview (EditorScreen.js, StickerItem.js, StickerPicker.js)
│       ├── auth/          # Placeholder for future user authentication
│       └── checkout/      # Placeholder for standalone checkout module (currently integrated in EditorScreen)
└── assets/                # App icons, splash screens, catalog assets (3D GLB/textures), and local stickers
```

---

## ⚙️ Expo Setup & Development Guide

Follow these steps to set up and run FaroTracker locally.

### 📋 Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/) (comes with Node) or [yarn](https://yarnpkg.com/)
*   [Git](https://git-scm.com/)
*   **For physical device testing**: Install the **Expo Go** app from the Google Play Store or iOS App Store.
*   **For simulator testing**: Setup Xcode (macOS/iOS simulator) or Android Studio (Android emulator).

---

### 📥 Step-by-Step Installation

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd FaroTracker
    ```

2.  **Install Dependencies**
    Using npm:
    ```bash
    npm install
    ```
    *(Or with yarn if preferred: `yarn install`)*

---

### 🖥️ Running the Development Server

Start the Metro Bundler using:
```bash
npm run start
```
This will spin up the Expo development server. You can also start the server directly targeting specific environments:

*   **Android Emulator / Device**: `npm run android`
*   **iOS Simulator**: `npm run ios`
*   **Web Browser**: `npm run web`

> [!TIP]
> **Windows/PowerShell Troubleshooting**: If running scripts is disabled, run the development server using `npm.cmd` or bypass script execution policy:
> *   Start server: `npm.cmd run start` (or `powershell -ExecutionPolicy Bypass -Command "npm run start"`)
> *   Web: `npm.cmd run web`
> *   Android: `npm.cmd run android`
> *   iOS: `npm.cmd run ios`

#### 📱 Connecting Your Device

*   **Expo Go (Physical Device)**:
    1. Scan the QR code displayed in the terminal/browser with your phone's camera (iOS) or the Expo Go app (Android).
    2. Ensure both your computer and your phone are connected to the same Wi-Fi network.
*   **iOS Simulator**: Press `i` in the terminal to launch the app on the simulator.
*   **Android Emulator**: Press `a` in the terminal to launch the app on the emulator.

---

## 📦 Building and Deploying (EAS Build)

FaroTracker is configured with EAS (Expo Application Services) for automated cloud builds.

### 1. Log in to Expo CLI
```bash
npm install -g eas-cli
eas login
```

### 2. Configure project
```bash
eas project:init
```

### 3. Generate Builds
This repository comes pre-configured with three profiles in `eas.json`:

*   **Development Build** (Internal Development Client):
    ```bash
    eas build --profile development --platform all
    ```
*   **Preview Build** (Generates an installable APK for Android & internal testing distribution):
    ```bash
    eas build --profile preview --platform android
    ```
*   **Production Build** (App Store / Google Play distribution):
    ```bash
    eas build --profile production --platform all
    ```

---

## 🔧 Core Files

*   **App Entrance**: [App.js](file:///d:/Gab/Git/Faro/FaroTracker/App.js)
*   **Zustand Store**: [useDesignStore.js](file:///d:/Gab/Git/Faro/FaroTracker/src/store/useDesignStore.js)
*   **Design Canvas**: [EditorScreen.js](file:///d:/Gab/Git/Faro/FaroTracker/src/features/editor/EditorScreen.js)
*   **Model Detail Info**: [ModelDetailScreen.js](file:///d:/Gab/Git/Faro/FaroTracker/src/features/catalog/ModelDetailScreen.js)
*   **Catalog Screen**: [CatalogScreen.js](file:///d:/Gab/Git/Faro/FaroTracker/src/features/catalog/CatalogScreen.js)
*   **Intro Screen**: [IntroScreen.js](file:///d:/Gab/Git/Faro/FaroTracker/src/features/splash/IntroScreen.js)
*   **Hub Dashboard**: [HubScreen.js](file:///d:/Gab/Git/Faro/FaroTracker/src/features/hub/HubScreen.js)
*   **Sticker Picker Modal**: [StickerPicker.js](file:///d:/Gab/Git/Faro/FaroTracker/src/features/editor/StickerPicker.js)
*   **Interactive Sticker Component**: [StickerItem.js](file:///d:/Gab/Git/Faro/FaroTracker/src/features/editor/StickerItem.js)
*   **Custom Button Component**: [Button.js](file:///d:/Gab/Git/Faro/FaroTracker/src/components/Button.js)
