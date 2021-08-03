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

export function debounce(this: any, func: Function, timeout = 300) {
  let timer: number | undefined;
  return (...args: any) => {
    if (!timer) {
      func.apply(this, args);
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
    }, timeout);
  };
}


export const clearInterval = (id: number) => GLib.Source.remove(id);
