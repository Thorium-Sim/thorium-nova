# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.2](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.1...1.0.0-alpha.2) (2022-01-19)


### Bug Fixes

* **Issue Tracker:** Fixes an issue where the issue tracker doesn't submit properly. Closes [#200](https://github.com/Thorium-Sim/thorium-nova/issues/200) ([a77aef5](https://github.com/Thorium-Sim/thorium-nova/commit/a77aef5d7ba5be5529cad628d3a2cffbcf75c335))

# 1.0.0-alpha.1 (2021-12-23)

### Bug Fixes

- **Connection:** Fix an issue where initial data was missing important pieces.
  ([38511c7](https://github.com/Thorium-Sim/thorium-nova/commit/38511c7fe72539adab313d1f9484c42c338a9b75))
- **NetRequest:** Improves the subscription process for net requests. Closes
  [#151](https://github.com/Thorium-Sim/thorium-nova/issues/151)
  ([#152](https://github.com/Thorium-Sim/thorium-nova/issues/152))
  ([19ee470](https://github.com/Thorium-Sim/thorium-nova/commit/19ee470f95eb85abe9c31f152c6144800ae92e9c))
- **Networking:** Fixes an issue where reconnecting doesn't restart netRequests.
  Closes [#79](https://github.com/Thorium-Sim/thorium-nova/issues/79)
  ([ed42a80](https://github.com/Thorium-Sim/thorium-nova/commit/ed42a806a2b22783ecb4c615b6708f9f6eb060e6))

### Features

- **Client:** Make it possible to assign a client to a station.
  ([#118](https://github.com/Thorium-Sim/thorium-nova/issues/118))
  ([0e1119b](https://github.com/Thorium-Sim/thorium-nova/commit/0e1119bfa59fab23be60315deda540191405081c)),
  closes [#92](https://github.com/Thorium-Sim/thorium-nova/issues/92)
- **Docs:** Add a built-in search
  ([#55](https://github.com/Thorium-Sim/thorium-nova/issues/55))
  ([0b178db](https://github.com/Thorium-Sim/thorium-nova/commit/0b178db18de8af0952f6f6d303c80f752f430019))
- **Docs:** Added more docs for NetRequests and writing plugins.
  ([4f7eaa9](https://github.com/Thorium-Sim/thorium-nova/commit/4f7eaa94bcb4c08d91c61fdc1c564fbea291469d))
- **Flight:** Add the UI for configuring the crew for a flight. Closes
  [#100](https://github.com/Thorium-Sim/thorium-nova/issues/100)
  ([c8c2198](https://github.com/Thorium-Sim/thorium-nova/commit/c8c2198a8b123cd6e31d2ff82bacb38496abd7c1))
- **Issue Tracker:** Add the issue tracker component
  ([#142](https://github.com/Thorium-Sim/thorium-nova/issues/142))
  ([ac16ff7](https://github.com/Thorium-Sim/thorium-nova/commit/ac16ff7cec4c585352b217f4500f9ae65993bfeb)),
  closes [#83](https://github.com/Thorium-Sim/thorium-nova/issues/83)
- **Plugins:** Add support for configuring ship templates in plugins.
  ([1640856](https://github.com/Thorium-Sim/thorium-nova/commit/16408560cb202e9a746db390aafc9f41df0daf5b)),
  closes [#64](https://github.com/Thorium-Sim/thorium-nova/issues/64)
  [#58](https://github.com/Thorium-Sim/thorium-nova/issues/58)
  [#59](https://github.com/Thorium-Sim/thorium-nova/issues/59)
  [#60](https://github.com/Thorium-Sim/thorium-nova/issues/60)
- **Plugins:** Asset uploading
  ([f082d47](https://github.com/Thorium-Sim/thorium-nova/commit/f082d47f51a8454e65ed2a726895639b2d6ca3f3))
- **Station:** Add the ability to escape from cards
  ([#153](https://github.com/Thorium-Sim/thorium-nova/issues/153))
  ([86bba7a](https://github.com/Thorium-Sim/thorium-nova/commit/86bba7a5197c773f26c5ddd6eca24f9b04681f06)),
  closes [#146](https://github.com/Thorium-Sim/thorium-nova/issues/146)
  [#151](https://github.com/Thorium-Sim/thorium-nova/issues/151)
- **Stations:** Create the necessary scaffolding for a station complement plugin
  aspect.
  ([3b02377](https://github.com/Thorium-Sim/thorium-nova/commit/3b0237750a90669f2eb84543aa6fa3ce0a0c207e)),
  closes [#87](https://github.com/Thorium-Sim/thorium-nova/issues/87)
- **Station:** Station Layout
  ([#139](https://github.com/Thorium-Sim/thorium-nova/issues/139))
  ([13d0e9b](https://github.com/Thorium-Sim/thorium-nova/commit/13d0e9b070b80213861f9d0bcb43ad7feccccac6))
- **Themes:** Add the ability to assign a theme to a ship. Closes
  [#133](https://github.com/Thorium-Sim/thorium-nova/issues/133)
  ([#145](https://github.com/Thorium-Sim/thorium-nova/issues/145))
  ([fb5eb5c](https://github.com/Thorium-Sim/thorium-nova/commit/fb5eb5cda3adddea02992547229b5a306d3b382d))
- **Thorium Account:** Add support for signing into the Thorium Account within
  Thorium Nova. ([#106](https://github.com/Thorium-Sim/thorium-nova/issues/106))
  ([8b5b58a](https://github.com/Thorium-Sim/thorium-nova/commit/8b5b58abb4d7f6a3916353dcd0d0b334e36ca942))
