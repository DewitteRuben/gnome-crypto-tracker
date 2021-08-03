// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import { clearInterval, setInterval } from "./helpers";
import { CoinAPI, CoinPrice, GeckoCoinAPI } from "./client";

class PriceService {
  private coinAPI: CoinAPI;
  private interval: number;
  private updateFunc: (pricePayload: CoinPrice) => void;

  constructor(coinAPI: CoinAPI) {
    this.coinAPI = coinAPI;
    this.interval = -1;
    this.updateFunc = () => {};
  }

  start(updateFunc: (pricePayload: CoinPrice) => void) {
    this.updateFunc = updateFunc;

    this.update()
    this.interval = setInterval(this.update.bind(this), 10000);
  }

  async update() {
    const pricePayload = await this.coinAPI.getCoinPrice("bitcoin", "eur");
    this.updateFunc(pricePayload);
  }

  get api() {
    return this.coinAPI
  }

  stop() {
    clearInterval(this.interval);
  }
}

export const priceService = new PriceService(new GeckoCoinAPI())