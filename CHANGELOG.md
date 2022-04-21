# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 1.0.0-alpha.1 (2022-04-21)


### Bug Fixes

* **Connection:** Fix an issue where initial data was missing important pieces. ([38511c7](https://github.com/Thorium-Sim/thorium-nova/commit/38511c7fe72539adab313d1f9484c42c338a9b75))
* **HTTPS:** Fixes an issue with connecting using HTTPS. Closes [#206](https://github.com/Thorium-Sim/thorium-nova/issues/206) ([f721b2a](https://github.com/Thorium-Sim/thorium-nova/commit/f721b2a9e007a52e5dd6533ca78b4d276225ccf9))
* **Issue Tracker:** Fixes an issue where the issue tracker doesn't submit properly. Closes [#200](https://github.com/Thorium-Sim/thorium-nova/issues/200) ([a77aef5](https://github.com/Thorium-Sim/thorium-nova/commit/a77aef5d7ba5be5529cad628d3a2cffbcf75c335))
* **NetRequest:** Improves the subscription process for net requests. Closes [#151](https://github.com/Thorium-Sim/thorium-nova/issues/151) ([#152](https://github.com/Thorium-Sim/thorium-nova/issues/152)) ([19ee470](https://github.com/Thorium-Sim/thorium-nova/commit/19ee470f95eb85abe9c31f152c6144800ae92e9c))
* **Networking:** Fixes an issue where reconnecting doesn't restart netRequests. Closes [#79](https://github.com/Thorium-Sim/thorium-nova/issues/79) ([ed42a80](https://github.com/Thorium-Sim/thorium-nova/commit/ed42a806a2b22783ecb4c615b6708f9f6eb060e6))


### Features

* **Client:** Make it possible to assign a client to a station. ([#118](https://github.com/Thorium-Sim/thorium-nova/issues/118)) ([0e1119b](https://github.com/Thorium-Sim/thorium-nova/commit/0e1119bfa59fab23be60315deda540191405081c)), closes [#92](https://github.com/Thorium-Sim/thorium-nova/issues/92)
* **Docs:** Add a built-in search ([#55](https://github.com/Thorium-Sim/thorium-nova/issues/55)) ([0b178db](https://github.com/Thorium-Sim/thorium-nova/commit/0b178db18de8af0952f6f6d303c80f752f430019))
* **Docs:** Added more docs for NetRequests and writing plugins. ([4f7eaa9](https://github.com/Thorium-Sim/thorium-nova/commit/4f7eaa94bcb4c08d91c61fdc1c564fbea291469d))
* **Flight:** Add the UI for configuring the crew for a flight. Closes [#100](https://github.com/Thorium-Sim/thorium-nova/issues/100) ([c8c2198](https://github.com/Thorium-Sim/thorium-nova/commit/c8c2198a8b123cd6e31d2ff82bacb38496abd7c1))
* **Issue Tracker:** Add the issue tracker component ([#142](https://github.com/Thorium-Sim/thorium-nova/issues/142)) ([ac16ff7](https://github.com/Thorium-Sim/thorium-nova/commit/ac16ff7cec4c585352b217f4500f9ae65993bfeb)), closes [#83](https://github.com/Thorium-Sim/thorium-nova/issues/83)
* **Plugins:** Add support for configuring ship templates in plugins. ([1640856](https://github.com/Thorium-Sim/thorium-nova/commit/16408560cb202e9a746db390aafc9f41df0daf5b)), closes [#64](https://github.com/Thorium-Sim/thorium-nova/issues/64) [#58](https://github.com/Thorium-Sim/thorium-nova/issues/58) [#59](https://github.com/Thorium-Sim/thorium-nova/issues/59) [#60](https://github.com/Thorium-Sim/thorium-nova/issues/60)
* **Plugins:** Asset uploading ([f082d47](https://github.com/Thorium-Sim/thorium-nova/commit/f082d47f51a8454e65ed2a726895639b2d6ca3f3))
* **Ship Map:** Add deck creation and image upload. Closes [#166](https://github.com/Thorium-Sim/thorium-nova/issues/166). Closes [#171](https://github.com/Thorium-Sim/thorium-nova/issues/171). ([55970ab](https://github.com/Thorium-Sim/thorium-nova/commit/55970ab3816c65202e9b5f7fc537614f5b50865d))
* **Ship Map:** Add the backend for adding and removing nodes and edges from the ship map. ([49fa053](https://github.com/Thorium-Sim/thorium-nova/commit/49fa053665b88fc83c1495122851156437d04ae4))
* **Ship Map:** Add the backend for creating decks on a ship and uploading background images. ([0bfd79d](https://github.com/Thorium-Sim/thorium-nova/commit/0bfd79d74bd66f8f27625fbf5711a636aa6d9664))
* **Ship Map:** Adds the ability to configure the node and edge graph for ship maps. ([5ecb1ac](https://github.com/Thorium-Sim/thorium-nova/commit/5ecb1ac46859c4a4a4b749baca0c3096cf686a09))
* **Ship Systems:** Add the backend structures for defining ship systems. ([d13c17c](https://github.com/Thorium-Sim/thorium-nova/commit/d13c17c97d71dcaa4ba8062dd68c4dfa95fccfff))
* **Star Map:** Add an editor palette for updating properties of solar systems. ([877156c](https://github.com/Thorium-Sim/thorium-nova/commit/877156c72dc62d5ced8c32a6a94361dd9ce84086))
* **Star Map:** Add auto-generated nebula background to the interstellar and system maps. ([18be783](https://github.com/Thorium-Sim/thorium-nova/commit/18be783324f184c357e2684ae7d75fc1f162068e))
* **Star Map:** Add backend and API for adding, updating, and deleting stars from solar systems. Closes [#174](https://github.com/Thorium-Sim/thorium-nova/issues/174) ([10c71a3](https://github.com/Thorium-Sim/thorium-nova/commit/10c71a3b5aba72c3840d9319dfb7eb97666fdd7d))
* **Star Map:** Add backend and API for adding, updating, and deleting stars from solar systems. Closes [#174](https://github.com/Thorium-Sim/thorium-nova/issues/174) ([681e97a](https://github.com/Thorium-Sim/thorium-nova/commit/681e97affd58629c20924d4d49c1c80492ea54ad))
* **Star Map:** Add the APIs for adding, removing, and updating solar system plugins. Refs [#173](https://github.com/Thorium-Sim/thorium-nova/issues/173) ([f469d69](https://github.com/Thorium-Sim/thorium-nova/commit/f469d6920b56dd7eb31af695f206a9c14ca5b975))
* **Star Map:** Add the backend data structure for storing Solar Systems in plugins. Refs [#173](https://github.com/Thorium-Sim/thorium-nova/issues/173) ([febab2c](https://github.com/Thorium-Sim/thorium-nova/commit/febab2ce4177bc51ef6c2bb52c7e94dc00483cc0))
* **Star Map:** Add the backend structures for stars, planets, and moons. ([8230488](https://github.com/Thorium-Sim/thorium-nova/commit/823048849d91519db5d452a4da3d2e1998404db3))
* **Star Map:** Clean up the 3D view and create a top-down 2D view. Closes [#179](https://github.com/Thorium-Sim/thorium-nova/issues/179). Closes [#178](https://github.com/Thorium-Sim/thorium-nova/issues/178). ([a0675b4](https://github.com/Thorium-Sim/thorium-nova/commit/a0675b4ceefab677dcdb3a5bb3d0d54a7f394c90))
* **Star Map:** Enables configuring solar systems, including stars and planets. ([96ed284](https://github.com/Thorium-Sim/thorium-nova/commit/96ed28484b8e189a9926e8345b9b46a21b64a7fc))
* **Star Map:** Major improvements to the camera controls for the interstellar star map. ([0141d6d](https://github.com/Thorium-Sim/thorium-nova/commit/0141d6dfae0da4d1f9d62e0cbcc9b5ceaf40dad5))
* **Station:** Add the ability to escape from cards ([#153](https://github.com/Thorium-Sim/thorium-nova/issues/153)) ([86bba7a](https://github.com/Thorium-Sim/thorium-nova/commit/86bba7a5197c773f26c5ddd6eca24f9b04681f06)), closes [#146](https://github.com/Thorium-Sim/thorium-nova/issues/146) [#151](https://github.com/Thorium-Sim/thorium-nova/issues/151)
* **Stations:** Create the necessary scaffolding for a station complement plugin aspect. ([3b02377](https://github.com/Thorium-Sim/thorium-nova/commit/3b0237750a90669f2eb84543aa6fa3ce0a0c207e)), closes [#87](https://github.com/Thorium-Sim/thorium-nova/issues/87)
* **Station:** Station Layout ([#139](https://github.com/Thorium-Sim/thorium-nova/issues/139)) ([13d0e9b](https://github.com/Thorium-Sim/thorium-nova/commit/13d0e9b070b80213861f9d0bcb43ad7feccccac6))
* **Themes:** Add the ability to assign a theme to a ship. Closes [#133](https://github.com/Thorium-Sim/thorium-nova/issues/133) ([#145](https://github.com/Thorium-Sim/thorium-nova/issues/145)) ([fb5eb5c](https://github.com/Thorium-Sim/thorium-nova/commit/fb5eb5cda3adddea02992547229b5a306d3b382d))
* **Thorium Account:** Add support for signing into the Thorium Account within Thorium Nova. ([#106](https://github.com/Thorium-Sim/thorium-nova/issues/106)) ([8b5b58a](https://github.com/Thorium-Sim/thorium-nova/commit/8b5b58abb4d7f6a3916353dcd0d0b334e36ca942))

# [1.0.0-alpha.4](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.3...1.0.0-alpha.4) (2022-03-23)


### Features

* **Ship Map:** Add deck creation and image upload. Closes [#166](https://github.com/Thorium-Sim/thorium-nova/issues/166). Closes [#171](https://github.com/Thorium-Sim/thorium-nova/issues/171). ([55970ab](https://github.com/Thorium-Sim/thorium-nova/commit/55970ab3816c65202e9b5f7fc537614f5b50865d))
* **Ship Map:** Add the backend for adding and removing nodes and edges from the ship map. ([49fa053](https://github.com/Thorium-Sim/thorium-nova/commit/49fa053665b88fc83c1495122851156437d04ae4))
* **Ship Map:** Adds the ability to configure the node and edge graph for ship maps. ([5ecb1ac](https://github.com/Thorium-Sim/thorium-nova/commit/5ecb1ac46859c4a4a4b749baca0c3096cf686a09))
* **Ship Systems:** Add the backend structures for defining ship systems. ([d13c17c](https://github.com/Thorium-Sim/thorium-nova/commit/d13c17c97d71dcaa4ba8062dd68c4dfa95fccfff))
* **Star Map:** Add the backend structures for stars, planets, and moons. ([8230488](https://github.com/Thorium-Sim/thorium-nova/commit/823048849d91519db5d452a4da3d2e1998404db3))

# [1.0.0-alpha.3](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.2...1.0.0-alpha.3) (2022-02-18)


### Bug Fixes

* **HTTPS:** Fixes an issue with connecting using HTTPS. Closes [#206](https://github.com/Thorium-Sim/thorium-nova/issues/206) ([f721b2a](https://github.com/Thorium-Sim/thorium-nova/commit/f721b2a9e007a52e5dd6533ca78b4d276225ccf9))


### Features

* **Ship Map:** Add the backend for creating decks on a ship and uploading background images. ([0bfd79d](https://github.com/Thorium-Sim/thorium-nova/commit/0bfd79d74bd66f8f27625fbf5711a636aa6d9664))
* **Star Map:** Add backend and API for adding, updating, and deleting stars from solar systems. Closes [#174](https://github.com/Thorium-Sim/thorium-nova/issues/174) ([10c71a3](https://github.com/Thorium-Sim/thorium-nova/commit/10c71a3b5aba72c3840d9319dfb7eb97666fdd7d))
* **Star Map:** Add backend and API for adding, updating, and deleting stars from solar systems. Closes [#174](https://github.com/Thorium-Sim/thorium-nova/issues/174) ([681e97a](https://github.com/Thorium-Sim/thorium-nova/commit/681e97affd58629c20924d4d49c1c80492ea54ad))
* **Star Map:** Add the APIs for adding, removing, and updating solar system plugins. Refs [#173](https://github.com/Thorium-Sim/thorium-nova/issues/173) ([f469d69](https://github.com/Thorium-Sim/thorium-nova/commit/f469d6920b56dd7eb31af695f206a9c14ca5b975))
* **Star Map:** Add the backend data structure for storing Solar Systems in plugins. Refs [#173](https://github.com/Thorium-Sim/thorium-nova/issues/173) ([febab2c](https://github.com/Thorium-Sim/thorium-nova/commit/febab2ce4177bc51ef6c2bb52c7e94dc00483cc0))

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
