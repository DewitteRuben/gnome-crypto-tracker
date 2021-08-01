declare function print(...args: any[]): void;
declare function printerr(...args: any[]): void;
declare function log(message?: string): void;
declare function logError(exception: any, message?: string): void;
declare const ARGV: string[];
declare const imports: {
  [key: string]: any;
  searchPath: string[];
};

