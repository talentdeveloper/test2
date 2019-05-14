
# Overview

The portal web app is an Angular2-based single page web application for managing accounts, devices, and content for the iN2L Focus product.

| Library | Known Working Version |
|--|--:|
| Node | 8.9.1 |
| Angular | 2.4.0 |
| Angular CLI | 1.0.0-beta.32.3 |
| Angle Bootstrap Theme | 3.5.5 |
| Yarn | 1.10.0 |

### Angle Theme

To expedite development, a pre-packaged theme was used to build the project. That theme is the Angle theme found on WrapBootstrap.

To see what components are provided by the theme, visit the demo site. 

| Theme Resource | Link |
|--|--|
| WrapBoostrap | https://wrapbootstrap.com/theme/angle-bootstrap-admin-template-WB04HF123 |
| Theme Changelog | Visit WrapBootstrap link above and click the "Changelog" button below main screenshot image and above theme description |
| Demo | http://themicon.co/theme/angle/v3.5.5/angular2/home | 


# Environment Setup

You will need node on your development machine for this project and for running scripts on the OlympusVagrant project. If not already installed, its recommended to install [Node Version Manager (NVM)](https://github.com/creationix/nvm) first. This allows you to use use multiple versions of node and keeps system directories clean.

We use `yarn` for package management so `npm` commands should not be run directly. Please use `yarn` commands when working with this project.

Setup:
1. Install NVM, Node (ex: `nvm install 8.9.1`)
1. Globally install the latest version of Angular-Cli (ex: `npm install -g @angular/cli`)
1. [Install Yarn](https://yarnpkg.com/en/docs/install)
1. Clone this project
1. Copy the QA config file from the focusconfig repo located at focusconfig/olympusportal/environment.qa.ts to olympusportal/src/environments/environment.qa.ts
1. Run `yarn install` to pull down dependencies


# Running The Web App From The OlympusPortal Directory
1. `yarn start:qa`
1. Go to `http://localhost:4200` to view the site.

### Yarn Commands

| Command | Description |
|--|--|
| `yarn install` | setup project |
| - | - |
| `yarn start` | starts up web app in development mode and watches for file changes. Access in browser at http://localhost:4200 |
| `yarn start:qa` | start server using qa environment config |
| `yarn start:stg` | start server using stg environment config |
| `yarn start:prod` | start server using prod environment config |
| `yarn start:aot:qa` | compile app using Ahead-Of-Time (AOT) compiler with qa environment settings and start up server |
| `yarn start:aot:stg` | compile app using Ahead-Of-Time (AOT) compiler with stg environment settings and start up server |
| `yarn start:aot:prod` | compile app using Ahead-Of-Time (AOT) compiler with prod environment settings and start up server |
| `yarn build:aot:dev` | compile app using Ahead-Of-Time (AOT) compiler with dev environment settings |
| `yarn build:aot:qa` | compile app using Ahead-Of-Time (AOT) compiler with qa environment settings |
| `yarn build:aot:prod` | compile app using Ahead-Of-Time (AOT) compiler with prod environment settings |
| - | - |
| `yarn s3-policy S3_BUCKET AWS_ACCESS_KEY AWS_SECRET_KEY` | generate an s3 policy for amazon s3 uploads. After run, create a `bucketPolicy` property within one of the environment.ts files, set the value of the output above as the value of `bucketPolicy` |
| - | - |
| `yarn ng` | run ng (angular-cli) command line tasks |
| - | - |
| `yarn test` | to execute the unit tests via [Karma](https://karma-runner.github.io) |
| `yarn e2e` | to execute the end-to-end tests via [Protractor](http://www.protractortest.org/). Before running the tests make sure you are serving the app via `yarn start`. (This has not been setup past what the theme provides)
 |
| - | - |
| `yarn lint` | run lint |

# The End