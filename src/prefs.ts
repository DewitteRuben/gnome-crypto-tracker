// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import { SCHEMA_COIN } from "./constants";
import { debounce } from "./helpers";
import { getPriceService } from "./price_service";

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GdkPixbuf = imports.gi.GdkPixbuf;
//@ts-ignore
const { GObject, GLib } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;

let coinSearchBar: any;
let coinSearchBarListStore: any;
let coinCombobox: any;
let settings: any;
let currentlyTrackingLabel: any;

function createCoinListStore() {
  coinSearchBarListStore = new Gtk.ListStore();
  coinSearchBarListStore.set_column_types([
    GObject.TYPE_STRING,
    GObject.TYPE_STRING,
    GdkPixbuf.Pixbuf,
  ]);

  return coinSearchBarListStore;
}

function createCombobox() {
  coinCombobox = new Gtk.ComboBox({
    model: coinSearchBarListStore,
    visible: true,
    halign: Gtk.Align.START,
  });

  const textRenderer = new Gtk.CellRendererText();
  const pixbufRenderer = new Gtk.CellRendererPixbuf();
  coinCombobox.pack_start(textRenderer, false);
  coinCombobox.pack_start(pixbufRenderer, true);
  coinCombobox.add_attribute(textRenderer, "text", 1);
  coinCombobox.add_attribute(pixbufRenderer, "pixbuf", 2);

  return coinCombobox;
}

//@ts-ignore
function init() {
  coinSearchBar = createSearchbar();
  coinSearchBarListStore = createCoinListStore();
  coinCombobox = createCombobox();
  settings = ExtensionUtils.getSettings(
    "org.gnome.shell.extensions.cryptopricetracker"
  );
}

async function downloadImageIfNotExists(path: string) {
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

function createSearchbar() {
  let searchEntry: any;

  searchEntry = new Gtk.SearchEntry();
  searchEntry.show();

  searchEntry.connect(
    "search-changed",
    debounce(async () => {
      try {
        const coinDetailList = await getPriceService().api.searchCoin(
          searchEntry.get_text()
        );

        coinSearchBarListStore.clear();
        const coinPromises = coinDetailList.map((coin) => async () => {
          const pixbuf = await downloadImageIfNotExists(coin.image);

          coinSearchBarListStore.set(
            coinSearchBarListStore.append(),
            [0, 1, 2],
            [coin.id, coin.name, pixbuf]
          );
        });

        await Promise.all(coinPromises.map((p) => p()));

        coinCombobox.set_active(0);
      } catch (error) {
        log(error);
      }
    }, 1000)
  );

  return searchEntry;
}

function setCoin() {
  const [success, iter] = coinCombobox.get_active_iter();
  if (!success) return;

  const coin = coinSearchBarListStore.get_value(iter, 0); // get value
  settings.set_string(SCHEMA_COIN, coin);

  currentlyTrackingLabel.set_text(
    `Currently Tracking: ${settings.get_string(SCHEMA_COIN)}`
  );
}

//@ts-ignore
function buildPrefsWidget(this: any) {
  // Create a parent widget that we'll return from this function
  const prefsWidget = new Gtk.Grid({
    margin: 18,
    column_spacing: 12,
    row_spacing: 12,
    visible: true,
  });

  // Add a simple title and add it to the prefsWidget
  const title = new Gtk.Label({
    label: `<b>Search and select the coin you wish to track:</b>`,
    halign: Gtk.Align.START,
    use_markup: true,
    visible: true,
  });
  prefsWidget.attach(title, 0, 0, 2, 1);

  const button = new Gtk.Button({
    label: "Save",
    visible: true,
    valign: Gtk.Align.START,
  });

  button.connect("clicked", setCoin);

  prefsWidget.attach(coinSearchBar, 0, 1, 1, 1);
  prefsWidget.attach(coinCombobox, 1, 1, 1, 1);
  prefsWidget.attach(button, 2, 1, 1, 1);

  // Create a label & switch for `show-indicator`
  currentlyTrackingLabel = new Gtk.Label({
    label: `Currently Tracking: ${settings.get_string("coin")}`,
    halign: Gtk.Align.START,
    visible: true,
  });
  prefsWidget.attach(currentlyTrackingLabel, 0, 2, 1, 1);

  // Create a label & switch for `show-indicator`
  const toggleLabel = new Gtk.Label({
    label: "Show Extension Indicator:",
    halign: Gtk.Align.START,
    visible: true,
  });
  prefsWidget.attach(toggleLabel, 0, 3, 1, 1);

  const toggle = new Gtk.Switch({
    active: settings.get_boolean("show-indicator"),
    halign: Gtk.Align.END,
    visible: true,
  });
  prefsWidget.attach(toggle, 1, 3, 1, 1);

  // Bind the switch to the `show-indicator` key
  settings.bind(
    "show-indicator",
    toggle,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );

  // Return our widget which will be added to the window
  return prefsWidget;
}
