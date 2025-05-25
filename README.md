# Alternative media controls

## Motivation

Android firefox do not expose all media session controls. Only play and pause buttons are available to user along with title, artist and artwork metadata. But somehow, I do not have metadata on my phone at all (both Firefox and Firefox Nightly). So I though about possible workaround and came along with this solution

## Possible actions and limitations that can be used for implementation

List of actions that are available without direct interaction with webpage:

1. Notifications:
    - click
    - show (worthless)
    - close (do not work in android firefox)
2. Media session controls:
    - play
    - pause
    - stop

Only pause and play actions are available without screen unlock

## Need to implement
- dragable seek (?)
- previous video
- next video
- restart video (?)
- chapter information
- metadata information

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
