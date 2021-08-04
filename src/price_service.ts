// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const ExtensionUtils = imports.misc.extensionUtils;

import { clearInterval, setInterval } from "./helpers";
import { CoinAPI, CoinPrice, GeckoCoinAPI } from "./client";
import { SCHEMA_COIN, SCHEMA_CURRENCY } from "./constants";

class PriceService {
  private coinAPI: CoinAPI;
  private interval: number;
  private coinChangedHandler?: number;
  private settings: any;
  private updateFunc: (pricePayload: CoinPrice) => void;

  constructor(coinAPI: CoinAPI) {
    this.coinAPI = coinAPI;
    this.interval = -1;
    this.updateFunc = () => {};
    this.settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.cryptopricetracker"
    );
  }

  start(updateFunc: (pricePayload: CoinPrice) => void) {
    this.updateFunc = updateFunc;

    this.coinChangedHandler = this.settings.connect(
      "changed::coin",
      this.reset.bind(this)
    );

    this.update();
    this.interval = setInterval(this.update.bind(this), 10000);
  }

  async update() {
    const coin = this.settings.get_string(SCHEMA_COIN);
    const currency = this.settings.get_string(SCHEMA_CURRENCY);

    const pricePayload = await this.coinAPI.getCoinPrice(coin, currency);
    this.updateFunc(pricePayload);
  }

  async reset() {
    this.stop();
    this.start(this.updateFunc);
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
