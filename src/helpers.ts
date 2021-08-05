// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const GLib = imports.gi.GLib;

export function setTimeout(func: Function, millis: number): number {
  const timeout = () => {
    func();
    return GLib.SOURCE_REMOVE; // Don't repeat
  };

  return GLib.timeout_add(GLib.PRIORITY_DEFAULT, millis, timeout);
}

export const clearTimeout = (id: number) => GLib.Source.remove(id);

export function setInterval(func: Function, millis: number): number {
  const interval = () => {
    func();
    return GLib.SOURCE_CONTINUE; // Repeat
  };

  return GLib.timeout_add(GLib.PRIORITY_DEFAULT, millis, interval);
}

export function debounce(func: Function, wait: number) {
  let sourceId: number | null;
  return function (this: any, ...args: any) {
    const debouncedFunc = () => {
      sourceId = null;
      func.apply(this, args);
    };

    // It is a programmer error to attempt to remove a non-existent source
    if (sourceId) GLib.Source.remove(sourceId);
    sourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, wait, debouncedFunc);
  };
}

export const clearInterval = (id: number) => GLib.Source.remove(id);
