# BoomVoyage

Fireworks from around the world, every 2 minutes.

A single static web page. It draws a night harbour on a canvas and plays a
fireworks show about every two minutes, with sound made live in the browser.
The first stop is Sydney Harbour.

Plain HTML, CSS and JavaScript. No frameworks, no build step, no libraries,
no image, audio or video files.

## Run it

The page uses JavaScript modules, so it needs a small local web server
(opening `index.html` by double-click will not work).

```powershell
py -m http.server 8000
```

Then open http://localhost:8000

More details (tests, deploy, how to add a country) are added at the end of the build.
