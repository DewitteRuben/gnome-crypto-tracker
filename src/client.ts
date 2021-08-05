// @ts-ignore
const Me = imports.misc.extensionUtils.getCurrentExtension();

const ExtensionUtils = imports.misc.extensionUtils;

import { coins } from "./coins";
import { SCHEMA_CURRENCY } from "./constants";
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
  symbol: string;
  asset_platform_id: null;
  platforms: Platforms;
  block_time_in_minutes: number;
  hashing_algorithm: string;
  categories: string[];
  public_notice: null;
  additional_notices: any[];
  localization: { [key: string]: string };
  description: { [key: string]: string };
  links: Links;
  image: Image;
  country_origin: string;
  genesis_date: string;
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  market_cap_rank: number;
  coingecko_rank: number;
  coingecko_score: number;
  developer_score: number;
  community_score: number;
  liquidity_score: number;
  public_interest_score: number;
  market_data: MarketData;
  public_interest_stats: PublicInterestStats;
  status_updates: any[];
  last_updated: string;
}

export interface Image {
  thumb: string;
  small: string;
  large: string;
}

export interface Links {
  homepage: string[];
  blockchain_site: string[];
  official_forum_url: string[];
  chat_url: string[];
  announcement_url: string[];
  twitter_screen_name: string;
  facebook_username: string;
  bitcointalk_thread_identifier: null;
  telegram_channel_identifier: string;
  subreddit_url: string;
  repos_url: ReposURL;
}

export interface ReposURL {
  github: string[];
  bitbucket: any[];
}

export interface MarketData {
  current_price: { [key: string]: number };
  total_value_locked: null;
  mcap_to_tvl_ratio: null;
  fdv_to_tvl_ratio: null;
  roi: null;
  ath: { [key: string]: number };
  ath_change_percentage: { [key: string]: number };
  ath_date: { [key: string]: string };
  atl: { [key: string]: number };
  atl_change_percentage: { [key: string]: number };
  atl_date: { [key: string]: string };
  market_cap: { [key: string]: number };
  market_cap_rank: number;
  fully_diluted_valuation: { [key: string]: number };
  total_volume: { [key: string]: number };
  high_24h: { [key: string]: number };
  low_24h: { [key: string]: number };
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_14d: number;
  price_change_percentage_30d: number;
  price_change_percentage_60d: number;
  price_change_percentage_200d: number;
  price_change_percentage_1y: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  price_change_24h_in_currency: { [key: string]: number };
  price_change_percentage_1h_in_currency: { [key: string]: number };
  price_change_percentage_24h_in_currency: { [key: string]: number };
  price_change_percentage_7d_in_currency: { [key: string]: number };
  price_change_percentage_14d_in_currency: { [key: string]: number };
  price_change_percentage_30d_in_currency: { [key: string]: number };
  price_change_percentage_60d_in_currency: { [key: string]: number };
  price_change_percentage_200d_in_currency: { [key: string]: number };
  price_change_percentage_1y_in_currency: { [key: string]: number };
  market_cap_change_24h_in_currency: { [key: string]: number };
  market_cap_change_percentage_24h_in_currency: { [key: string]: number };
  total_supply: number;
  max_supply: number;
  circulating_supply: number;
  last_updated: string;
}

export interface Platforms {
  "": string;
}

export interface PublicInterestStats {
  alexa_rank: number;
  bing_matches: null;
}

export interface CoinMarketData extends Coin {
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
  getCoinDetail(coinID: string): Promise<CoinDetail>;
  getCoinMarketData(
    coinID: string,
    currency: string
  ): Promise<CoinMarketData | CoinMarketData[]>;
  getCoinPrice(coinID: string, currency: string): Promise<CoinPrice>;
  searchCoin(query: string): Promise<CoinMarketData[]>;
  listSupportedCurrencies(): Promise<string[]>;
  listSupportedCoins(): Coin[];
  isAvailable(): Promise<boolean>;
}

export class GeckoCoinAPI implements CoinAPI {
  private baseURL = "https://api.coingecko.com/api/v3/";
  public httpClient = new HttpClient();
  private coinListCache: Coin[] = coins;
  private settings: any;

  constructor() {
    this.settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.cryptopricetracker"
    );
  }

  async getCoinDetail(coinID: string): Promise<CoinDetail> {
    const url = this.computeEndpointURL(
      `coins/${coinID}?tickers=false&community_data=false&developer_data=false&sparkline=false&localization=false`
    );

    return await this.httpClient.request<CoinDetail>(url);
  }

  listSupportedCoins(): Coin[] {
    return this.coinListCache;
  }

  async refreshCoinList(): Promise<void> {
    const url = this.computeEndpointURL("coins/list");
    const updatedCoins = await this.httpClient.request<Coin[]>(url);
    this.coinListCache = updatedCoins;
  }

  async searchCoin(query: string): Promise<CoinMarketData[]> {
    const searcher = new FuzzySearch(
      this.listSupportedCoins(),
      ["id", "name"],
      { sort: true }
    );

    const filteredCoins: Coin[] = searcher.search(query).slice(0, 100);
    const coinIDs = filteredCoins.map(({ id }) => id);

    const currency = this.settings.get_string(SCHEMA_CURRENCY);
    const coinDetails = await this.getCoinMarketData(coinIDs, currency);

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

  async getCoinMarketData(
    coinID: string | string[],
    currency: string
  ): Promise<CoinMarketData | CoinMarketData[]> {
    const coins: string[] = !Array.isArray(coinID) ? [coinID] : coinID;

    const url = this.computeEndpointURL(
      `coins/markets?vs_currency=${currency}&ids=${coins.join(
        ","
      )}&order=market_cap_desc&per_page=250&page=1&sparkline=false`
    );

    const coinDetailArr = await this.httpClient.request<CoinMarketData[]>(url);

    if (coinDetailArr.length == 1) {
      return coinDetailArr[0];
    }

    return coinDetailArr;
  }
}
