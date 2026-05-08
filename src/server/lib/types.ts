export interface Source {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  faviconUrl: string;
}

export interface SearchResult {
  query: string;
  sources: Source[];
}
