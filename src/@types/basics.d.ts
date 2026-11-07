declare module "*.css";

declare module "*.svg?component" {
  import type { FunctionComponent, SVGProps } from "react";
  const Component: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default Component;
}

declare module "*.svg" {
  const url: string;
  export default url;
}

declare module "*.jpg" {
  const url: string;
  export default url;
}

declare module "*.png" {
  const url: string;
  export default url;
}

declare module "*.gif" {
  const url: string;
  export default url;
}

declare module "*.webp" {
  const url: string;
  export default url;
}
