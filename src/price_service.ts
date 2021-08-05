// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const ExtensionUtils = imports.misc.extensionUtils;
const Gio = imports.gi.Gio;

import { clearInterval, setInterval } from "./helpers";
import { CoinAPI, GeckoCoinAPI } from "./client";
import {
  SCHEMA_COIN,
  SCHEMA_COIN_ICON_URL,
  SCHEMA_CURRENCY,
} from "./constants";

class PriceService {
  private coinAPI: CoinAPI;
  private interval: number;
  private coinChangedHandler?: number;
  private settings: any;
  private trayButton: any;
  private coin: string;
  private currency: string;
  private coinIconURL: string;

  constructor(coinAPI: CoinAPI) {
    this.coinAPI = coinAPI;
    this.interval = -1;
    this.coin = "bitcoin";
    this.currency = "eur";
    this.coinIconURL = "";
    this.settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.cryptopricetracker"
    );
  }

  async start() {
    this.coinChangedHandler = this.settings.connect(
      "changed::coin",
      this.reset.bind(this)
    );

    this.coin = this.settings.get_string(SCHEMA_COIN);
    this.currency = this.settings.get_string(SCHEMA_CURRENCY);
    this.coinIconURL = this.settings.get_string(SCHEMA_COIN_ICON_URL);
    this.trayButton.icon.set_gicon(Gio.icon_new_for_string(this.coinIconURL));

    this.update();
    this.interval = setInterval(this.update.bind(this), 10000);
  }

  async update() {
    const pricePayload = await this.coinAPI.getCoinPrice(
      this.coin,
      this.currency
    );

    this.trayButton.label.set_text(
      `${pricePayload[this.coin][this.currency]} ${this.currency.toUpperCase()}`
    );
  }

  setTrayButton(trayButton: any) {
    this.trayButton = trayButton;
  }

  async reset(changed: any) {
    log(JSON.stringify(changed));
    this.stop();
    this.start();
  }

  get api() {
    return this.coinAPI;
  }

  stop() {
    this.settings.disconnect(this.coinChangedHandler);
    clearInterval(this.interval);
  }
}

let priceService: PriceService;

export function getPriceService() {
  if (!priceService) {
    priceService = new PriceService(new GeckoCoinAPI());
  }

  return priceService;
}
