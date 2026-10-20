/** Plain data shapes shared by pages and islands (no `astro:content` import). */

export interface Group {
  id: string;
  label: string;
}

export interface Module {
  id: string;
  name: string;
  url: string;
  /** What the module offers for templates; supports `inline code`. */
  description: string;
}

export interface HelperFilter {
  name: string;
  module: string;
  description: string;
}
