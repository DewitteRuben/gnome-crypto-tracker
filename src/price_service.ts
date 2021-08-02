// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

import { clearInterval, setInterval } from "./helpers";
import type { CoinAPI, CoinPrice } from "./client";

export class PriceService {
  private coinAPI: CoinAPI;
  private updateFunc: (pricePayload: CoinPrice) => void;
  private interval: number;

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

  stop() {
    clearInterval(this.interval);
  }
}
