# Sideline IQ - GAA Stats Tracker

A real-time statistics tracking application for Gaelic Athletic Association (GAA) matches. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

### Match Tracking
- **Create new matches** with home and away team names
- **Track both halves** with Half Time and Full Time save buttons
- **Persistent data** - match state is saved to localStorage automatically
- **Optional shot tracking** - toggle shot location recording on/off
- **Optional kickout tracking** - toggle kickout location recording on/off

### Event Tracking
Track the following events for each team:
- **Shots**: Goals, Points, 2-Pointers, Wides, Dropped Short, Saved
- **Own Kickouts**: Won and Lost (with optional location tracking)
- **Turnovers**: Won and Lost

### Shot Map
- Interactive GAA pitch visualization
- When recording a shot, tap on the pitch to mark the exact location
- ✓ marks for scores (goals and points)
- ✗ marks for misses (wides, short, saved)
- View aggregated shot maps for both teams

### Kickout Map
- Interactive pitch visualization for kickout locations
- When recording a kickout (if enabled), tap on the pitch to mark landing zone
- ✓ marks for kickouts won (green)
- ✗ marks for kickouts lost (red)
- View aggregated kickout maps for both teams
- Filter by team (Home/Away tabs)

### Live Statistics
Real-time display of:
- **Score** in GAA format (Goals-Points) and total points
- **Shooting Accuracy %** - (scores / total shots) × 100
- **Own Kickout Win %** - (own kickouts won / total own kickouts) × 100
- **Turnovers Won** count

### Match History
- **IndexedDB persistence** - all completed matches saved automatically
- **View past matches** - browse complete match summaries
- **Export/Import** - backup and restore match data as JSON files
- **Individual match export** - export single matches

### Team Analytics
- **Requires 3+ games** for a team to access analytics
- **Win/Draw/Loss record** with percentages
- **Aggregate statistics** - averages per game
- **Trend graphs** - view performance over time for:
  - Points per game
  - Goals per game
  - Shooting accuracy %
  - Own Kickout win %
  - Turnovers won/lost
- **Kickout Heatmaps** - visualize kickout patterns with:
  - **All Kickouts** - blue heatmap showing landing zones
  - **Kickouts Won** - green heatmap for successful kickouts
  - **Kickouts Lost** - red heatmap for lost kickouts
  - **Success Zones** - grid showing win rate % per zone with color coding
  - **Date Range Filtering** - filter by All Time, Last 30/90 Days, This Year, or custom range
  - Toggle individual markers on/off
- **Shot Heatmaps** - visualize shooting patterns with:
  - **All Shots** - blue heatmap showing shot locations
  - **Scores** - green heatmap for successful shots
  - **Misses** - red heatmap for missed shots
  - **Accuracy Zones** - grid showing accuracy % per zone with color coding
  - **Date Range Filtering** - filter by All Time, Last 30/90 Days, This Year, or custom range
  - Toggle individual markers on/off
- **Recent match history** with vs/@ designation (Home/Away)

### Attendance Tracking
- **Multiple teams** - create and manage multiple squads
- **Team management** - create, rename, or delete teams
- **Squad setup** - add players with optional jersey numbers
- **Event tracking** - create training sessions, matches, or other events
- **Attendance marking** - toggle Present ✓ and Injured 🤕 for each player
- **Bulk actions** - "Mark All Present" and "Clear All" for quick entry
- **Save changes** - explicit save button with unsaved changes indicator
- **Attendance summaries** - see present/absent/injured counts per event
- **Player stats** - view each player's attendance percentage across all events

### Undo Functionality
- Right-click any event button to undo the last recorded event of that type

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Styling
- **ESLint** - Code linting

## Project Structure

```
GAA_Stats/
├── public/                    # Static assets
├── src/
│   ├── assets/               # App assets
│   ├── components/
│   │   ├── AttendanceEventView.tsx  # Individual event attendance marking
│   │   ├── AttendanceTracker.tsx    # Event list and creation
│   │   ├── HalfTimeSummary.tsx      # Half-time statistics summary
│   │   ├── Home.tsx                 # Landing page with navigation
│   │   ├── KickoutHeatmap.tsx       # Kickout heatmap visualization
│   │   ├── KickoutMapView.tsx       # Aggregated kickout map display
│   │   ├── KickoutModal.tsx         # Kickout location recording modal
│   │   ├── LiveStats.tsx            # Real-time score and stats display
│   │   ├── MatchControls.tsx        # Half/Full time and navigation buttons
│   │   ├── MatchHistory.tsx         # Past matches list with export/import
│   │   ├── MatchSetup.tsx           # Initial match setup form
│   │   ├── MatchSummary.tsx         # Full match summary with tabs
│   │   ├── PitchCanvas.tsx          # Interactive GAA pitch SVG
│   │   ├── ShotHeatmap.tsx          # Shot heatmap visualization
│   │   ├── ShotMapView.tsx          # Aggregated shot map display
│   │   ├── ShotModal.tsx            # Shot location recording modal
│   │   ├── SquadSetup.tsx           # Player management for attendance
│   │   ├── TeamAnalytics.tsx        # Team performance analytics
│   │   ├── TeamPanel.tsx            # Team event buttons panel
│   │   └── TeamSelector.tsx         # Team selection for attendance
│   ├── hooks/
│   │   ├── useAttendance.ts         # Attendance state management
│   │   ├── useMatchHistoryDB.ts     # IndexedDB match history hook
│   │   └── useMatchStats.ts         # Match state management hook
│   ├── types/
│   │   ├── attendance.ts            # Attendance type definitions
│   │   └── match.ts                 # Match type definitions
│   ├── utils/
│   │   ├── attendanceDB.ts          # IndexedDB for attendance data
│   │   └── calculations.ts          # Score and stat calculation functions
│   ├── App.tsx               # Main application component
│   ├── App.css               # App-specific styles
│   ├── index.css             # Global styles with Tailwind
│   └── main.tsx              # Application entry point
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── eslint.config.js          # ESLint configuration
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd GAA_Stats

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

### Linting

```bash
npm run lint
```

## Installing on Mobile Devices

Sideline IQ is a Progressive Web App (PWA) that can be installed on Android and iOS devices for an app-like experience.

### Android Installation

1. Open **Chrome** on your Android device
2. Navigate to the deployed app URL
3. Chrome will show an **"Add Sideline IQ to Home screen"** banner at the bottom
   - If the banner doesn't appear, tap the **⋮** menu (three dots) and select **"Add to Home screen"** or **"Install app"**
4. Tap **Install**
5. The app icon appears on your home screen
6. Open from home screen - runs in fullscreen without browser UI
7. Works offline once installed!

### iOS Installation

1. Open **Safari** on your iPhone/iPad
2. Navigate to the deployed app URL
3. Tap the **Share** button (square with arrow pointing up)
4. Scroll down and tap **"Add to Home Screen"**
5. Edit the name if desired, then tap **Add**
6. The app icon appears on your home screen
7. Open from home screen for fullscreen experience

### PWA Features

| Feature | Description |
|---------|-------------|
| 📱 **Installable** | Add to home screen on any device |
| 📴 **Offline Support** | Works without internet after first load |
| 🔄 **Auto-Update** | New versions install automatically |
| 🖥️ **Standalone Mode** | No browser UI when launched from home screen |
| 🎨 **Native Feel** | Dark theme, custom icons, splash screen |

## Usage

### Match Tracking
1. **Start a Match**: Enter home and away team names on the setup screen
2. **Track Events**: Tap event buttons to record goals, points, wides, kickouts, etc.
3. **Mark Shot Locations**: When recording shots (if enabled), tap on the pitch to mark where it was taken
4. **Mark Kickout Locations**: When recording kickouts (if enabled), tap on the pitch to mark landing zone
5. **View Statistics**: The live stats panel shows real-time calculations
6. **Save Progress**: Use Half Time button after first half, Full Time when match ends
7. **View Shot Map**: See all shot locations for both teams
8. **View Kickout Map**: See all kickout landing zones with won/lost markers
9. **Undo Mistakes**: Right-click any button to undo the last event of that type

### Match History
1. **View History**: Click "Match History" from the home screen
2. **Browse Matches**: See all completed matches with scores and dates
3. **Match Details**: Tap a match to view full summary with tabs (Overview, Shots, Action Log)
4. **Export Data**: Export all matches or individual matches as JSON
5. **Import Data**: Restore from a previous backup file

### Team Analytics
1. **Access Analytics**: Click "Team Analytics" from home (requires 3+ games for a team)
2. **Select Team**: Choose a team from the dropdown
3. **View Stats**: See overall record, averages, and recent matches
4. **Trend Analysis**: Click on stat cards to view performance trends over time
5. **Kickout Heatmaps**: Click "View Kickout Heatmap" to analyze kickout patterns:
   - Toggle between All/Won/Lost/Success Zones views
   - See win rate percentages per zone
   - Identify strong and weak areas for kickouts

### Attendance Tracking
1. **Access Attendance**: Click "Attendance Tracking" from home
2. **Create Team**: Add a new team with a name
3. **Manage Squad**: Add players with names and optional jersey numbers
4. **Create Events**: Add training sessions, matches, or other events
5. **Mark Attendance**: Toggle present/injured status for each player
6. **Edit Teams**: Rename or delete teams from the team list

## Data Types

### Team Stats
- `point` - Points scored (1 point each)
- `two_point` - 2-point scores (from 40m+ arc)
- `goal` - Goals scored (3 points each)
- `wide` - Wides hit
- `short` - Shots dropped short
- `saved` - Shots saved by goalkeeper
- `kickout_won` - Own kickouts won
- `kickout_lost` - Own kickouts lost
- `turnover_won` - Turnovers won
- `turnover_lost` - Turnovers lost

### Shot Data
Each shot records:
- Team (home/away)
- Type (goal, point, two_point, wide, short, saved)
- X/Y coordinates on the pitch (if shot tracking enabled)
- Timestamp
- Half (1st or 2nd)

### Kickout Data
Each kickout records:
- Team (home/away) - which team took the kickout
- Outcome (won/lost)
- X/Y coordinates on the pitch (if kickout tracking enabled)
- Timestamp
- Half (1st or 2nd)

### Attendance Data
- **Squad**: Team name with list of players
- **Player**: Name, jersey number (optional), active status
- **Event**: Name, date, attendance records
- **Attendance**: Present/Injured status per player

## Data Storage

- **Match State**: localStorage (`gaa_stats_match`)
- **Match History**: IndexedDB (`gaa_stats_db`)
- **Attendance Data**: IndexedDB (`gaa_attendance_db`)
- **Last Backup Date**: localStorage (`gaa_stats_last_backup`)

## License

MIT

