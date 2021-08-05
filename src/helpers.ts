// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import { CoinDetail } from "./client";
import { getPriceService } from "./price_service";

const Gio = imports.gi.Gio;
const GdkPixbuf = imports.gi.GdkPixbuf;

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

export async function downloadImageIfNotExists(path: string) {
  const fileName = path.split("/").splice(-1)[0].split("?")[0];
  const filePath = `${Me.path}/icons/${fileName}`;

  if (!GLib.file_test(filePath, GLib.FileTest.EXISTS)) {
    const bytes = await getPriceService().api.httpClient.request<Uint8Array>(
      path,
      {
        bufferResult: true,
        method: "GET",
      }
    );

    const file = Gio.File.new_for_path(filePath);
    const outstream = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
    outstream.write_bytes(bytes, null);
  }

  let pixbuf = GdkPixbuf.Pixbuf.new_from_file(filePath);

  return pixbuf.scale_simple(32, 32, GdkPixbuf.InterpType.BILINEAR);
}

export async function getCoinIcon(coinID: string, currency: string) {
  const coinDetails = (await getPriceService().api.getCoinDetails(
    coinID,
    currency
  )) as CoinDetail;

  return downloadImageIfNotExists(coinDetails.image);
}

export const clearInterval = (id: number) => GLib.Source.remove(id);
