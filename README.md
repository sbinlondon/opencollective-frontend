# Open Collective Frontend

[![Circle CI](https://circleci.com/gh/opencollective/opencollective-frontend/tree/master.svg?style=shield)](https://circleci.com/gh/opencollective/opencollective-frontend/tree/master)
[![Slack Status](https://slack.opencollective.org/badge.svg)](https://slack.opencollective.org)
[![Dependency Status](https://david-dm.org/opencollective/opencollective-frontend/status.svg)](https://david-dm.org/opencollective/opencollective-frontend)
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/opencollective/localized.svg)](https://crowdin.com/project/opencollective)

<p align="center">
  <a href="https://github.com/opencollective/opencollective-frontend">
    <img width="525"src="http://res.cloudinary.com/opencollective/image/upload/c_scale,w_1050/v1536861775/opencollective-babel-2018-09-13_ue8yhg.png" alt="Babel - Open Collective">
  </a>
</p>

## Foreword

If you see a step below that could be improved (or is outdated), please update the instructions. We rarely go through this process ourselves, so your fresh pair of eyes and your recent experience with it, makes you the best candidate to improve them for other users. Thank you!

## Development

### Prerequisite

1. Make sure you have Node.js version >= 12.

- We recommend using [nvm](https://github.com/creationix/nvm): `nvm use`.

### Install

We recommend cloning the repository in a folder dedicated to `opencollective` projects.

```
git clone git@github.com:opencollective/opencollective-frontend.git opencollective/frontend
cd opencollective/frontend
npm install
```

### Environment variables

This project requires an access to the Open Collective API.

By default, it will try to connect to the Open Collective staging API, **you don't have to change anything**.

In case you want to connect to the Open Collective API running locally:

- clone, install and start [opencollective-api](https://github.com/opencollective/opencollective-api)
- in this project, copy [`.env.local`](.env.local) to `.env`.

### Start

```
npm run dev
```

## Tests

To run the tests:

- for pages and components use `npm test`
- for end-to-end (e2e) tests using [Cypress](https://www.cypress.io/) see [our dedicated guide](docs/e2e.md).

To update:

- Jest snapshots: run `npm run test:update`
- Translation files: run `npm run langs:update`
- GraphQL schema for ESLint: run `npm run graphql:update`

## Styleguide

We use [React-Styleguidist](https://react-styleguidist.js.org/) to develop and document our React components in isolation with [styled-components](https://www.styled-components.com/) and [styled-system](https://jxnblk.com/styled-system/).

More info: [docs/styleguide.md](docs/styleguide.md)

## Localization

Translating the interface doesn't require any technical skill, you can go on
https://crowdin.com/project/opencollective and start translating right away!

We're currently looking for contributions for the following languages:

- French
- Spanish
- Japanese

Want to add a new language for Open Collective? [Contact us](https://slack.opencollective.org),
we'll be happy to help you to set it up!

## Contributing

Code style? Commit convention? Please check our [Contributing guidelines](CONTRIBUTING.md).

TL;DR: we use [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/), we do like great commit messages and clean Git history.

## Deployment

This project is currently deployed to staging and production with [Heroku](https://www.heroku.com/). To deploy, you need to be a core member of the Open Collective team.

More info: [docs/deployment.md](docs/deployment.md)

## Discussion

If you have any questions, ping us on Slack
(https://slack.opencollective.org) or on Twitter
([@opencollect](https://twitter.com/opencollect)).
