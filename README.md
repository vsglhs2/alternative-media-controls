# Alternative media controls

## Motivation

Android firefox do not expose all media session controls. Only play and pause buttons are available to user along with title, artist and artwork metadata. So I though about possible workaround and came along with this solution

## Possible actions and limitations that can be used for implementation

List of actions that are available without direct interaction with webpage:

1. Notifications:
    - click
    - show (worthless)
    - close (do not work in android firefox)
2. Media session controls:
    - play
    - pause
    - stop (do not work in android firefox)

Only pause and play actions are available without screen unlock

## Current implementation

per tap (count):
1. play or pause
2. track:
    1. nexttrack
    2. previoustrack
    3. exit
3. seek
    1. seekforward
    2. seekbackward
    3. exit
4. volume
    1. volumeup
    2. volumedown
    3. exit


## Need to implement
- dragable seek (?)
- previous video
- next video
- restart video (?)
- chapter information
- metadata information
- volume regulation (override audio element?)
- seek widget (?)
- in locked mode show only one notification, otherwise, as much, as need (?)
- use chapters for showing previous and next track (?)
- maybe use silent audio to force showing pause button on firefox android (?)

# Possible ways to organize interactions
1. Play/pause sequencing (short + long presses)
2. Nesting action groups like:
    - player: (1)
        - exit: (1)
        - play: (2)
        - pause: (3)
        - nexttrack: (4)
        - prevtrack: (5)
        - ...

    - chapters: (2)
        - exit: (1)
        - chapter1: (2)
        - chapter2: (3)
        - ...

    - ...
3. Show media session metadata and conditionally show actions info via notifications

## Intention

- override firefox media session actions
- provide a way to emulate those actions by other means
- give to user a customizable set of controls to map to actions
