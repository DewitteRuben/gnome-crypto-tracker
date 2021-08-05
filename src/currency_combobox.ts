// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import { SCHEMA_CURRENCY } from "./constants";
import { getPriceService } from "./price_service";

const ExtensionUtils = imports.misc.extensionUtils;

const Gtk = imports.gi.Gtk;
const { GObject } = imports.gi;

export class CurrencyComboBox {
  private listStore: any;
  private combobox: any;
  private currencies: string[] = [];
  private settings: any;

  constructor() {
    this.settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.cryptopricetracker"
    );

    this.listStore = new Gtk.ListStore();
    this.listStore.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING]);

    this.combobox = new Gtk.ComboBox({
      model: this.listStore,
      visible: true,
      halign: Gtk.Align.START,
    });

    this.combobox.connect("changed", () => {
      let [success, iter] = this.combobox.get_active_iter();
      if (!success) return;

      const currencyKey = this.listStore.get_value(iter, 0);

      this.settings.set_string(SCHEMA_CURRENCY, currencyKey);
    });

    const textRenderer = new Gtk.CellRendererText();
    this.combobox.pack_start(textRenderer, false);
    this.combobox.add_attribute(textRenderer, "text", 1);
  }

  getWidget() {
    return this.combobox;
  }

  async populate() {
    this.currencies = await getPriceService().api.listSupportedCurrencies();

    this.currencies
      .sort()
      .forEach((cur) =>
        this.listStore.set(
          this.listStore.append(),
          [0, 1],
          [cur, cur.toUpperCase()]
        )
      );

    const currentCurrency = this.settings.get_string(SCHEMA_CURRENCY);
    this.combobox.set_active(this.currencies.findIndex((cur) => cur === currentCurrency));
  }
}
