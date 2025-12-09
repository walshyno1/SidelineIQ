# Changelog

All notable changes to the GAA Stats Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.0.3] - 2025-12-07

### Added
- Two Point button for tracking shots scored from beyond the 40m arc (2025 GAA rule change)
- Two-pointers count as 2 points towards total score
- Two-pointers included in shooting accuracy calculations
- Two-pointers displayed in combined point count in traditional score format (G-PP)

## [0.0.2] - 2025-12-07

### Added
- 40-metre two-point scoring arc on pitch visualization (2025 GAA rule change)
- Orange dashed arc line shows the boundary for 2-point scores
- Legend in shot map view explaining the arc meaning

### Changed
- Redesigned tracking page for mobile-first experience
- Team selection now uses tabs instead of side-by-side panels
- Only one team's buttons visible at a time (switch via tabs)
- Larger, more touch-friendly buttons with separate label and count display
- Buttons now arranged in 3-column grid for shots, 2-column for events
- Container limited to max-width for better mobile experience
- Removed team name from panel (now shown in tab)

### Improved
- Better visual feedback with `active:scale-95` on button press
- Clearer button layout with count displayed prominently below label

## [0.0.1] - 2025-12-07

### Added
- Initial project setup with React 19, TypeScript, Vite 7, and Tailwind CSS 4
- Match setup screen with home/away team name input
- Team panels with event tracking buttons for both teams
- Shot tracking: Goals, Points, Wides, Dropped Short, Saved
- Other event tracking: Kickouts Won/Lost, Turnovers Won/Lost
- Interactive shot map with GAA pitch SVG visualization
- Shot location recording modal - tap pitch to mark shot position
- Live statistics display with:
  - Score in GAA format (Goals-Points)
  - Total points calculation
  - Shooting accuracy percentage
  - Kickout win percentage
  - Turnovers won count
- Half time and full time save functionality
- Match state persistence using localStorage
- Undo functionality via right-click on event buttons
- Shot map view showing all shots for both teams
- New match creation with confirmation dialog

### Fixed
- Type mismatch between `TeamStats` interface and `ShotType` values (changed `points`/`goals`/`wides` to `point`/`goal`/`wide` for consistency)
- Added type-only import for `TeamStats` in calculations.ts

### Documentation
- Created comprehensive README.md with project documentation
- Added CHANGELOG.md for tracking changes
