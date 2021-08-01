// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();
import { coins } from "./coins";

const { Soup } = imports.gi;

export interface Session {
  request_http(method: string, uri_string: string): any;
  queue_message(message: any, callback: (sess: any, mess: any) => void): any;
}

export interface Coin {
  id: string;
  name: string;
}

export interface CoinPrice {
  [coinID: string]: {
    [currency: string]: number;
  };
}

export type RequestOptions = {
  body?: Object;
  headers?: {
    "Content-Type": "application/json";
  };
  parseJSON?: boolean;
};

class HttpClient {
  private session: Session;

  constructor() {
    this.session = new Soup.SessionAsync();
  }
  request<T>(
    method: "GET" | "POST",
    uri: string,
    options: RequestOptions = {
      parseJSON: true,
      headers: { "Content-Type": "application/json" },
    }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const soup_request = Soup.Message.new(method, uri);

      if (
        method === "POST" &&
        options.headers?.["Content-Type"] &&
        options.body
      ) {
        const stringifiedPayload = JSON.stringify(options.body);

        soup_request.set_request(
          options.headers["Content-Type"],
          Soup.MemoryUse.COPY,
          stringifiedPayload,
          stringifiedPayload.length
        );
      }

      this.session.queue_message(soup_request, (sess, mess) => {
        let result = mess.response_body.data;

        if (options.parseJSON) {
          result = JSON.parse(mess.response_body.data);
        }

        resolve(result);
      });
    });
  }
}

interface CoinAPI {
  refreshCoinList(): Promise<void>
  listSupportedCoins(): Coin[];
  isAvailable(): Promise<boolean>;
  getCoinPrice(coinID: string, currency: string): Promise<CoinPrice>;
}

export class GeckoCoinAPI implements CoinAPI {
  private baseURL = "https://api.coingecko.com/api/v3/";
  private httpClient = new HttpClient();
  private coinListCache: Coin[] = coins

  listSupportedCoins(): Coin[] {
    return this.coinListCache
  }

  async refreshCoinList(): Promise<void> {
    const url = this.computeEndpointURL("coins/list");
    const updatedCoins = await this.httpClient.request<Coin[]>("GET", url);
    this.coinListCache = updatedCoins
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.httpClient.request<Coin[]>("GET", this.computeEndpointURL("ping"));
      return true
    } catch (error) {
      return false
    }
  }

  computeEndpointURL(endpoint: string): string {
    return this.baseURL + endpoint;
  }

  async getCoinPrice(
    coinID: string | string[],
    currency: string | string[]
  ): Promise<CoinPrice> {
    const coins: string[] = !Array.isArray(coinID) ? [coinID] : coinID;
    const currencies: string[] = !Array.isArray(currency)
      ? [currency]
      : currency;

    const url = this.computeEndpointURL(
      `simple/price?ids=${coins.join(",")}&vs_currencies=${currencies.join(
        ","
      )}`
    );

    return await this.httpClient.request<CoinPrice>("GET", url);
  }
}

