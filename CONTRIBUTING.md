# Contributing

Welcome to Thorium Nova! Contributions of all kinds are welcome. While this
repository mostly includes code contributions, there are many other ways
community members can contribute. Contributions may include:

1. Joining and participating in the the Discord Community
1. Requesting features and reporting bugs
1. Conducting design or user research
1. Contributing code
1. Creating art or assets
1. Writing documentation
1. Working with others.

Before contributing, make sure you read the project README.md and agree to abide
by the Code of Conduct.

## Join the Discord Community

The best way to get started with contributing is to ask! The
[Thorium Discord Server](https://discord.gg/BxwXaUB) is the best place to learn
what is happening and to ask where you can contribute.

### Community Standup and Development Update Meetings

The Thorium community hosts regular meetings in the Discord server. Anyone is
welcome to join, listen in as we discuss progress and make plans, and provide
thoughts and suggestions about the project. This is a great way to contribute
ideas and feedback.

<!--
Eventually, we'll include this, once issues start regularly coming in from regular users.

## Project Management and Issue Triage

We're currently looking for someone interested in performing a project management role. This would involve becoming involved in project planning, understanding the goals and vision for the project, and applying that to the features and issues that come in. -->

## Request Features and Report Bugs

If you want to discuss a large-scale feature, or have a question about some
aspect of development,
[start a new discussion topic](https://github.com/Thorium-Sim/thorium-nova/discussions/new)
on Github. We use discussions to plan out larger features before breaking them
into issues to start development.

For smaller features or bug reports, feel free to file an
[issue](https://github.com/Thorium-Sim/thorium-nova/issues) on Github. If there
is something you want done, file an issue! Use the issue templates to make sure
you provide all the right information. Just be sure to search for any duplicates
before filing your issue.

If there is an existing issue that you want to learn more about or have
suggestions about, add a comment to the issue on Github with your questions or
thoughts.

Check out the [roadmap](https://github.com/Thorium-Sim/thorium-nova/projects/1)
to know what features are coming, what we are working on, and what we have
recently completed.

### Technical Documentation

Updating and maintaining technical documentation is a great way to contribute!
The project has many `.md` files that explain how certain parts of the project
work. If you find any of these are confusing, incomplete, or out of date, file
an issue or submit a pull request!

## Know What to Work On

A handful of issues are labeled
[Help Wanted](https://github.com/Thorium-Sim/thorium-nova/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
and are a good place to start. You can also check the
[roadmap](https://github.com/Thorium-Sim/thorium-nova/projects/1) for tasks that
are planned, but not yet assigned to anyone.

There are also issue labels for different kinds of contribution. Here are links
to those:

- [Design](https://github.com/Thorium-Sim/thorium-nova/issues?q=is%3Aopen+is%3Aissue+label%3ADesign)
- [Assets](https://github.com/Thorium-Sim/thorium-nova/issues?q=is%3Aopen+is%3Aissue+label%3AAsset)
- [Bug](https://github.com/Thorium-Sim/thorium-nova/issues?q=is%3Aopen+is%3Aissue+label%3ABug)
- [Features](https://github.com/Thorium-Sim/thorium-nova/issues?q=is%3Aopen+is%3Aissue+label%3AFeature)
- [Documentation](https://github.com/Thorium-Sim/thorium-nova/issues?q=is%3Aopen+is%3Aissue+label%3ADocumentation)

There are also several other projects that are outside of the core Thorium Nova
project which people can assist with. They include development of
thoriumsim.com, working on the issue tracker, building the plugin store,
creating an automated Discord bot, etc. Reach out on Discord in the
[#development](https://discord.gg/F3adencb7d) channel if you are interested in
working on any of these projects.

Any work should have a corresponding issue. Don't start working on an issue
until you've been assigned to that issue, so we don't get duplicate work. If
there is something you want to work on, add a comment and you'll be assigned.

## Design and Perform User Research

One of the most valuable but nebulous contributions is designing how Thorium
Nova's features will work. This includes both the conceptual design for how
features fit together in the broader simulation, and user experience design for
how users will interact with those features. I don't know of many projects that
ask volunteer contributors to do user research, so there isn't a lot of prior
art to go on here. You'll need to be self-directed if you take on any Design
issues.

Some issues might have designers reach out to potential users of Thorium Nova to
conduct research on how features should work. Designers will work with writers
to figure out how the lore of the universe, including sci-fi technologies,
equate to the crew controls. Of course, these interviews and feedback need to be
recorded somehow (video or written text) so others can take advantage of the
results. These results should be uploaded to Google Drive and announced on
Discord in the [#design](#) channel.

Designers might also be asked to create mockups or wireframes of screens to get
feedback from users about how that screen works. Those designs can also be used
by developers as they work on implementing those screens.

## Contribute Code

Thorium Nova is built using [TypeScript](http://typescriptlang.org),
[React](https://reactjs.org), [Node.js](https://nodejs.org/en/), and
[git](https://guides.github.com/activities/hello-world/). Before contributing
code, make sure you are familiar with these technologies.

### Git Flow & Versioning

Thorium Nova uses a
[git flow](https://nvie.com/posts/a-successful-git-branching-model/) model for
branching and managing releases. The main code branch is `develop`. Any time you
want to make a change to Thorium Nova, create a branch from `develop`, make your
changes, and create a pull request back to `develop`. After review, your branch
will be merged in using a "Squash and Merge" strategy.

Thorium Nova uses [semantic versioning](https://semver.org), which means
bug-only releases are a patch (0.0.X) release, feature releases are a minor
(0.X.0) release, and breaking changes are a major (X.0.0) release. Most people
assume a major release means exciting new features; however, major changes
actually mean the developers made a mistake with the way they originally
designed the program, and fixing that mistake means breaking the way people use
old versions.

Thorium Nova also uses
[conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) messages
to generate a changelog for each new version. While it's recommended you use a
conventional commit message as your pull request name, it's not required. If you
don't, a conventional commit message will be added when your pull request is
merged.

Periodically, the code in `develop` is merged into `main`. Any time code is
merged into `main`, a new version is released automatically.

### Getting Started

Thorium Nova is built with Node.js and React, and uses NPM for package
management. It also uses [Git](https://git-scm.com) for version control. I
recommend using [Volta](https://volta.sh) to manage your Node and NPM versions,
since it will automatically install the correct version when you work on Thorium
Nova. I also recommend using the [VS Code](https://code.visualstudio.com)
editor. Thorium Nova will automatically recommend extensions for VS Code that
will help you during development.

You'll first need to get a copy of Thorium Nova's codebase from Github. You can
do that by running this command:

```bash
git clone https://github.com/Thorium-Sim/thorium-nova.git
```

You can then install dependencies and make changes. However, you won't be able
to push code to the Thorium Nova repo without being given contributor rights.
Send a message on [Discord](https://discord.gg/BxwXaUB) with your Github
username to request access.

Once you have contribution access, you will also have the ability to merge your
own pull request, once it has been reviewed. This also means you can push
directly to the `develop` branch. Please don't do this. 😁 Also note that only
project maintainers have the ability to push code to `main` and trigger a
release.

Once the project has been cloned, you can install dependencies using NPM and
start the project.

```bash
npm install
npm run dev
```

This will automatically start the client and development servers and open up the
UI in your web browser. If it doesn't automatically open, you can open it
yourself by going to http://localhost:3000.

Check the ARCHITECTURE.md document for more details on the project structure,
development tools, and development practice.

### Creating a Feature Branch

Whenever you work on any kind of feature, enhancement, or bug report, always
start by checking out the `develop` branch, pulling the latest changes, creating
a new branch for your work, and installing any new dependencies.

```bash
git checkout develop
git pull
git checkout -b :your branch name:
npm install
```

From there, you can start making your changes, committing as you go, and opening
a pull request when you are ready for your code to be reviewed. Remember, you
can have your code reviewed before you finish your feature. Consider opening a
pull request early and asking for feedback on what you are doing.

### Pull Request Review Guidelines

Before pushing your code to Github, make sure your passes our basic quality
checks by running `npm validate`. This will run automated tests, lint your code
with ESLint, run TypeScript's type checker, and format your code using Prettier.

Consider creating a feature branch and opening a draft pull request before you
even start working on the task. That makes it possible for you to get code
reviews and advice as you are working on the feature. Also, try to keep your
pull requests small - this makes it easier for reviewers to review your code in
a timely manner.

When writing your pull request description, make sure you include a reference to
the issue you are working on. If you intend to open more pull requests after
this one is merged, you can reference it by saying `Refs #123`. If this pull
requests finishes work on the issue, you can write `Closes #123`.

While not every pull request needs to meet all of these criteria, keep these
things in mind as you work on it. Feel free to explain any exceptions in the
pull request description.

- Does my pull request reference an existing issue that I am assigned to?
- Is my pull request small enough to be quickly reviewed? Does it include more
  than one feature or bug fix? If so, it should likely be split.
- Have I assigned the appropriate reviewers to my pull request? This might
  include a code reviewer, a designer, or a writer, depending on the pull
  request.
- Does my code follow similar practices that are used elsewhere in the project?
  Is there any aspect of it that might be challenging for someone new to work on
  in the future?
- Does my code add new dependencies? Be sure to explain what and why in the pull
  request description.
- Does my pull request include UI changes? If so, does it include screenshots or
  videos demonstrating the change?
- Does my pull request add new features that need to be documented in the
  built-in documentation? Is that documentation included in the pull request?
- Is my pull request sufficiently covered by automated tests? This is especially
  important for bug fix pull requests.

Once your pull request is reviewed and any feedback is addressed, it is ready to
merge. You can merge your own pull request once it has been given approval. If
your pull request isn't being reviewed in a timely manner, feel free to ask for
a review on [Discord](https://discord.gg/BxwXaUB).

## Art and Assets

Creating robust starship simulator controls requires the creation of a lot of
art and other assets. As people work on Thorium Nova, they can request assets by
filing an [issue](https://github.com/Thorium-Sim/thorium-nova/issues) with the
`asset` label. Asset issues should include any referenced issue numbers, what
kind of asset is being requested, and a detailed description of what the asset
deliverable should be.

Requesting assignment to an asset issue works the same as with code issues. Once
assigned, the asset creator should work with the person who opened the issue to
figure out the best way of delivering the asset. Once the asset is delivered,
the issue can be closed.

This will require that anyone interested in working on issues create a Github
account. They're free, and will give you the ability to contribute to
discussions in the Thorium Nova repo.

## Writing and Documentation

There is a lot of writing that goes into Thorium Nova. This includes the in-app
documentation for users, on-screen tutorials for players, and eventually story
and mission writing.

Writers might also be invited to write pieces for the regular Thorium email
newsletter and Thorium blog.

<!-- ## Story and Mission Writing


Eventually, we'll request contributions to story and mission writing, but not yet.
-->

<!-- ## Community Management

Eventually, we'll request help with community management, but not yet.

-->

## Work Together

When it thinking about making contributions. it might be tempting to work on a
single task entirely on your own. Your efforts will go further if you include
other contributors with different skills. For example, if you are hoping to
produce a new screen, you might work with:

- A designer, to perform user research and create a mockup
- A developer, to write the code
- An artist, to create the icons and graphics needed
- A writer, to produce the in-game tutorial and documentation page for the
  screen
- A sound effects creator, to generate the necessary sounds for the screen

All of these elements could be integrated as part of the same pull request, or
split across pull requests.

Of course, if you do want to try your hand at a cross-discipline contribution,
feel free. But also consider inviting others to help as you work on a task.

## A Note About Compensation

Thorium Nova is an open source project, and as such has a limited budget. Anyone
contributing to the project should assume that there will be no monetary
compensation for their contributions.

Eventually, when merchandise and swag becomes available, contributors could
receive items as a thank you for their contributions. If Thorium Nova becomes
commercially successful, there will be a discussion of how to fairly share
profit among Thorium Nova contributors.

Any donations made to Thorium Nova through Patreon or otherwise are intended to
be used for development of Thorium Nova, but all funds are used at the sole
discretion of Fyreworks LLC.
