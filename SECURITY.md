# Security Policy

## Overview

Sideline IQ is a Progressive Web App (PWA) that runs entirely in the browser. This document outlines the security practices and data handling policies of the application.

## Data Storage

### Local-Only Storage
All data is stored **locally on your device** using:
- **IndexedDB** - For match history, team data, player rosters, and attendance records
- **localStorage** - For user preferences and settings

**No data is transmitted to any external server.** Your statistics, team information, and match history never leave your device.

### Data Persistence
- Data persists across browser sessions
- Clearing browser data will remove all stored information
- Using the app in private/incognito mode may limit data persistence

## Data Export/Import

### Backup Files
- The app allows exporting data as JSON backup files
- **Exported files are unencrypted** - treat them as sensitive if they contain private information
- Only import backup files from trusted sources

## Security Measures

### Content Security Policy (CSP)
The app implements a strict Content Security Policy that:
- Restricts script execution to same-origin only
- Prevents inline script injection (XSS attacks)
- Limits resource loading to trusted sources

### No External Dependencies at Runtime
- All assets are bundled and served from the same origin
- No third-party analytics or tracking scripts
- No external API calls

### HTTPS Only
When deployed to GitHub Pages, all traffic is served over HTTPS, ensuring:
- Encrypted data transmission
- Protection against man-in-the-middle attacks
- Secure service worker registration

## Vulnerability Reporting

If you discover a security vulnerability, please:
1. **Do not** open a public issue
2. Email the maintainer directly or open a private security advisory on GitHub
3. Provide detailed steps to reproduce the issue

## Dependencies

Dependencies are regularly audited using `npm audit`. The project maintains up-to-date packages to minimize known vulnerabilities.

## Best Practices for Users

1. **Keep your browser updated** - Security patches are regularly released
2. **Be cautious with backup files** - Don't share exported data publicly if it contains sensitive information
3. **Use on trusted devices** - Since data is stored locally, anyone with access to your browser can view it
4. **Clear data when needed** - Use the app's data management features or browser settings to remove stored data

## Scope

This security policy applies to:
- The Sideline IQ web application
- Data stored in the browser
- Exported backup files

This policy does **not** cover:
- The security of your device or browser
- Third-party services you may use alongside this app
- Network security beyond HTTPS enforcement
