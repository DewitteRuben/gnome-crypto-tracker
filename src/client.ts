// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();
import { coins } from "./coins";
import { FuzzySearch } from "./search_utils";

const { Soup } = imports.gi;

export interface Session {
  request_http(method: string, uri_string: string): any;
  queue_message(message: any, callback: (sess: any, mess: any) => void): any;
}

export interface Coin {
  id: string;
  name: string;
}

export interface CoinDetail extends Coin {
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  last_updated: string;
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
  method?: "GET" | "POST";
  bufferResult?: boolean;
  parseJSON?: boolean;
};

class HttpClient {
  private session: Session;

  constructor() {
    this.session = new Soup.SessionAsync();
  }
  request<T>(
    url: string,
    options: RequestOptions = {
      method: "GET",
      parseJSON: true,
      headers: { "Content-Type": "application/json" },
    }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const soup_request = Soup.Message.new_from_uri(
        options.method,
        new Soup.URI(url)
      );

      if (
        options.method === "POST" &&
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
        let result;

        if (options.bufferResult) {
          return resolve(mess.response_body.flatten().get_as_bytes());
        }

        if (options.parseJSON) {
          result = JSON.parse(mess.response_body.data);
        }

        return resolve(result);
      });
    });
  }
}

export interface CoinAPI {
  httpClient: HttpClient;
  refreshCoinList(): Promise<void>;
  getCoinDetails(
    coinID: string,
    currency: string
  ): Promise<CoinDetail | CoinDetail[]>;
  getCoinPrice(coinID: string, currency: string): Promise<CoinPrice>;
  searchCoin(query: string): Promise<CoinDetail[]>;
  listSupportedCurrencies(): Promise<string[]>;
  listSupportedCoins(): Coin[];
  isAvailable(): Promise<boolean>;
}

export class GeckoCoinAPI implements CoinAPI {
  private baseURL = "https://api.coingecko.com/api/v3/";
  public httpClient = new HttpClient();
  private coinListCache: Coin[] = coins;

  listSupportedCoins(): Coin[] {
    return this.coinListCache;
  }

  async refreshCoinList(): Promise<void> {
    const url = this.computeEndpointURL("coins/list");
    const updatedCoins = await this.httpClient.request<Coin[]>(url);
    this.coinListCache = updatedCoins;
  }

  async searchCoin(query: string): Promise<CoinDetail[]> {
    const searcher = new FuzzySearch(
      this.listSupportedCoins(),
      ["id", "name"],
      { sort: true }
    );

    const filteredCoins: Coin[] = searcher.search(query).slice(0, 100);
    const coinIDs = filteredCoins.map(({ id }) => id);

    // TODO: replace with saved currency
    const coinDetails = await this.getCoinDetails(coinIDs, "eur");

    if (Array.isArray(coinDetails)) {
      return coinDetails;
    }

    return [coinDetails];
  }

  // TODO: check status code instead
  async isAvailable(): Promise<boolean> {
    try {
      await this.httpClient.request<Coin[]>(this.computeEndpointURL("ping"));
      return true;
    } catch (error) {
      return false;
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

    return await this.httpClient.request<CoinPrice>(url);
  }

  async listSupportedCurrencies(): Promise<string[]> {
    return await this.httpClient.request<string[]>(
      this.computeEndpointURL("simple/supported_vs_currencies")
    );
  }

  async getCoinDetails(
    coinID: string | string[],
    currency: string
  ): Promise<CoinDetail | CoinDetail[]> {
    const coins: string[] = !Array.isArray(coinID) ? [coinID] : coinID;

    const url = this.computeEndpointURL(
      `coins/markets?vs_currency=${currency}&ids=${coins.join(
        ","
      )}&order=market_cap_desc&per_page=250&page=1&sparkline=false`
    );

    const coinDetailArr = await this.httpClient.request<CoinDetail[]>(url);

    if (coinDetailArr.length == 1) {
      return coinDetailArr[0];
    }

    return coinDetailArr;
  }
}
