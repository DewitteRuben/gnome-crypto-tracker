// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import { debounce } from "./helpers";
import { priceService } from "./price_service";

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const { GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;

let coinSearchBar: any;
let coinSearchBarListStore: any;
let coinCombobox: any;

function createCoinListStore() {
  coinSearchBarListStore = new Gtk.ListStore();
  coinSearchBarListStore.set_column_types([
    GObject.TYPE_STRING,
    GObject.TYPE_STRING,
  ]);

  return coinSearchBarListStore;
}

function createCombobox() {
  coinCombobox = new Gtk.ComboBox({
    model: coinSearchBarListStore,
    visible: true,
    halign: Gtk.Align.START,
  });

  const renderer = new Gtk.CellRendererText();
  coinCombobox.pack_start(renderer, true);
  coinCombobox.add_attribute(renderer, "text", 1);

  coinCombobox.set_active(0); // set value

  coinCombobox.connect("changed", function (entry: any) {
    const [success, iter] = coinCombobox.get_active_iter();
    if (!success) return;
    const myValue = coinSearchBarListStore.get_value(iter, 0); // get value
    log(myValue);
  });

  return coinCombobox;
}

//@ts-ignore
function init() {
  coinSearchBar = createSearchbar();
  coinSearchBarListStore = createCoinListStore();
  coinCombobox = createCombobox();
}

function createSearchbar() {
  let searchEntry: any;

  searchEntry = new Gtk.SearchEntry();
  searchEntry.show();

 priceService.api.searchCoin(
    'bitcoin'
  );

  const debouncedSearch = debounce(async () => {
    const coinDetailList = await priceService.api.searchCoin(
      searchEntry.get_text()
    );

    log(JSON.stringify(coinDetailList))

    coinSearchBarListStore.clear();
    coinDetailList.forEach((coin) => {
      coinSearchBarListStore.set(
        coinSearchBarListStore.append(),
        [0, 1],
        [coin.id, coin.name]
      );
    });
  }, 1000);

  searchEntry.connect("search-changed", debouncedSearch);

  return searchEntry;
}

//@ts-ignore
function buildPrefsWidget(this: any) {
  this.settings = ExtensionUtils.getSettings(
    "org.gnome.shell.extensions.cryptopricetracker"
  );

  // Create a parent widget that we'll return from this function
  const prefsWidget = new Gtk.Grid({
    margin: 18,
    column_spacing: 12,
    row_spacing: 12,
    visible: true,
  });

  // Add a simple title and add it to the prefsWidget
  const title = new Gtk.Label({
    label: `<b>${Me.metadata.name} Preferences</b>`,
    halign: Gtk.Align.START,
    use_markup: true,
    visible: true,
  });
  prefsWidget.attach(title, 0, 0, 2, 1);

  prefsWidget.attach(coinSearchBar, 0, 1, 1, 1);
  prefsWidget.attach(coinCombobox, 1, 1, 1, 1);

  // Create a label & switch for `show-indicator`
  const toggleLabel = new Gtk.Label({
    label: "Show Extension Indicator:",
    halign: Gtk.Align.START,
    visible: true,
  });
  prefsWidget.attach(toggleLabel, 0, 2, 1, 1);

  const toggle = new Gtk.Switch({
    active: this.settings.get_boolean("show-indicator"),
    halign: Gtk.Align.END,
    visible: true,
  });
  prefsWidget.attach(toggle, 1, 2, 1, 1);

  // Bind the switch to the `show-indicator` key
  this.settings.bind(
    "show-indicator",
    toggle,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );

  // Return our widget which will be added to the window
  return prefsWidget;
}
