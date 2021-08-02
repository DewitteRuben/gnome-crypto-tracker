
// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const GLib = imports.gi.GLib;

export const setTimeout = (func: Function, millis: number): number => {
  return GLib.timeout_add(
    GLib.PRIORITY_DEFAULT,
    millis,
    () => {
      func();

      return false; // Don't repeat
    },
    null
  );
};

export const clearTimeout = (id: number) => GLib.Source.remove(id);

export const setInterval = (func: Function, millis: number): number => {
  let id = GLib.timeout_add(
    GLib.PRIORITY_DEFAULT,
    millis,
    () => {
      func();

      return true; // Repeat
    },
    null
  );

  return id;
};

export const clearInterval = (id: number) => GLib.Source.remove(id);
