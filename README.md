# Alternative media controls

## Motivation

Somehow firefox on android do not expose all media session controls. Only "play" and "pause" buttons are available to user alongside with title, artist and artwork metadata information (not always).

This project tries to reduce the gap in Media Session API as much as possible by utilizing offscreen ways to interact with browser: notifications and basic media session controls. In addition, project aims to provide functionality to map custom actions on top of those ways as its base.

## Possible actions and limitations that can be used for implementation

List of actions that are available without direct interaction with webpage:

1. Notifications:
    - click
    - show*
    - close**
    - actions (buttons)

2. Media session controls:
    - play
    - pause
    - stop**
    - etc...

\* - questionable utility ** - do not work in android firefox

Only pause and play actions are available without screen unlock on firefox android

## MVP

- [ ] implement StateViewer (log, notification, metadata)
- [ ] make notification intercept and simple actions (except buttons)
- [ ] add short/long press sequence
- [ ] create simple ui configurator
- [ ] add onExit method on Handle
- [ ] fix small issues (TODO and THINK on code)

## TODO

- [ ] implement ChapterInformation API
- [ ] dragable seek (?)
- [ ] restart video (?)
- [ ] way to show metadata information
- [ ] seek widget (?)
- [ ] use information about screen lock
- [ ] use chapters for showing previous and next track (?)
- [ ] maybe use silent audio to force showing pause button on firefox android (?)
- [ ] create npm package with core and extra lib
- [ ] create browser extension
- [x] add tempermonkey version
- [ ] setup linter
- [ ] explore, what can be done with locked screen
- [ ] Composite sequence (from other sequences)
