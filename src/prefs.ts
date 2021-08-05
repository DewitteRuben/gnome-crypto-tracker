// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import {
  SCHEMA_COIN,
  SCHEMA_COIN_ICON_URL,
  SCHEMA_PRICE_CHANGE_RANGE,
} from "./constants";
import { CurrencyComboBox } from "./currency_combobox";
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

const downloadImageIfNotExists = async (path: string) => {
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
};

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
          const imageURL = coin.image.replace("large", "small");
          const pixbuf = await downloadImageIfNotExists(imageURL);

          coinSearchBarListStore.set(
            coinSearchBarListStore.append(),
            [0, 1, 2, 3],
            [coin.id, coin.name, pixbuf, imageURL]
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

  const coin = coinSearchBarListStore.get_value(iter, 0);
  const coinImageURL = coinSearchBarListStore.get_value(iter, 3);

  settings.set_string(SCHEMA_COIN_ICON_URL, coinImageURL);
  settings.set_string(SCHEMA_COIN, coin);

  currentlyTrackingLabel.set_text(
    `Currently Tracking: ${settings.get_string(SCHEMA_COIN)}`
  );
}

const setPriceChangeIndicatorTimeRange = (type: string) => (btn: any) => {
  if (btn.get_active()) {
    settings.set_string(SCHEMA_PRICE_CHANGE_RANGE, type);
  }
};

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
    halign: Gtk.Align.START,
  });

  button.connect("clicked", setCoin);

  prefsWidget.attach(coinSearchBar, 0, 1, 1, 1);
  prefsWidget.attach(coinCombobox, 1, 1, 1, 1);
  prefsWidget.attach(button, 2, 1, 1, 1);

  currentlyTrackingLabel = new Gtk.Label({
    label: `Currently Tracking: ${settings.get_string("coin")}`,
    halign: Gtk.Align.START,
    visible: true,
  });
  prefsWidget.attach(currentlyTrackingLabel, 0, 2, 1, 1);

  const currencyLabel = new Gtk.Label({
    label: `<b>Choose a currency:</b>`,
    halign: Gtk.Align.START,
    use_markup: true,

    visible: true,
  });

  prefsWidget.attach(currencyLabel, 0, 3, 1, 1);

  const currencyComboBox = new CurrencyComboBox();
  currencyComboBox.populate();

  prefsWidget.attach(currencyComboBox.getWidget(), 1, 3, 1, 1);

  currentlyTrackingLabel = new Gtk.Label({
    label: `<b>Select the time range of the price change indicator:</b>`,
    use_markup: true,
    visible: true,
  });
  prefsWidget.attach(currentlyTrackingLabel, 0, 4, 1, 1);

  this.radioButton1h = new Gtk.RadioButton({ visible: true, label: "1h" });
  this.radioButton24h = new Gtk.RadioButton({
    label: "24h",
    visible: true,
    group: this.radioButton1h,
  });
  this.radioButton7d = new Gtk.RadioButton({
    label: "7d",
    visible: true,
    group: this.radioButton1h,
  });
  this.radioButton14d = new Gtk.RadioButton({
    label: "14d",
    visible: true,
    group: this.radioButton1h,
  });

  const priceChangeRange = settings.get_string(SCHEMA_PRICE_CHANGE_RANGE);
  this[`radioButton${priceChangeRange}`].set_active(true);

  this.radioButton1h.connect("toggled", setPriceChangeIndicatorTimeRange("1h"));
  this.radioButton24h.connect(
    "toggled",
    setPriceChangeIndicatorTimeRange("24h")
  );

  this.radioButton7d.connect("toggled", setPriceChangeIndicatorTimeRange("7d"));
  this.radioButton14d.connect(
    "toggled",
    setPriceChangeIndicatorTimeRange("14d")
  );

  prefsWidget.attach(this.radioButton1h, 0, 5, 1, 1);
  prefsWidget.attach(this.radioButton24h, 1, 5, 1, 1);
  prefsWidget.attach(this.radioButton7d, 2, 5, 1, 1);
  prefsWidget.attach(this.radioButton14d, 3, 5, 1, 1);

  return prefsWidget;
}
