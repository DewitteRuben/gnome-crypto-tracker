// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

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

export function runCommandAsync(command: string) {
  return new Promise((resolve, reject) => {
    const proc = Gio.Subprocess.new(
      [`ls`, '/'],
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
    );

    proc.communicate_utf8_async(null, null, (proc: any, res: any) => {
      try {
        const [, stdout, stderr] = proc.communicate_utf8_finish(res);

        if (proc.get_successful()) {
          resolve(stdout);
        } else {
          throw new Error(stderr);
        }
      } catch (e) {
        reject(e);
      }
    });
  });
}

export const clearInterval = (id: number) => GLib.Source.remove(id);
