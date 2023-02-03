# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.9](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.8...1.0.0-alpha.9) (2023-02-03)


### Bug Fixes

* Fixes the theme editor. ([36ae7a1](https://github.com/Thorium-Sim/thorium-nova/commit/36ae7a1ae7996b1854428bd4093cf6ce2ab98272))


### Features

* Add configuration options for Reactor systems. ([694bdcf](https://github.com/Thorium-Sim/thorium-nova/commit/694bdcfb980200cf708a3e3634e26c7e8053e9ff))
* Add Reactor fuel system. ([9e1898a](https://github.com/Thorium-Sim/thorium-nova/commit/9e1898a946d6e0dafcb451dee33a5c86ded3c171))
* Add support for gamepads and joysticks to the Pilot card ([2d945e2](https://github.com/Thorium-Sim/thorium-nova/commit/2d945e2007c9de64c3d17a2a41abf75e32fdf8a8))
* Alert Condition Card. Thanks Tanner ([f59f2ab](https://github.com/Thorium-Sim/thorium-nova/commit/f59f2ab98e8fdc53f6106050180183b140c7a3af))
* Always show the Thorium account option in the menubar when the user is logged in. ([75ec53a](https://github.com/Thorium-Sim/thorium-nova/commit/75ec53a5e4981baf69d40526509ae564ecd9cbf7))
* Configuration for battery ship systems. ([23b9776](https://github.com/Thorium-Sim/thorium-nova/commit/23b97767f00b73bd984c597c36dc01be0b7f353f))
* Configure power settings on ship systems. ([186ca25](https://github.com/Thorium-Sim/thorium-nova/commit/186ca2542651c75eb876076c6a0e4aa94bf6ec12))
* ECS Components fro representing reactors, batteries, power nodes, and power connections. ([0c8c847](https://github.com/Thorium-Sim/thorium-nova/commit/0c8c847c71593f1901f619e6c2aaf01bc9060cc6))
* Generate inventory for ships that don't have a deck map. ([1d0acd5](https://github.com/Thorium-Sim/thorium-nova/commit/1d0acd5f6c0081b651a33a88f51409c5379ebffa))
* Make it possible to assign multiples of the same type of ship system to a ship. ([8250417](https://github.com/Thorium-Sim/thorium-nova/commit/8250417edad651f9f457b9d589d05c3bc462bdbb))
* Make it possible to assign system types to rooms. ([1bd0a39](https://github.com/Thorium-Sim/thorium-nova/commit/1bd0a39867d945326cfef8f263b85af88c8c5a6c))
* Model and simulate the transfer of heat. ([04462f4](https://github.com/Thorium-Sim/thorium-nova/commit/04462f463cf308f3693e9e8fbee9f46286cc6a7a))
* Ships spawn with reactors and power nodes. ([9bd1e58](https://github.com/Thorium-Sim/thorium-nova/commit/9bd1e58dbbe13d632349f5e53b0e12c50108adbd))
* System heat configuration ([c6d75a3](https://github.com/Thorium-Sim/thorium-nova/commit/c6d75a3d719fd6f543d1e2becbe37cb561d29a2d))

# [1.0.0-alpha.8](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.7...1.0.0-alpha.8) (2023-01-19)


### Bug Fixes

* Adjust waypoint distance to not be so close to planets. ([983a411](https://github.com/Thorium-Sim/thorium-nova/commit/983a411466298979ccb1773f98b517d3f20f317b))
* Don't let external links open in the kiosk window. Closes [#445](https://github.com/Thorium-Sim/thorium-nova/issues/445) ([950ce39](https://github.com/Thorium-Sim/thorium-nova/commit/950ce39c9589c820c3297c7d5b95743c3fbf1321))
* Don't overfill any rooms with cargo. ([d1062c7](https://github.com/Thorium-Sim/thorium-nova/commit/d1062c7865b36ce1c6f7cf64d3de49a990b67cc8))
* Editor palette no longer hides itself. ([326bd93](https://github.com/Thorium-Sim/thorium-nova/commit/326bd933b801f3152269208b33dfab74d0162a47))
* Fix modal backdrop not disappearing. Closes [#454](https://github.com/Thorium-Sim/thorium-nova/issues/454) ([a78509b](https://github.com/Thorium-Sim/thorium-nova/commit/a78509b9fae2c328e51eb6348d03a358e00b82c0))
* Fix the How-to Guide Search. Closes [#462](https://github.com/Thorium-Sim/thorium-nova/issues/462) ([32cb85c](https://github.com/Thorium-Sim/thorium-nova/commit/32cb85cb44dc1ec3e488e0b530a28eac94c2e364))
* Hide autopilot lines on viewscreen ([05c1485](https://github.com/Thorium-Sim/thorium-nova/commit/05c1485eadfab9571d2179eb4c63376063f39784))
* Hide the menubar when kiosked on Windows. Closes [#441](https://github.com/Thorium-Sim/thorium-nova/issues/441) ([af99882](https://github.com/Thorium-Sim/thorium-nova/commit/af998827fead607418e40641777152b7340bdb29))
* How To Guide TOC now scroll to headings properly. Closes [#456](https://github.com/Thorium-Sim/thorium-nova/issues/456) ([f6817e4](https://github.com/Thorium-Sim/thorium-nova/commit/f6817e4a9df8ac696178e679c68219c94b218903))
* **How-to Guides:** Image support. ([18627eb](https://github.com/Thorium-Sim/thorium-nova/commit/18627eb4e004bd9f368cb9c7e971c86122136042))
* Improve how client connections are handled. ([36931cb](https://github.com/Thorium-Sim/thorium-nova/commit/36931cbb2bfffdfbcb2fdf6d100585022686747e))
* Improve the deck navigation. ([ac743f8](https://github.com/Thorium-Sim/thorium-nova/commit/ac743f88a83076e9da7f8a3766b5e8f3ed55fd36))
* Improvements to the nebula renderer. Closes [#447](https://github.com/Thorium-Sim/thorium-nova/issues/447) ([2c2ee59](https://github.com/Thorium-Sim/thorium-nova/commit/2c2ee594927a6bcc15449d83ba7974d254336a1e))
* Improvements to the release notes formatting and navigation. Closes [#443](https://github.com/Thorium-Sim/thorium-nova/issues/443) ([7c7b059](https://github.com/Thorium-Sim/thorium-nova/commit/7c7b059d01b809d6f1579840df7c2b853bd4990f))
* Improves thrust autopilot behavior ([a0e6128](https://github.com/Thorium-Sim/thorium-nova/commit/a0e612866235d455a6511d103ec842f9d8b4a21a))
* Improves thruster Autopilot ([1977b69](https://github.com/Thorium-Sim/thorium-nova/commit/1977b6992909b7fd5378be1fe4a39b3af56be88e))
* **Navigation:** Move camera directly above when following ship ([8fcf72d](https://github.com/Thorium-Sim/thorium-nova/commit/8fcf72d01d8ef0eaa2cafca72e7e899769abee9a))
* Remove the hidden event blocker on the Navigation screen. Closes [#458](https://github.com/Thorium-Sim/thorium-nova/issues/458) ([9d986e8](https://github.com/Thorium-Sim/thorium-nova/commit/9d986e8b911e89c9ce4d6fea3bd0b41866b5c97b))
* Remove waypoints from the core starmap. ([70f7b82](https://github.com/Thorium-Sim/thorium-nova/commit/70f7b8216d2f5883d1bde61aac0943708b7dae70))
* User experience improvements to starmaps ([0be5528](https://github.com/Thorium-Sim/thorium-nova/commit/0be5528c896793aa494b3d39a492903ca6ece709))


### Features

* Add a "Zoom to Object" button on the starmap editor. ([5940621](https://github.com/Thorium-Sim/thorium-nova/commit/59406210ed11943ade10dfb502b8d3dfac45fd14))
* Add a brief getting started guide. ([7c1a800](https://github.com/Thorium-Sim/thorium-nova/commit/7c1a800a583cc7fe02f4db5808ae59b872b06a77))
* **How-to Guide:** Add images to Getting Started ([bb1a9da](https://github.com/Thorium-Sim/thorium-nova/commit/bb1a9dab9f03bd882d47dd105ac11bfaf8075cfe))
* Make the flight name configurable. Closes [#451](https://github.com/Thorium-Sim/thorium-nova/issues/451) ([3c09a7c](https://github.com/Thorium-Sim/thorium-nova/commit/3c09a7c6c2d110a78f2ad90ad688b241a6c16fe7))
* **Navigation:** Adds a button for easily entering systems ([d8436c2](https://github.com/Thorium-Sim/thorium-nova/commit/d8436c250bd8e64942d173af5c59b2144947c74f))

# [1.0.0-alpha.8](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.7...1.0.0-alpha.8) (2023-01-19)


### Bug Fixes

* Adjust waypoint distance to not be so close to planets. ([983a411](https://github.com/Thorium-Sim/thorium-nova/commit/983a411466298979ccb1773f98b517d3f20f317b))
* Don't let external links open in the kiosk window. Closes [#445](https://github.com/Thorium-Sim/thorium-nova/issues/445) ([950ce39](https://github.com/Thorium-Sim/thorium-nova/commit/950ce39c9589c820c3297c7d5b95743c3fbf1321))
* Don't overfill any rooms with cargo. ([d1062c7](https://github.com/Thorium-Sim/thorium-nova/commit/d1062c7865b36ce1c6f7cf64d3de49a990b67cc8))
* Editor palette no longer hides itself. ([326bd93](https://github.com/Thorium-Sim/thorium-nova/commit/326bd933b801f3152269208b33dfab74d0162a47))
* Fix modal backdrop not disappearing. Closes [#454](https://github.com/Thorium-Sim/thorium-nova/issues/454) ([a78509b](https://github.com/Thorium-Sim/thorium-nova/commit/a78509b9fae2c328e51eb6348d03a358e00b82c0))
* Fix the How-to Guide Search. Closes [#462](https://github.com/Thorium-Sim/thorium-nova/issues/462) ([32cb85c](https://github.com/Thorium-Sim/thorium-nova/commit/32cb85cb44dc1ec3e488e0b530a28eac94c2e364))
* Hide autopilot lines on viewscreen ([05c1485](https://github.com/Thorium-Sim/thorium-nova/commit/05c1485eadfab9571d2179eb4c63376063f39784))
* Hide the menubar when kiosked on Windows. Closes [#441](https://github.com/Thorium-Sim/thorium-nova/issues/441) ([af99882](https://github.com/Thorium-Sim/thorium-nova/commit/af998827fead607418e40641777152b7340bdb29))
* How To Guide TOC now scroll to headings properly. Closes [#456](https://github.com/Thorium-Sim/thorium-nova/issues/456) ([f6817e4](https://github.com/Thorium-Sim/thorium-nova/commit/f6817e4a9df8ac696178e679c68219c94b218903))
* **How-to Guides:** Image support. ([18627eb](https://github.com/Thorium-Sim/thorium-nova/commit/18627eb4e004bd9f368cb9c7e971c86122136042))
* Improve how client connections are handled. ([36931cb](https://github.com/Thorium-Sim/thorium-nova/commit/36931cbb2bfffdfbcb2fdf6d100585022686747e))
* Improve the deck navigation. ([ac743f8](https://github.com/Thorium-Sim/thorium-nova/commit/ac743f88a83076e9da7f8a3766b5e8f3ed55fd36))
* Improvements to the nebula renderer. Closes [#447](https://github.com/Thorium-Sim/thorium-nova/issues/447) ([2c2ee59](https://github.com/Thorium-Sim/thorium-nova/commit/2c2ee594927a6bcc15449d83ba7974d254336a1e))
* Improvements to the release notes formatting and navigation. Closes [#443](https://github.com/Thorium-Sim/thorium-nova/issues/443) ([7c7b059](https://github.com/Thorium-Sim/thorium-nova/commit/7c7b059d01b809d6f1579840df7c2b853bd4990f))
* Improves thrust autopilot behavior ([a0e6128](https://github.com/Thorium-Sim/thorium-nova/commit/a0e612866235d455a6511d103ec842f9d8b4a21a))
* Improves thruster Autopilot ([1977b69](https://github.com/Thorium-Sim/thorium-nova/commit/1977b6992909b7fd5378be1fe4a39b3af56be88e))
* **Navigation:** Move camera directly above when following ship ([8fcf72d](https://github.com/Thorium-Sim/thorium-nova/commit/8fcf72d01d8ef0eaa2cafca72e7e899769abee9a))
* Remove the hidden event blocker on the Navigation screen. Closes [#458](https://github.com/Thorium-Sim/thorium-nova/issues/458) ([9d986e8](https://github.com/Thorium-Sim/thorium-nova/commit/9d986e8b911e89c9ce4d6fea3bd0b41866b5c97b))
* Remove waypoints from the core starmap. ([70f7b82](https://github.com/Thorium-Sim/thorium-nova/commit/70f7b8216d2f5883d1bde61aac0943708b7dae70))
* User experience improvements to starmaps ([0be5528](https://github.com/Thorium-Sim/thorium-nova/commit/0be5528c896793aa494b3d39a492903ca6ece709))


### Features

* Add a "Zoom to Object" button on the starmap editor. ([5940621](https://github.com/Thorium-Sim/thorium-nova/commit/59406210ed11943ade10dfb502b8d3dfac45fd14))
* Add a brief getting started guide. ([7c1a800](https://github.com/Thorium-Sim/thorium-nova/commit/7c1a800a583cc7fe02f4db5808ae59b872b06a77))
* **How-to Guide:** Add images to Getting Started ([bb1a9da](https://github.com/Thorium-Sim/thorium-nova/commit/bb1a9dab9f03bd882d47dd105ac11bfaf8075cfe))
* Make the flight name configurable. Closes [#451](https://github.com/Thorium-Sim/thorium-nova/issues/451) ([3c09a7c](https://github.com/Thorium-Sim/thorium-nova/commit/3c09a7c6c2d110a78f2ad90ad688b241a6c16fe7))
* **Navigation:** Adds a button for easily entering systems ([d8436c2](https://github.com/Thorium-Sim/thorium-nova/commit/d8436c250bd8e64942d173af5c59b2144947c74f))

# [1.0.0-alpha.7](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.6...1.0.0-alpha.7) (2022-12-07)


### Bug Fixes

* **Docs:** Fixes the docs so the properly render after the dependency update. ([296db90](https://github.com/Thorium-Sim/thorium-nova/commit/296db90b3eb3db8c2c19af7ba8be989a56c4732c))
* **Networking:** Overhaul the networking layer to be more flexible for card and core development. ([339ce9c](https://github.com/Thorium-Sim/thorium-nova/commit/339ce9c3690d6f4f88a2862c03a3ea3d111de656))
* **Notifications:** Fix a visual error with notifications on Firefox. Closes [#202](https://github.com/Thorium-Sim/thorium-nova/issues/202) ([836d3f7](https://github.com/Thorium-Sim/thorium-nova/commit/836d3f7745adc421e1a1d0248439022b5c0b3d36))
* **Thorium Account:** Don't show the thorium account profile image if there isn't one. Closes [#236](https://github.com/Thorium-Sim/thorium-nova/issues/236) ([882980a](https://github.com/Thorium-Sim/thorium-nova/commit/882980abbca41a92ac7d1dafaa60dd23822e1c5f))


### Features

* **Autopilot:** Add autopilot for controlling engines. Closes [#346](https://github.com/Thorium-Sim/thorium-nova/issues/346) ([95c7465](https://github.com/Thorium-Sim/thorium-nova/commit/95c74651b8653533001aeec3edf83ebac36ec0ce))
* **Autopilot:** Add rotation autopilot to rotate a ship towards a destination. ([508f3ae](https://github.com/Thorium-Sim/thorium-nova/commit/508f3ae8962d20beeec884dcd50cf070f90de4fd))
* **Flight Director:** Add controls for viewing and spawning ships on the starmap. ([b5d6870](https://github.com/Thorium-Sim/thorium-nova/commit/b5d68705157dbc4e27323064a3d7fc9c6e8e46e9))
* **Flight:** Makes it possible to choose a starting point for a sandbox flight. Closes [#325](https://github.com/Thorium-Sim/thorium-nova/issues/325) ([4d7e0c9](https://github.com/Thorium-Sim/thorium-nova/commit/4d7e0c93e39c211f318167014a1a614c0efa00a9))
* **Impulse Engines:** Add an ECS system to simulate the acceleration and velocity of the impulse engines. ([9b9cdae](https://github.com/Thorium-Sim/thorium-nova/commit/9b9cdaec3d1d0a0fc50e481d601623ceb9745807))
* Include a button on the Navigation screen to make the view follow the ship's position. Closes [#386](https://github.com/Thorium-Sim/thorium-nova/issues/386) ([b3b21f9](https://github.com/Thorium-Sim/thorium-nova/commit/b3b21f95ba501b54741791321267d3fdf7e7b88b))
* **Inertial Dampeners:** Add the plugin definition and config UI for inertial dampeners. ([c5890ca](https://github.com/Thorium-Sim/thorium-nova/commit/c5890cab49e1d1ed086682f9e6d47aeff0a82c89))
* **Inventory:** Add configuration backend and UI for setting the number of cargo containers a ship has. Closes [#262](https://github.com/Thorium-Sim/thorium-nova/issues/262). Closes [#351](https://github.com/Thorium-Sim/thorium-nova/issues/351). ([e23dc65](https://github.com/Thorium-Sim/thorium-nova/commit/e23dc659b26c2bc795205fecda7ebaaf77225bff))
* **Inventory:** Add the backend class, inputs, and request for inventory plugins. Closes [#261](https://github.com/Thorium-Sim/thorium-nova/issues/261) ([ab46cbe](https://github.com/Thorium-Sim/thorium-nova/commit/ab46cbe677aa4923c33a477ed69e253d5028cd35))
* **Inventory:** Add the ECS components for inventory. Closes [#354](https://github.com/Thorium-Sim/thorium-nova/issues/354) ([8ca7059](https://github.com/Thorium-Sim/thorium-nova/commit/8ca705926f1445193d671a2f3eaa63f628ece284))
* **Inventory:** Adds the ability to define inventory in plugins. ([d20e83e](https://github.com/Thorium-Sim/thorium-nova/commit/d20e83e8b33e5f18d0b6f2e95e9243e51fadf6d5)), closes [#363](https://github.com/Thorium-Sim/thorium-nova/issues/363)
* **Inventory:** Cargo containers spawn with player ships. Closes [#355](https://github.com/Thorium-Sim/thorium-nova/issues/355). Closes [#365](https://github.com/Thorium-Sim/thorium-nova/issues/365) ([950fe46](https://github.com/Thorium-Sim/thorium-nova/commit/950fe46d6300e88f690af7a3901610cd6ed0bc98))
* **Navigation:** Add a list for managing waypoints, including deleting waypoints. Closes [#389](https://github.com/Thorium-Sim/thorium-nova/issues/389) ([1228d67](https://github.com/Thorium-Sim/thorium-nova/commit/1228d675beee673fd2c570767560a0dbd3199fdc))
* **Navigation:** Add search field for finding solar systems and planets. Closes [#388](https://github.com/Thorium-Sim/thorium-nova/issues/388) ([75e6143](https://github.com/Thorium-Sim/thorium-nova/commit/75e614344043cd8fe2204c9236c4af0998bbc596))
* **Navigation:** Adds the navigation card ([272626a](https://github.com/Thorium-Sim/thorium-nova/commit/272626a75af96ac4b1c135cf3aa47ea4f38f5269))
* **Pilot:** Add controls for impulse and warp engines. ([219c8f9](https://github.com/Thorium-Sim/thorium-nova/commit/219c8f9a22bdf0859064e43c335a66a9accdf4ab))
* **Pilot:** Add direction and rotation thruster joysticks. ([f9eaf0f](https://github.com/Thorium-Sim/thorium-nova/commit/f9eaf0f86159391a3c06c8160a793a12edd5b454))
* **Pilot:** Add the framework for the pilot sensor grid. ([4648265](https://github.com/Thorium-Sim/thorium-nova/commit/46482651b7e929917699d0251b65af29d9832621))
* **Ship Map:** Add a pathfinding algorithm which takes a ship map and returns the rooms to travel to in order to reach a destination. Closes [#264](https://github.com/Thorium-Sim/thorium-nova/issues/264) ([7fbe026](https://github.com/Thorium-Sim/thorium-nova/commit/7fbe0264b45c5163c87343126a32b749497b6a80))
* **Ship Map:** Adds volume as a property of rooms and adds a flag for rooms to accept cargo. Closes [#263](https://github.com/Thorium-Sim/thorium-nova/issues/263) ([f8647f1](https://github.com/Thorium-Sim/thorium-nova/commit/f8647f1cc5f4a4a3a14f6a2a18103976ff9898ee))
* **Ship Map:** Creates the ECS components and systems for entities to traverse a ship map. Closes [#265](https://github.com/Thorium-Sim/thorium-nova/issues/265) ([43d0264](https://github.com/Thorium-Sim/thorium-nova/commit/43d0264bbb2f302842d62aca7fff3a207da2768d))
* **Ship Map:** Initializes the ship map on the player ship when the flight starts. Closes [#246](https://github.com/Thorium-Sim/thorium-nova/issues/246) ([cc83b62](https://github.com/Thorium-Sim/thorium-nova/commit/cc83b62e00e7561edbf83cb5564bdb1563a3f6f6))
* **Ship Systems:** Makes it possible to override individual properties of a ship system on a per-ship basis. Closes [#328](https://github.com/Thorium-Sim/thorium-nova/issues/328) ([463ee8d](https://github.com/Thorium-Sim/thorium-nova/commit/463ee8ddce5ceb21434543e949a0900ca481ad4f))
* **Star Map:** Initialize the star map when a flight is started. ([4057661](https://github.com/Thorium-Sim/thorium-nova/commit/40576618780551c7942b7603be0673b5d0d342bc))
* **Thrusters:** Add the config UI for thruster systems. Closes [#330](https://github.com/Thorium-Sim/thorium-nova/issues/330) ([3dbe62d](https://github.com/Thorium-Sim/thorium-nova/commit/3dbe62d20e9777ec458a1c39c0b0a932ae7856c5))
* **Warp Engines:** Add the plugin definition and config UI for warp engines. ([97a8658](https://github.com/Thorium-Sim/thorium-nova/commit/97a8658863f21444cf37faddbd20782300e7840b))

# [1.0.0-alpha.7](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.6...1.0.0-alpha.7) (2022-12-02)


### Bug Fixes

* **Docs:** Fixes the docs so the properly render after the dependency update. ([296db90](https://github.com/Thorium-Sim/thorium-nova/commit/296db90b3eb3db8c2c19af7ba8be989a56c4732c))
* **Networking:** Overhaul the networking layer to be more flexible for card and core development. ([339ce9c](https://github.com/Thorium-Sim/thorium-nova/commit/339ce9c3690d6f4f88a2862c03a3ea3d111de656))
* **Notifications:** Fix a visual error with notifications on Firefox. Closes [#202](https://github.com/Thorium-Sim/thorium-nova/issues/202) ([836d3f7](https://github.com/Thorium-Sim/thorium-nova/commit/836d3f7745adc421e1a1d0248439022b5c0b3d36))
* **Thorium Account:** Don't show the thorium account profile image if there isn't one. Closes [#236](https://github.com/Thorium-Sim/thorium-nova/issues/236) ([882980a](https://github.com/Thorium-Sim/thorium-nova/commit/882980abbca41a92ac7d1dafaa60dd23822e1c5f))


### Features

* **Autopilot:** Add autopilot for controlling engines. Closes [#346](https://github.com/Thorium-Sim/thorium-nova/issues/346) ([95c7465](https://github.com/Thorium-Sim/thorium-nova/commit/95c74651b8653533001aeec3edf83ebac36ec0ce))
* **Autopilot:** Add rotation autopilot to rotate a ship towards a destination. ([508f3ae](https://github.com/Thorium-Sim/thorium-nova/commit/508f3ae8962d20beeec884dcd50cf070f90de4fd))
* **Flight Director:** Add controls for viewing and spawning ships on the starmap. ([b5d6870](https://github.com/Thorium-Sim/thorium-nova/commit/b5d68705157dbc4e27323064a3d7fc9c6e8e46e9))
* **Flight:** Makes it possible to choose a starting point for a sandbox flight. Closes [#325](https://github.com/Thorium-Sim/thorium-nova/issues/325) ([4d7e0c9](https://github.com/Thorium-Sim/thorium-nova/commit/4d7e0c93e39c211f318167014a1a614c0efa00a9))
* **Impulse Engines:** Add an ECS system to simulate the acceleration and velocity of the impulse engines. ([9b9cdae](https://github.com/Thorium-Sim/thorium-nova/commit/9b9cdaec3d1d0a0fc50e481d601623ceb9745807))
* Include a button on the Navigation screen to make the view follow the ship's position. Closes [#386](https://github.com/Thorium-Sim/thorium-nova/issues/386) ([b3b21f9](https://github.com/Thorium-Sim/thorium-nova/commit/b3b21f95ba501b54741791321267d3fdf7e7b88b))
* **Inertial Dampeners:** Add the plugin definition and config UI for inertial dampeners. ([c5890ca](https://github.com/Thorium-Sim/thorium-nova/commit/c5890cab49e1d1ed086682f9e6d47aeff0a82c89))
* **Inventory:** Add configuration backend and UI for setting the number of cargo containers a ship has. Closes [#262](https://github.com/Thorium-Sim/thorium-nova/issues/262). Closes [#351](https://github.com/Thorium-Sim/thorium-nova/issues/351). ([e23dc65](https://github.com/Thorium-Sim/thorium-nova/commit/e23dc659b26c2bc795205fecda7ebaaf77225bff))
* **Inventory:** Add the backend class, inputs, and request for inventory plugins. Closes [#261](https://github.com/Thorium-Sim/thorium-nova/issues/261) ([ab46cbe](https://github.com/Thorium-Sim/thorium-nova/commit/ab46cbe677aa4923c33a477ed69e253d5028cd35))
* **Inventory:** Add the ECS components for inventory. Closes [#354](https://github.com/Thorium-Sim/thorium-nova/issues/354) ([8ca7059](https://github.com/Thorium-Sim/thorium-nova/commit/8ca705926f1445193d671a2f3eaa63f628ece284))
* **Inventory:** Adds the ability to define inventory in plugins. ([d20e83e](https://github.com/Thorium-Sim/thorium-nova/commit/d20e83e8b33e5f18d0b6f2e95e9243e51fadf6d5)), closes [#363](https://github.com/Thorium-Sim/thorium-nova/issues/363)
* **Inventory:** Cargo containers spawn with player ships. Closes [#355](https://github.com/Thorium-Sim/thorium-nova/issues/355). Closes [#365](https://github.com/Thorium-Sim/thorium-nova/issues/365) ([950fe46](https://github.com/Thorium-Sim/thorium-nova/commit/950fe46d6300e88f690af7a3901610cd6ed0bc98))
* **Navigation:** Add a list for managing waypoints, including deleting waypoints. Closes [#389](https://github.com/Thorium-Sim/thorium-nova/issues/389) ([1228d67](https://github.com/Thorium-Sim/thorium-nova/commit/1228d675beee673fd2c570767560a0dbd3199fdc))
* **Navigation:** Add search field for finding solar systems and planets. Closes [#388](https://github.com/Thorium-Sim/thorium-nova/issues/388) ([75e6143](https://github.com/Thorium-Sim/thorium-nova/commit/75e614344043cd8fe2204c9236c4af0998bbc596))
* **Navigation:** Adds the navigation card ([272626a](https://github.com/Thorium-Sim/thorium-nova/commit/272626a75af96ac4b1c135cf3aa47ea4f38f5269))
* **Pilot:** Add controls for impulse and warp engines. ([219c8f9](https://github.com/Thorium-Sim/thorium-nova/commit/219c8f9a22bdf0859064e43c335a66a9accdf4ab))
* **Pilot:** Add direction and rotation thruster joysticks. ([f9eaf0f](https://github.com/Thorium-Sim/thorium-nova/commit/f9eaf0f86159391a3c06c8160a793a12edd5b454))
* **Pilot:** Add the framework for the pilot sensor grid. ([4648265](https://github.com/Thorium-Sim/thorium-nova/commit/46482651b7e929917699d0251b65af29d9832621))
* **Ship Map:** Add a pathfinding algorithm which takes a ship map and returns the rooms to travel to in order to reach a destination. Closes [#264](https://github.com/Thorium-Sim/thorium-nova/issues/264) ([7fbe026](https://github.com/Thorium-Sim/thorium-nova/commit/7fbe0264b45c5163c87343126a32b749497b6a80))
* **Ship Map:** Adds volume as a property of rooms and adds a flag for rooms to accept cargo. Closes [#263](https://github.com/Thorium-Sim/thorium-nova/issues/263) ([f8647f1](https://github.com/Thorium-Sim/thorium-nova/commit/f8647f1cc5f4a4a3a14f6a2a18103976ff9898ee))
* **Ship Map:** Creates the ECS components and systems for entities to traverse a ship map. Closes [#265](https://github.com/Thorium-Sim/thorium-nova/issues/265) ([43d0264](https://github.com/Thorium-Sim/thorium-nova/commit/43d0264bbb2f302842d62aca7fff3a207da2768d))
* **Ship Map:** Initializes the ship map on the player ship when the flight starts. Closes [#246](https://github.com/Thorium-Sim/thorium-nova/issues/246) ([cc83b62](https://github.com/Thorium-Sim/thorium-nova/commit/cc83b62e00e7561edbf83cb5564bdb1563a3f6f6))
* **Ship Systems:** Makes it possible to override individual properties of a ship system on a per-ship basis. Closes [#328](https://github.com/Thorium-Sim/thorium-nova/issues/328) ([463ee8d](https://github.com/Thorium-Sim/thorium-nova/commit/463ee8ddce5ceb21434543e949a0900ca481ad4f))
* **Star Map:** Initialize the star map when a flight is started. ([4057661](https://github.com/Thorium-Sim/thorium-nova/commit/40576618780551c7942b7603be0673b5d0d342bc))
* **Thrusters:** Add the config UI for thruster systems. Closes [#330](https://github.com/Thorium-Sim/thorium-nova/issues/330) ([3dbe62d](https://github.com/Thorium-Sim/thorium-nova/commit/3dbe62d20e9777ec458a1c39c0b0a932ae7856c5))
* **Warp Engines:** Add the plugin definition and config UI for warp engines. ([97a8658](https://github.com/Thorium-Sim/thorium-nova/commit/97a8658863f21444cf37faddbd20782300e7840b))

# [1.0.0-alpha.7](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.6...1.0.0-alpha.7) (2022-10-11)


### Bug Fixes

* **Docs:** Fixes the docs so the properly render after the dependency update. ([296db90](https://github.com/Thorium-Sim/thorium-nova/commit/296db90b3eb3db8c2c19af7ba8be989a56c4732c))
* **Networking:** Overhaul the networking layer to be more flexible for card and core development. ([339ce9c](https://github.com/Thorium-Sim/thorium-nova/commit/339ce9c3690d6f4f88a2862c03a3ea3d111de656))
* **Notifications:** Fix a visual error with notifications on Firefox. Closes [#202](https://github.com/Thorium-Sim/thorium-nova/issues/202) ([836d3f7](https://github.com/Thorium-Sim/thorium-nova/commit/836d3f7745adc421e1a1d0248439022b5c0b3d36))
* **Thorium Account:** Don't show the thorium account profile image if there isn't one. Closes [#236](https://github.com/Thorium-Sim/thorium-nova/issues/236) ([882980a](https://github.com/Thorium-Sim/thorium-nova/commit/882980abbca41a92ac7d1dafaa60dd23822e1c5f))


### Features

* **Autopilot:** Add autopilot for controlling engines. Closes [#346](https://github.com/Thorium-Sim/thorium-nova/issues/346) ([95c7465](https://github.com/Thorium-Sim/thorium-nova/commit/95c74651b8653533001aeec3edf83ebac36ec0ce))
* **Autopilot:** Add rotation autopilot to rotate a ship towards a destination. ([508f3ae](https://github.com/Thorium-Sim/thorium-nova/commit/508f3ae8962d20beeec884dcd50cf070f90de4fd))
* **Flight Director:** Add controls for viewing and spawning ships on the starmap. ([b5d6870](https://github.com/Thorium-Sim/thorium-nova/commit/b5d68705157dbc4e27323064a3d7fc9c6e8e46e9))
* **Flight:** Makes it possible to choose a starting point for a sandbox flight. Closes [#325](https://github.com/Thorium-Sim/thorium-nova/issues/325) ([4d7e0c9](https://github.com/Thorium-Sim/thorium-nova/commit/4d7e0c93e39c211f318167014a1a614c0efa00a9))
* **Impulse Engines:** Add an ECS system to simulate the acceleration and velocity of the impulse engines. ([9b9cdae](https://github.com/Thorium-Sim/thorium-nova/commit/9b9cdaec3d1d0a0fc50e481d601623ceb9745807))
* Include a button on the Navigation screen to make the view follow the ship's position. Closes [#386](https://github.com/Thorium-Sim/thorium-nova/issues/386) ([b3b21f9](https://github.com/Thorium-Sim/thorium-nova/commit/b3b21f95ba501b54741791321267d3fdf7e7b88b))
* **Inertial Dampeners:** Add the plugin definition and config UI for inertial dampeners. ([c5890ca](https://github.com/Thorium-Sim/thorium-nova/commit/c5890cab49e1d1ed086682f9e6d47aeff0a82c89))
* **Inventory:** Add configuration backend and UI for setting the number of cargo containers a ship has. Closes [#262](https://github.com/Thorium-Sim/thorium-nova/issues/262). Closes [#351](https://github.com/Thorium-Sim/thorium-nova/issues/351). ([e23dc65](https://github.com/Thorium-Sim/thorium-nova/commit/e23dc659b26c2bc795205fecda7ebaaf77225bff))
* **Inventory:** Add the backend class, inputs, and request for inventory plugins. Closes [#261](https://github.com/Thorium-Sim/thorium-nova/issues/261) ([ab46cbe](https://github.com/Thorium-Sim/thorium-nova/commit/ab46cbe677aa4923c33a477ed69e253d5028cd35))
* **Inventory:** Add the ECS components for inventory. Closes [#354](https://github.com/Thorium-Sim/thorium-nova/issues/354) ([8ca7059](https://github.com/Thorium-Sim/thorium-nova/commit/8ca705926f1445193d671a2f3eaa63f628ece284))
* **Inventory:** Adds the ability to define inventory in plugins. ([d20e83e](https://github.com/Thorium-Sim/thorium-nova/commit/d20e83e8b33e5f18d0b6f2e95e9243e51fadf6d5)), closes [#363](https://github.com/Thorium-Sim/thorium-nova/issues/363)
* **Inventory:** Cargo containers spawn with player ships. Closes [#355](https://github.com/Thorium-Sim/thorium-nova/issues/355). Closes [#365](https://github.com/Thorium-Sim/thorium-nova/issues/365) ([950fe46](https://github.com/Thorium-Sim/thorium-nova/commit/950fe46d6300e88f690af7a3901610cd6ed0bc98))
* **Navigation:** Add a list for managing waypoints, including deleting waypoints. Closes [#389](https://github.com/Thorium-Sim/thorium-nova/issues/389) ([1228d67](https://github.com/Thorium-Sim/thorium-nova/commit/1228d675beee673fd2c570767560a0dbd3199fdc))
* **Navigation:** Add search field for finding solar systems and planets. Closes [#388](https://github.com/Thorium-Sim/thorium-nova/issues/388) ([75e6143](https://github.com/Thorium-Sim/thorium-nova/commit/75e614344043cd8fe2204c9236c4af0998bbc596))
* **Navigation:** Adds the navigation card ([272626a](https://github.com/Thorium-Sim/thorium-nova/commit/272626a75af96ac4b1c135cf3aa47ea4f38f5269))
* **Pilot:** Add controls for impulse and warp engines. ([219c8f9](https://github.com/Thorium-Sim/thorium-nova/commit/219c8f9a22bdf0859064e43c335a66a9accdf4ab))
* **Pilot:** Add direction and rotation thruster joysticks. ([f9eaf0f](https://github.com/Thorium-Sim/thorium-nova/commit/f9eaf0f86159391a3c06c8160a793a12edd5b454))
* **Pilot:** Add the framework for the pilot sensor grid. ([4648265](https://github.com/Thorium-Sim/thorium-nova/commit/46482651b7e929917699d0251b65af29d9832621))
* **Ship Map:** Add a pathfinding algorithm which takes a ship map and returns the rooms to travel to in order to reach a destination. Closes [#264](https://github.com/Thorium-Sim/thorium-nova/issues/264) ([7fbe026](https://github.com/Thorium-Sim/thorium-nova/commit/7fbe0264b45c5163c87343126a32b749497b6a80))
* **Ship Map:** Adds volume as a property of rooms and adds a flag for rooms to accept cargo. Closes [#263](https://github.com/Thorium-Sim/thorium-nova/issues/263) ([f8647f1](https://github.com/Thorium-Sim/thorium-nova/commit/f8647f1cc5f4a4a3a14f6a2a18103976ff9898ee))
* **Ship Map:** Creates the ECS components and systems for entities to traverse a ship map. Closes [#265](https://github.com/Thorium-Sim/thorium-nova/issues/265) ([43d0264](https://github.com/Thorium-Sim/thorium-nova/commit/43d0264bbb2f302842d62aca7fff3a207da2768d))
* **Ship Map:** Initializes the ship map on the player ship when the flight starts. Closes [#246](https://github.com/Thorium-Sim/thorium-nova/issues/246) ([cc83b62](https://github.com/Thorium-Sim/thorium-nova/commit/cc83b62e00e7561edbf83cb5564bdb1563a3f6f6))
* **Ship Systems:** Makes it possible to override individual properties of a ship system on a per-ship basis. Closes [#328](https://github.com/Thorium-Sim/thorium-nova/issues/328) ([463ee8d](https://github.com/Thorium-Sim/thorium-nova/commit/463ee8ddce5ceb21434543e949a0900ca481ad4f))
* **Star Map:** Initialize the star map when a flight is started. ([4057661](https://github.com/Thorium-Sim/thorium-nova/commit/40576618780551c7942b7603be0673b5d0d342bc))
* **Thrusters:** Add the config UI for thruster systems. Closes [#330](https://github.com/Thorium-Sim/thorium-nova/issues/330) ([3dbe62d](https://github.com/Thorium-Sim/thorium-nova/commit/3dbe62d20e9777ec458a1c39c0b0a932ae7856c5))
* **Warp Engines:** Add the plugin definition and config UI for warp engines. ([97a8658](https://github.com/Thorium-Sim/thorium-nova/commit/97a8658863f21444cf37faddbd20782300e7840b))

# [1.0.0-alpha.7](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.6...1.0.0-alpha.7) (2022-10-08)


### Bug Fixes

* **Docs:** Fixes the docs so the properly render after the dependency update. ([296db90](https://github.com/Thorium-Sim/thorium-nova/commit/296db90b3eb3db8c2c19af7ba8be989a56c4732c))
* **Networking:** Overhaul the networking layer to be more flexible for card and core development. ([339ce9c](https://github.com/Thorium-Sim/thorium-nova/commit/339ce9c3690d6f4f88a2862c03a3ea3d111de656))
* **Notifications:** Fix a visual error with notifications on Firefox. Closes [#202](https://github.com/Thorium-Sim/thorium-nova/issues/202) ([836d3f7](https://github.com/Thorium-Sim/thorium-nova/commit/836d3f7745adc421e1a1d0248439022b5c0b3d36))
* **Thorium Account:** Don't show the thorium account profile image if there isn't one. Closes [#236](https://github.com/Thorium-Sim/thorium-nova/issues/236) ([882980a](https://github.com/Thorium-Sim/thorium-nova/commit/882980abbca41a92ac7d1dafaa60dd23822e1c5f))


### Features

* **Autopilot:** Add autopilot for controlling engines. Closes [#346](https://github.com/Thorium-Sim/thorium-nova/issues/346) ([95c7465](https://github.com/Thorium-Sim/thorium-nova/commit/95c74651b8653533001aeec3edf83ebac36ec0ce))
* **Autopilot:** Add rotation autopilot to rotate a ship towards a destination. ([508f3ae](https://github.com/Thorium-Sim/thorium-nova/commit/508f3ae8962d20beeec884dcd50cf070f90de4fd))
* **Flight Director:** Add controls for viewing and spawning ships on the starmap. ([b5d6870](https://github.com/Thorium-Sim/thorium-nova/commit/b5d68705157dbc4e27323064a3d7fc9c6e8e46e9))
* **Flight:** Makes it possible to choose a starting point for a sandbox flight. Closes [#325](https://github.com/Thorium-Sim/thorium-nova/issues/325) ([4d7e0c9](https://github.com/Thorium-Sim/thorium-nova/commit/4d7e0c93e39c211f318167014a1a614c0efa00a9))
* **Impulse Engines:** Add an ECS system to simulate the acceleration and velocity of the impulse engines. ([9b9cdae](https://github.com/Thorium-Sim/thorium-nova/commit/9b9cdaec3d1d0a0fc50e481d601623ceb9745807))
* Include a button on the Navigation screen to make the view follow the ship's position. Closes [#386](https://github.com/Thorium-Sim/thorium-nova/issues/386) ([b3b21f9](https://github.com/Thorium-Sim/thorium-nova/commit/b3b21f95ba501b54741791321267d3fdf7e7b88b))
* **Inertial Dampeners:** Add the plugin definition and config UI for inertial dampeners. ([c5890ca](https://github.com/Thorium-Sim/thorium-nova/commit/c5890cab49e1d1ed086682f9e6d47aeff0a82c89))
* **Inventory:** Add configuration backend and UI for setting the number of cargo containers a ship has. Closes [#262](https://github.com/Thorium-Sim/thorium-nova/issues/262). Closes [#351](https://github.com/Thorium-Sim/thorium-nova/issues/351). ([e23dc65](https://github.com/Thorium-Sim/thorium-nova/commit/e23dc659b26c2bc795205fecda7ebaaf77225bff))
* **Inventory:** Add the backend class, inputs, and request for inventory plugins. Closes [#261](https://github.com/Thorium-Sim/thorium-nova/issues/261) ([ab46cbe](https://github.com/Thorium-Sim/thorium-nova/commit/ab46cbe677aa4923c33a477ed69e253d5028cd35))
* **Inventory:** Add the ECS components for inventory. Closes [#354](https://github.com/Thorium-Sim/thorium-nova/issues/354) ([8ca7059](https://github.com/Thorium-Sim/thorium-nova/commit/8ca705926f1445193d671a2f3eaa63f628ece284))
* **Inventory:** Adds the ability to define inventory in plugins. ([d20e83e](https://github.com/Thorium-Sim/thorium-nova/commit/d20e83e8b33e5f18d0b6f2e95e9243e51fadf6d5)), closes [#363](https://github.com/Thorium-Sim/thorium-nova/issues/363)
* **Inventory:** Cargo containers spawn with player ships. Closes [#355](https://github.com/Thorium-Sim/thorium-nova/issues/355). Closes [#365](https://github.com/Thorium-Sim/thorium-nova/issues/365) ([950fe46](https://github.com/Thorium-Sim/thorium-nova/commit/950fe46d6300e88f690af7a3901610cd6ed0bc98))
* **Navigation:** Add a list for managing waypoints, including deleting waypoints. Closes [#389](https://github.com/Thorium-Sim/thorium-nova/issues/389) ([1228d67](https://github.com/Thorium-Sim/thorium-nova/commit/1228d675beee673fd2c570767560a0dbd3199fdc))
* **Navigation:** Add search field for finding solar systems and planets. Closes [#388](https://github.com/Thorium-Sim/thorium-nova/issues/388) ([75e6143](https://github.com/Thorium-Sim/thorium-nova/commit/75e614344043cd8fe2204c9236c4af0998bbc596))
* **Navigation:** Adds the navigation card ([272626a](https://github.com/Thorium-Sim/thorium-nova/commit/272626a75af96ac4b1c135cf3aa47ea4f38f5269))
* **Pilot:** Add controls for impulse and warp engines. ([219c8f9](https://github.com/Thorium-Sim/thorium-nova/commit/219c8f9a22bdf0859064e43c335a66a9accdf4ab))
* **Pilot:** Add direction and rotation thruster joysticks. ([f9eaf0f](https://github.com/Thorium-Sim/thorium-nova/commit/f9eaf0f86159391a3c06c8160a793a12edd5b454))
* **Pilot:** Add the framework for the pilot sensor grid. ([4648265](https://github.com/Thorium-Sim/thorium-nova/commit/46482651b7e929917699d0251b65af29d9832621))
* **Ship Map:** Add a pathfinding algorithm which takes a ship map and returns the rooms to travel to in order to reach a destination. Closes [#264](https://github.com/Thorium-Sim/thorium-nova/issues/264) ([7fbe026](https://github.com/Thorium-Sim/thorium-nova/commit/7fbe0264b45c5163c87343126a32b749497b6a80))
* **Ship Map:** Adds volume as a property of rooms and adds a flag for rooms to accept cargo. Closes [#263](https://github.com/Thorium-Sim/thorium-nova/issues/263) ([f8647f1](https://github.com/Thorium-Sim/thorium-nova/commit/f8647f1cc5f4a4a3a14f6a2a18103976ff9898ee))
* **Ship Map:** Creates the ECS components and systems for entities to traverse a ship map. Closes [#265](https://github.com/Thorium-Sim/thorium-nova/issues/265) ([43d0264](https://github.com/Thorium-Sim/thorium-nova/commit/43d0264bbb2f302842d62aca7fff3a207da2768d))
* **Ship Map:** Initializes the ship map on the player ship when the flight starts. Closes [#246](https://github.com/Thorium-Sim/thorium-nova/issues/246) ([cc83b62](https://github.com/Thorium-Sim/thorium-nova/commit/cc83b62e00e7561edbf83cb5564bdb1563a3f6f6))
* **Ship Systems:** Makes it possible to override individual properties of a ship system on a per-ship basis. Closes [#328](https://github.com/Thorium-Sim/thorium-nova/issues/328) ([463ee8d](https://github.com/Thorium-Sim/thorium-nova/commit/463ee8ddce5ceb21434543e949a0900ca481ad4f))
* **Star Map:** Initialize the star map when a flight is started. ([4057661](https://github.com/Thorium-Sim/thorium-nova/commit/40576618780551c7942b7603be0673b5d0d342bc))
* **Thrusters:** Add the config UI for thruster systems. Closes [#330](https://github.com/Thorium-Sim/thorium-nova/issues/330) ([3dbe62d](https://github.com/Thorium-Sim/thorium-nova/commit/3dbe62d20e9777ec458a1c39c0b0a932ae7856c5))
* **Warp Engines:** Add the plugin definition and config UI for warp engines. ([97a8658](https://github.com/Thorium-Sim/thorium-nova/commit/97a8658863f21444cf37faddbd20782300e7840b))

# [1.0.0-alpha.6](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.5...1.0.0-alpha.6) (2022-05-04)


### Features

* **Auto-update:** Enables auto-updates for the Thorium Nova app. ([264ac55](https://github.com/Thorium-Sim/thorium-nova/commit/264ac55138ee3efcc499227336837a4d54d81193))
* **Flight Director:** Add the ability to save flight director flex layouts to ThoriumSim accounts. Closes [#278](https://github.com/Thorium-Sim/thorium-nova/issues/278) ([2cb91ae](https://github.com/Thorium-Sim/thorium-nova/commit/2cb91aecd8e4380a437efe9c2ef5bfbf398592ae))
* **Flight Director:** Adds a flex layout for arranging cores. ([e66eaa6](https://github.com/Thorium-Sim/thorium-nova/commit/e66eaa6023f4faf1d5dd0787b92f427a10ec9d8c)), closes [#276](https://github.com/Thorium-Sim/thorium-nova/issues/276)
* **Flight Lobby:** Add a separate lobby for non-host clients to assign themselves to stations. Closes [#104](https://github.com/Thorium-Sim/thorium-nova/issues/104) ([4bc5eb4](https://github.com/Thorium-Sim/thorium-nova/commit/4bc5eb43043bac20ab060832e05bc12be209adf6))
* **Host:** Add a button and logic for claiming the host position outside of Electron. ([cd55c23](https://github.com/Thorium-Sim/thorium-nova/commit/cd55c2357840455c34be678a746ef1a793460950))
* **Host:** Lock down any operations that only the host can perform. Closes [#127](https://github.com/Thorium-Sim/thorium-nova/issues/127) ([4b162f5](https://github.com/Thorium-Sim/thorium-nova/commit/4b162f5d8428f98a0c137687ff0f29cfc5846542))
* **Login:** Add a Flight Director core for seeing which clients are logged in. ([386a95f](https://github.com/Thorium-Sim/thorium-nova/commit/386a95f6e79abc5107f85b54ed1bbe53515d9395)), closes [#274](https://github.com/Thorium-Sim/thorium-nova/issues/274)
* **Ship Plugin:** Add the ability to assign ship systems to a ship plugin. ([6a4bf1c](https://github.com/Thorium-Sim/thorium-nova/commit/6a4bf1c002d9472c630a7e6c3c947929c1f77d9e))
* **Ship Systems:** Add the ability to create ship system instances and edit their properties from the plugin config UI. Impulse engines only for now. Closes [#251](https://github.com/Thorium-Sim/thorium-nova/issues/251) ([c33ddf7](https://github.com/Thorium-Sim/thorium-nova/commit/c33ddf7b96eb10de990b61f18d733171cf00d596))
* **Ship Systems:** Ship Systems assigned to a ship plugin are now spawned and assigned to a ship. ([5669cee](https://github.com/Thorium-Sim/thorium-nova/commit/5669cee3b1983e40ecc171c588acba35c8db9e33))

# [1.0.0-alpha.5](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.4...1.0.0-alpha.5) (2022-04-21)

### Features

- **Star Map:** Add an editor palette for updating properties of solar systems.
  ([877156c](https://github.com/Thorium-Sim/thorium-nova/commit/877156c72dc62d5ced8c32a6a94361dd9ce84086))
- **Star Map:** Add auto-generated nebula background to the interstellar and
  system maps.
  ([18be783](https://github.com/Thorium-Sim/thorium-nova/commit/18be783324f184c357e2684ae7d75fc1f162068e))
- **Star Map:** Clean up the 3D view and create a top-down 2D view. Closes
  [#179](https://github.com/Thorium-Sim/thorium-nova/issues/179). Closes
  [#178](https://github.com/Thorium-Sim/thorium-nova/issues/178).
  ([a0675b4](https://github.com/Thorium-Sim/thorium-nova/commit/a0675b4ceefab677dcdb3a5bb3d0d54a7f394c90))
- **Star Map:** Enables configuring solar systems, including stars and planets.
  ([96ed284](https://github.com/Thorium-Sim/thorium-nova/commit/96ed28484b8e189a9926e8345b9b46a21b64a7fc))
- **Star Map:** Major improvements to the camera controls for the interstellar
  star map.
  ([0141d6d](https://github.com/Thorium-Sim/thorium-nova/commit/0141d6dfae0da4d1f9d62e0cbcc9b5ceaf40dad5))

# [1.0.0-alpha.4](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.3...1.0.0-alpha.4) (2022-03-23)

### Features

- **Ship Map:** Add deck creation and image upload. Closes
  [#166](https://github.com/Thorium-Sim/thorium-nova/issues/166). Closes
  [#171](https://github.com/Thorium-Sim/thorium-nova/issues/171).
  ([55970ab](https://github.com/Thorium-Sim/thorium-nova/commit/55970ab3816c65202e9b5f7fc537614f5b50865d))
- **Ship Map:** Add the backend for adding and removing nodes and edges from the
  ship map.
  ([49fa053](https://github.com/Thorium-Sim/thorium-nova/commit/49fa053665b88fc83c1495122851156437d04ae4))
- **Ship Map:** Adds the ability to configure the node and edge graph for ship
  maps.
  ([5ecb1ac](https://github.com/Thorium-Sim/thorium-nova/commit/5ecb1ac46859c4a4a4b749baca0c3096cf686a09))
- **Ship Systems:** Add the backend structures for defining ship systems.
  ([d13c17c](https://github.com/Thorium-Sim/thorium-nova/commit/d13c17c97d71dcaa4ba8062dd68c4dfa95fccfff))
- **Star Map:** Add the backend structures for stars, planets, and moons.
  ([8230488](https://github.com/Thorium-Sim/thorium-nova/commit/823048849d91519db5d452a4da3d2e1998404db3))

# [1.0.0-alpha.3](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.2...1.0.0-alpha.3) (2022-02-18)

### Bug Fixes

- **HTTPS:** Fixes an issue with connecting using HTTPS. Closes
  [#206](https://github.com/Thorium-Sim/thorium-nova/issues/206)
  ([f721b2a](https://github.com/Thorium-Sim/thorium-nova/commit/f721b2a9e007a52e5dd6533ca78b4d276225ccf9))

### Features

- **Ship Map:** Add the backend for creating decks on a ship and uploading
  background images.
  ([0bfd79d](https://github.com/Thorium-Sim/thorium-nova/commit/0bfd79d74bd66f8f27625fbf5711a636aa6d9664))
- **Star Map:** Add backend and API for adding, updating, and deleting stars
  from solar systems. Closes
  [#174](https://github.com/Thorium-Sim/thorium-nova/issues/174)
  ([10c71a3](https://github.com/Thorium-Sim/thorium-nova/commit/10c71a3b5aba72c3840d9319dfb7eb97666fdd7d))
- **Star Map:** Add backend and API for adding, updating, and deleting stars
  from solar systems. Closes
  [#174](https://github.com/Thorium-Sim/thorium-nova/issues/174)
  ([681e97a](https://github.com/Thorium-Sim/thorium-nova/commit/681e97affd58629c20924d4d49c1c80492ea54ad))
- **Star Map:** Add the APIs for adding, removing, and updating solar system
  plugins. Refs [#173](https://github.com/Thorium-Sim/thorium-nova/issues/173)
  ([f469d69](https://github.com/Thorium-Sim/thorium-nova/commit/f469d6920b56dd7eb31af695f206a9c14ca5b975))
- **Star Map:** Add the backend data structure for storing Solar Systems in
  plugins. Refs [#173](https://github.com/Thorium-Sim/thorium-nova/issues/173)
  ([febab2c](https://github.com/Thorium-Sim/thorium-nova/commit/febab2ce4177bc51ef6c2bb52c7e94dc00483cc0))

# [1.0.0-alpha.2](https://github.com/Thorium-Sim/thorium-nova/compare/1.0.0-alpha.1...1.0.0-alpha.2) (2022-01-19)

### Bug Fixes

- **Issue Tracker:** Fixes an issue where the issue tracker doesn't submit
  properly. Closes
  [#200](https://github.com/Thorium-Sim/thorium-nova/issues/200)
  ([a77aef5](https://github.com/Thorium-Sim/thorium-nova/commit/a77aef5d7ba5be5529cad628d3a2cffbcf75c335))

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
