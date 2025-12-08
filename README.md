# TabOS Browser

A fully functional, Google-free web browser that runs on Chromebooks and any modern web platform.

## Features

- **Tab Management**: Create, switch, and close multiple tabs
- **Navigation Controls**: Back, forward, refresh, and home buttons with history tracking
- **Address Bar**: Smart URL and search input that uses DuckDuckGo
- **Bookmarks**: Save and manage your favorite websites
- **Browsing History**: Track and revisit recently visited pages
- **Settings Panel**: View browser info and manage your data
- **Modern UI**: Clean, dark-themed interface with smooth animations
- **Privacy First**: No Google dependencies, uses DuckDuckGo as default search
- **Cloud Sync**: Optional Supabase integration for syncing bookmarks and history

## Technologies

- **Vite**: Fast build tool and dev server
- **Supabase**: Optional backend for data persistence
- **DuckDuckGo**: Default search engine
- **Pure JavaScript**: No framework dependencies

## Setup

1. Install dependencies:
```bash
npm install
```

2. (Optional) Configure Supabase for cloud sync:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## How It Works

TabOS is a web-based browser that provides a familiar browsing experience. It uses iframes to load web content and includes full tab management, navigation controls, and data persistence.

### Key Components

- **TabManager**: Handles tab creation, switching, and navigation history
- **BookmarkManager**: Manages bookmarks with local storage and optional cloud sync
- **HistoryManager**: Tracks browsing history
- **Main App**: Coordinates all components and handles UI interactions

### Privacy & Data Storage

- Works completely offline with localStorage
- Optional Supabase integration for cross-device sync
- No tracking or analytics
- No Google services or dependencies

## Usage

- **New Tab**: Click the + button or Ctrl/Cmd + T
- **Navigate**: Enter URLs or search terms in the address bar
- **Bookmark**: Click the star icon when viewing a page
- **View Bookmarks**: Click the bookmarks button
- **View History**: Click the history button
- **Settings**: Click the settings gear icon

## License

Apache License 2.0