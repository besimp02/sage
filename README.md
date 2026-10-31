# Sage

Static site, no build step. Open `index.html` (or serve the folder from any static host).

```
index.html        page shell, loads the scripts below in order
css/styles.css    all styles
js/config.js      Firebase config + feature flags (REQUIRE_STAFF_LIST, POLICE_AFTER_MIN)
js/assets.js      inlined images (backgrounds, SOS art, buddy SVGs)
js/core.js        Firebase init, localStorage, shared data (D), helpers, contacts, hashing, state (S, me, tab, V)
js/sound.js       sound effects
js/theme.js       mascot, accent colour, background, fireflies
js/auth.js        login view, sign-up, session
js/chat.js        Sage Buddy chat (crisis check, Gemini, local fallback, voice)
js/wellbeing.js   check-in wizard, health score + charts, journal, Mind tab
js/buddy.js       XP/levels, quests, badges, buddy care, Profile tab
js/student.js     Home, Campus, Report
js/warden.js      Live, Audit, Tickets, Wellbeing, Contacts, driver Trip
js/emergency.js   SOS overlay, warden alarm, siren, escalation + police watchers
js/shell.js       nav and render loop
js/main.js        starts sync + watchers, then boot()
```

Scripts are plain (not ES modules) because the markup uses inline `onclick="..."` handlers that need globals.
Load order in `index.html` matters; `main.js` must stay last.

## Demo status (read before launch)

This is a demo build.

- **Data scoping:** each role only subscribes to the data it needs (students: own alerts, tickets, logs; wardens: all alerts, tickets, the student directory without password hashes, anonymous stats; drivers: alerts and ambulance status). This is enforced in the app, not yet in the database.
- **Not yet done:** Firebase Auth and Firestore security rules, so the database itself refuses reads and writes a user should not have. Accounts are currently custom (browser-hashed passwords) and the demo accounts share the password `1234`.
- **Police / 112 auto-dial:** switched off. No code dials automatically; the SOS and escalation screens only show tap-to-call buttons and say so.
