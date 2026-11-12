# Progress - Link preview image and install as app
Branch: feature/link-preview-and-install (made from main at 9957991)
Last updated: 2026-11-12
Live site: https://aceasif.github.io/boomvoyage/ (a sub-folder: every path in the project must be relative)

## Done
- (Earlier work is in main. See git history.)
- Step 1: Link preview. `img/preview.png` (1200x630, 263 KB, 256-colour PNG): four tall panels, the phone view of Sydney, Dubai, Paris and London with shells in the air, the BoomVoyage name on top. Made by a browser script kept outside the project (it opens the running site in real Chrome, fires a few shells in each city, puts the four pictures together and shrinks the PNG); only the PNG is in the project. `index.html`: Open Graph and Twitter card tags with full addresses on https://aceasif.github.io/boomvoyage/ (theme-color was already there). `tests/site.test.js` (new, 6 tests): the tags, the full image address, the file exists, 1200x630, under 300 KB, and every path in index.html is relative.

## In progress
- nothing

## Next step
- Step 2: `manifest.webmanifest` (relative start_url and scope), icons 192 / 512 / maskable 512 / apple-touch 180 in `icons/`, iPhone home-screen tags, tests. A service worker only if installing really needs one (Chrome no longer needs one; check in real Chrome).
- Step 3: README (one preview for every link; how to install on Android and iPhone), final report.

## Decisions
- One preview image for every link. A static site cannot change the preview per ?scene.
- The preview script and the icon script stay outside the project.

## Problems / questions for the user
- The preview can only be seen in real apps after the branch is merged and GitHub Pages has published it. Apps keep old previews for a while.
