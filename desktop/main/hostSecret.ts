import uniqid from "shared/uniqid";

// A secret code used to authenticate the user connecting to this server
// from their own Electron instance.
export const hostSecret = uniqid("host-");
