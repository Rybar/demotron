# Demotron

Interactive lessons for making games in [Picotron](https://www.lexaloffle.com/picotron.php),
live at **https://ryanbmalm.com/demotron/**.

This repo holds only the built site (`site/`). The lessons, the lesson kit and the
builder live in the Picotron workspace (`projects/learn/`); publish from there with
`projects/learn/site/publish.sh`, which rebuilds, copies the output into `site/`,
commits and pushes. Pushing to `main` deploys to GitHub Pages (`.github/workflows/pages.yml`).
