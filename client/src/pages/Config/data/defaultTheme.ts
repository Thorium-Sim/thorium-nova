const defaultTheme = `@alert5: #2ba1cb;
@alert4: #36c236;
@alert3: #acac34;
@alert2: #cc7926;
@alert1: #ca2a2a;
@alertp: #7a24cf;

/* Fonts */
@font-face {
  font-family: "Battlefield";
  font-style: normal;
  font-weight: 400;
  src: url("/assets/plugins/Thorium Default/assets/theme/Default/BATTLE3.woff")
      format("woff"),
    url("/assets/plugins/Thorium Default/assets/theme/Default/BATTLE3.TTF")
      format("truetype");
}

.card-frame {
  height: 100%;
  width: 100%;
}
.card-frame-ship-name,
.card-frame-station-name,
.card-frame-login-name,
.card-frame-card-name {
  z-index: 11;
  position: absolute;
  font-family: "Battlefield";
  line-height: 0;
  text-shadow: 0px 0px 10px black;
}
.card-frame-ship-name {
  left: 20px;
  bottom: 30px;
  font-size: 2.5rem;
}
.card-frame-ship-logo {
  display: none;
}
.card-frame-ship-logo-image {
}
.card-frame-station-name {
  top: 40px;
  right: 20px;
  font-size: 2rem;
  background-image: url("/assets/plugins/Thorium Default/assets/theme/Default/cookies.png");
  background-size: 10px;
}
.card-frame-station-logo {
  display: none;
}
.card-frame-station-logo-image {
}
.card-frame-card-name {
  top: 40px;
  left: 20px;
  font-size: 2rem;
}
.card-frame-card-icon {
  display: none;
}
.card-frame-card-icon-image {
}
.card-frame-login-name {
  display: none;
}
.card-frame-login-profile {
}
.card-area {
  top: 100px;
  left: 40px;
  right: 40px;
  width: calc(100% - 80px);
  height: calc(100% - 180px);
  position: absolute;
  // background-color:rgba(255,0,0,0.1);
}
.card-switcher-holder {
  z-index: 100;
  position: absolute;
  top: 30px;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.card-switcher {
  display: flex;
  align-items: flex-start;
}
.card-switcher-button {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card-switcher-button-icon {
  margin: 0 20px;
  padding: 0.4rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-sizing: content-box;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  position: relative;
}
.card-switcher-button .card-switcher-button-name {
  display: none;
  position: absolute;
  top: 110%;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 0.2rem 0.8rem;
  border-radius: 3px;
  border: solid 1px rgba(255, 255, 255, 0.5);
  color: white;
  white-space: nowrap;
}
.card-switcher-button:hover .card-switcher-button-name {
  display: block;
}
.doodad-1 {
  z-index: 11;
  pointer-events: none;
  width: calc(100% - 40px);
  height: calc(100% - 40px);
  left: 20px;
  top: 20px;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.2s ease;
}
.doodad-1::after {
  --frame-offset: 50px;
  --card-multiply: 2.8;
  --station-multiply: 3.4;
  --ship-multiply: 3.5;
  content: "";
  transition: background-color 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  // This complicated clip path creates the line around the outer edge of the screen.
  clip-path: polygon(
    0px var(--frame-offset),
    0px calc(100% - var(--frame-offset)),
    calc(var(--ship-name-width) * var(--ship-multiply))
      calc(100% - var(--frame-offset)),
    calc(var(--ship-name-width) * var(--ship-multiply) + var(--frame-offset))
      100%,
    calc(100% - var(--frame-offset)) 100%,
    100% calc(100% - var(--frame-offset)),
    100% var(--frame-offset),
    calc(100% - (var(--station-name-width) * var(--station-multiply)))
      var(--frame-offset),
    calc(
        100% - (var(--station-name-width) * var(--station-multiply)) -
          var(--frame-offset)
      )
      0,
    calc((var(--card-name-width) * var(--card-multiply)) + var(--frame-offset))
      0,
    calc((var(--card-name-width) * var(--card-multiply))) var(--frame-offset),
    0px var(--frame-offset),
    2px calc(var(--frame-offset) + 2px),
    calc((var(--card-name-width) * var(--card-multiply)) + 2px)
      calc(var(--frame-offset) + 2px),
    calc(
        (var(--card-name-width) * var(--card-multiply)) + 2px +
          var(--frame-offset)
      )
      2px,
    calc(
        100% - (var(--station-name-width) * var(--station-multiply)) -
          var(--frame-offset)
      )
      2px,
    calc(100% - var(--station-name-width) * var(--station-multiply))
      calc(var(--frame-offset) + 2px),
    calc(100% - 2px) calc(var(--frame-offset) + 2px),
    calc(100% - 2px) calc(100% - var(--frame-offset) - 2px),
    calc(100% - var(--frame-offset) - 2px) calc(100% - 2px),
    calc(
        var(--ship-name-width) * var(--ship-multiply) + var(--frame-offset) +
          2px
      )
      calc(100% - 2px),
    calc(var(--ship-name-width) * var(--ship-multiply) + 2px)
      calc(100% - var(--frame-offset) - 2px),
    2px calc(100% - var(--frame-offset) - 2px),
    2px calc(var(--frame-offset) + 2px),
    0 calc(var(--frame-offset))
  );
}

.card-switcher-colors(@color) {
  .card-switcher {
    .card-switcher-button-icon {
      color: @color;
      border: solid 2px @color;
      &:hover {
        color: darken(@color, 20%);
        border: solid 2px darken(@color, 20%);
      }
      &.active {
        color: lighten(@color, 20%);
        border: solid 2px lighten(@color, 20%);
      }
    }
  }
}
.frame-colors(@color) {
  .card-frame {
    background: linear-gradient(
      35deg,
      #000000 22%,
      darken(@color, 35%) 53%,
      #000000 80%
    );
  }
  .doodad-1 {
    filter: drop-shadow(0px 0px 5px @color) drop-shadow(0px 0px 10px @color)
      drop-shadow(0px 0px 2px @color);
  }
  .doodad-1::after {
    background-color: @color;
  }
}
&.alertLevel-5 {
  .card-switcher-colors(@alert5);
  .frame-colors(@alert5);
}
&.alertLevel-4 {
  .card-switcher-colors(@alert4);
  .frame-colors(@alert4);
}
&.alertLevel-3 {
  .card-switcher-colors(@alert3);
  .frame-colors(@alert3);
}
&.alertLevel-2 {
  .card-switcher-colors(@alert2);
  .frame-colors(@alert2);
}
&.alertLevel-1 {
  .card-switcher-colors(@alert1);
  .frame-colors(@alert1);
}
&.alertLevel-p {
  .card-switcher-colors(@alertp);
  .frame-colors(@alertp);
}

// Card Transitions
.card-transition-enter {
  transition: opacity 0.2s ease 0.2s, transform 0.2s ease 0.2s;
}
.card-transition-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}
.card-transition-enter-to {
  opacity: 1;
  transform: translateX(0);
}
.card-transition-leave {
  transition: opacity 1s ease, transform 1s ease;
}
.card-transition-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.card-transition-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
// Buttons
.button-variant(@incomingBackground) {
  @background: lighten(desaturate(@incomingBackground, 20%), 10%);
  background: rgba(@background, 0.3);
  background-color: transparent;
  border: solid 1px @background;
  color: white;
  text-shadow: 0px 0px 5px rgba(0, 0, 0, 1);
  box-shadow: inset 0px 0px 20px -5px rgba(saturate(@background, 10%), 0.5),
    0px 0px 15px -2px rgba(saturate(@background, 10%), 1);
  &:hover:not([disabled]) {
    color: white;
    background: rgba(@background, 0.5);
    box-shadow: inset 0px 0px 20px 0px rgba(saturate(@background, 10%), 1),
      0px 0px 10px -2px rgba(saturate(@background, 10%), 1);
  }
  &:focus {
    color: white;
    box-shadow: inset 0px 0px 20px 0px rgba(saturate(@background, 10%), 1),
      0px 0px 10px -2px rgba(saturate(@background, 10%), 1);
  }
  &:active,
  &.active {
    color: white;
    background: rgba(@background, 0.3);
    box-shadow: inset 0px 0px 20px 0px
        rgba(darken(saturate(@background, 10%), 20%), 1),
      0px 0px 10px -2px rgba(saturate(@background, 10%), 1);
  }
}
.button {
  color: white;
  font-weight: 600;
  font-family: "Saira", sans-serif;
  font-size: 16px;
  padding: 3px 10px;
  border-radius: 5px;
  transition: all 0.1s ease;
  &.default {
    .button-variant(desaturate(@alert5, 100%));
  }
  &.primary {
    .button-variant(@alert5);
  }
  &.secondary {
    .button-variant(@alert2);
  }
  &.success {
    .button-variant(#198019);
  }
  &.info {
    .button-variant(#198080);
  }
  &.warning {
    .button-variant(@alert2);
  }
  &.alert {
    .button-variant(@alertp);
  }
  &.danger {
    .button-variant(@alert1);
  }
  &.muted {
    .button-variant(gray);
  }
}
`;

export default defaultTheme;
