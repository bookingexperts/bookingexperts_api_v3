## Booking Experts API docs

This project creates the documentation of the Booking Experts Open Api 3 specification.

## Guide on maintainance

1. How to run the project in development?

Setup your environment.
```bash
bundle install
npm install
bundle exec middleman server
```

2. The API changed, what to do?

Builds new docs based on the live oas3.json endpoint.
```bash
node oas3_to_markdown.js
```
A new version of `source/index.html.md` will be created.

Don't forget to describe the change in our Release Notes by editing the `source/includes/_release_notes.md`.

3. How to deploy?

The project is hosted through Github Pages.

Deploys to Github Pages.
```bash
git commit -m "<describe change>"
git push
./deploy.sh
```
