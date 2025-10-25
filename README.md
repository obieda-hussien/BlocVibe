# BlocVibe

A visual, drag-and-drop web IDE for Android, similar to Sketchware, but for creating web pages (HTML/CSS/JS).

## Tech Stack
- **Language**: Java (latest stable)
- **UI Framework**: Android XML Layouts
- **Design System**: Material 3 (Material You) - Expressive Style
- **Material Library**: com.google.android.material:material:1.12.0

## Project Structure

```
BlocVibe/
├── app/
│   ├── build.gradle              # App module build configuration with Material 3 & ViewBinding
│   └── src/main/
│       ├── AndroidManifest.xml   # App manifest with all activities
│       ├── java/com/blocvibe/app/
│       │   ├── SplashActivity.java       # Entry point with 2.5s splash
│       │   ├── MainActivity.java         # Project list screen
│       │   ├── EditorActivity.java       # Web IDE editor screen
│       │   ├── Project.java              # Project data model
│       │   ├── ProjectAdapter.java       # RecyclerView adapter for projects
│       │   └── PaletteAdapter.java       # RecyclerView adapter for components
│       └── res/
│           ├── values/
│           │   ├── colors.xml            # Material 3 color palette (day)
│           │   ├── themes.xml            # Day theme with M3 colors
│           │   └── strings.xml           # All app strings
│           ├── values-night/
│           │   └── themes.xml            # Night theme with M3 colors
│           ├── layout/
│           │   ├── activity_splash.xml          # Splash screen layout
│           │   ├── activity_main.xml            # Main project list layout
│           │   ├── activity_editor.xml          # Editor IDE layout
│           │   ├── list_item_project.xml        # Project card item
│           │   ├── bottom_sheet_palette.xml     # Component palette
│           │   └── list_item_palette.xml        # Palette item card
│           ├── menu/
│           │   ├── menu_main.xml         # Main screen menu (Settings)
│           │   └── menu_editor.xml       # Editor menu (Save, Run, View Code)
│           └── drawable/
│               └── ic_*.xml              # Material icons (add, back, settings, etc.)
├── build.gradle              # Root build configuration
├── settings.gradle           # Project settings
└── gradle.properties         # Gradle properties

```

## Features

### 1. Splash Screen (SplashActivity)
- Material 3 styled entry screen
- Displays BlocVibe logo and app name
- 2.5 second delay with progress indicator
- Auto-navigates to MainActivity

### 2. Main Screen (MainActivity)
- **AppBar**: Material Toolbar with "BlocVibe Projects" title and Settings action
- **Project List**: RecyclerView displaying existing projects with:
  - Project thumbnail icon
  - Project name
  - Last modified timestamp
  - Menu button for project options
- **FAB**: ExtendedFloatingActionButton for creating new projects
- **New Project Dialog**: Material AlertDialog to input project name
- Sample projects pre-populated for demonstration

### 3. Editor Screen (EditorActivity)
- **AppBar**: Material Toolbar with:
  - Back navigation button
  - Project name in title
  - Action buttons: Save, Run/Preview, View Code
- **Canvas**: WebView displaying HTML/CSS/JS preview
  - JavaScript enabled
  - Loads welcome placeholder content
- **Bottom Sheet Palette**:
  - Collapsible Material CardView bottom sheet
  - Peek height: 80dp
  - GridLayoutManager with 3 columns
  - Component items: Button, TextView, ImageView, EditText, Card, Container

## Material 3 Design

### Color Palette
The app uses a comprehensive Material 3 color system with:
- **Primary**: Purple (#6750A4)
- **Secondary**: Mauve (#625B71)
- **Tertiary**: Pink (#7D5260)
- **Surface/Background**: Light/Dark variants
- Full day and night theme support

### Typography
- Headlines: `textAppearanceHeadlineMedium`
- Titles: `textAppearanceTitleMedium`
- Body: `textAppearanceBodyMedium/Small`

### Components
- Material Toolbar (AppBarLayout)
- Extended FloatingActionButton
- Material CardView (Elevated & Outlined)
- Material AlertDialog
- LinearProgressIndicator
- Bottom Sheet Behavior

## Build & Run

### Prerequisites
- Android Studio Arctic Fox or later
- JDK 17 or higher
- Android SDK API 34
- Gradle 8.2+

### Build Instructions

1. Clone the repository:
```bash
git clone https://github.com/obieda-hussien/BlocVibe.git
cd BlocVibe
```

2. Open in Android Studio or build via command line:
```bash
./gradlew assembleDebug
```

3. Install on device/emulator:
```bash
./gradlew installDebug
```

### Configuration
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)
- **Compile SDK**: 34
- **ViewBinding**: Enabled
- **Internet Permission**: Required for WebView

## Implementation Details

### ViewBinding
All activities use ViewBinding for type-safe view access:
- `ActivitySplashBinding`
- `ActivityMainBinding`
- `ActivityEditorBinding`
- `ListItemProjectBinding`
- `ListItemPaletteBinding`

### Navigation Flow
```
SplashActivity (Launcher)
    ↓ (2.5s delay)
MainActivity
    ↓ (Click FAB or Project)
EditorActivity
    ↓ (Back button)
MainActivity
```

## Future Enhancements
- Actual drag-and-drop component functionality
- Real-time HTML/CSS/JS code generation
- Project persistence (file storage/database)
- Code editor with syntax highlighting
- Export to APK/HTML functionality
- Component property editor
- CSS styling controls
- JavaScript event handlers

## License
This project is created as a demonstration of Android Material 3 design implementation.

## Author
Created for BlocVibe - A visual web IDE for Android