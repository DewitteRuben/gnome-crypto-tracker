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
  SCHEMA_PRICE_CHANGE_RANGE,
} from "./constants";

class PriceService {
  private coinAPI: CoinAPI;
  private interval: number;
  private coinChangedHandler?: number;
  private currencyChangedHandler?: number;
  private priceChangeRangeChangedHandler?: number;
  private settings: any;
  private trayButton: any;
  private coin: string;
  private currency: string;
  private coinIconURL: string;
  private priceChangeRange: string;

  constructor(coinAPI: CoinAPI) {
    this.coinAPI = coinAPI;
    this.interval = -1;
    this.coin = "bitcoin";
    this.currency = "eur";
    this.priceChangeRange = "24h";
    this.coinIconURL =
      "https://assets.coingecko.com/coins/images/1/small/bitcoin.png";

    this.settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.cryptopricetracker"
    );
  }

  async start() {
    this.coinChangedHandler = this.settings.connect(
      "changed::coin",
      this.reset.bind(this)
    );

    this.currencyChangedHandler = this.settings.connect(
      "changed::currency",
      this.reset.bind(this)
    );

    this.priceChangeRangeChangedHandler = this.settings.connect(
      "changed::price-change-range",
      this.reset.bind(this)
    );

    this.coin = this.settings.get_string(SCHEMA_COIN);
    this.currency = this.settings.get_string(SCHEMA_CURRENCY);
    this.coinIconURL = this.settings.get_string(SCHEMA_COIN_ICON_URL);
    this.priceChangeRange = this.settings.get_string(SCHEMA_PRICE_CHANGE_RANGE);
    this.trayButton.icon.set_gicon(Gio.icon_new_for_string(this.coinIconURL));

    this.update();
    this.interval = setInterval(this.update.bind(this), 300000);
  }

  async update() {
    const detailPayload = await this.coinAPI.getCoinDetail(this.coin);
    const { market_data } = detailPayload as any;
    const price = market_data.current_price[this.currency];
    const priceChangeProperty = `price_change_percentage_${this.priceChangeRange}_in_currency`;
    const priceChange = market_data[priceChangeProperty][this.currency];

    this.trayButton.priceLabel.set_text(
      `${new Intl.NumberFormat(undefined, {
        currency: this.currency,
        ...(price < 1 && { minimumFractionDigits: 5 }),
        style: "currency",
      }).format(price)}`
    );

    const increase = priceChange > 0;
    const style = increase ? "green" : "red";

    const prefix = increase ? "+" : "";
    const percentage = priceChange.toFixed(2) + "%";
    this.trayButton.priceChangeLabel.set_text(prefix + percentage);
    this.trayButton.timeRange.set_text(this.priceChangeRange)
    this.trayButton.priceChangeLabel.set_style(`color: ${style}`);
  }

  setTrayButton(trayButton: any) {
    this.trayButton = trayButton;
  }

  async reset() {
    this.stop();
    this.start();
  }

  get api() {
    return this.coinAPI;
  }

  stop() {
    this.settings.disconnect(this.coinChangedHandler);
    this.settings.disconnect(this.currencyChangedHandler);
    this.settings.disconnect(this.priceChangeRangeChangedHandler);

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
