import { FeatureCollection, Geometry, GeometryCollection, Properties } from "@turf/turf";

interface RequestOptions {
    endpoint: string;
    params?: Record<string, any>;
    request_body?: Record<string, any>;
    method?: string;
    max_retries?: number;
    base_url?: string;
    headers?: Object
}

interface TreemapResponse {
    type: "object" | "list" | string;
    data: FeatureCollection<Geometry | GeometryCollection, Properties> | Array<any>;
}

export class Client {
    version: string;
    requestOptions?: Partial<RequestOptions>;

    constructor (
        options?: any
    ) {
        this.version = "0.1.0";
        this.requestOptions = {
            ...options,
            headers: {
              "User-Agent": "treemap-api-typescript/" + this.version,
              ...options?.headers,
            },
        };
    }

    public readonly userphotos = {
        /**
        * List user photos as GeoJSON features
        *
        * Returns a Feature Collection of GeoJSON point features with properties
        * containing the Public ID of the associated photo.
        */
        getUserPhotos: (
            request_options?: Partial<RequestOptions>
        ): Promise<TreemapResponse> =>
        rest<TreemapResponse>({
            ...this.requestOptions,
            ...request_options,
            endpoint: `/photos/user-photos`,
            method: "GET",
        }),

        /**
         * POST a new photo along with a GeoJSON Point Feature describing the
         * location
         *
         * Returns a single GeoJSON Point feature with updated properties
         * to point the user to the newly created resource.
         */
        postUserPhoto: (
            request_options?: Partial<RequestOptions>
        ): Promise<TreemapResponse> =>
        rest<TreemapResponse>({
            ...this.requestOptions,
            ...request_options,
            endpoint: `/photos/user-photos`,
            method: "POST",
        }),
    }
}

export async function rest<T = Record<string, any>>(
    args: RequestOptions
  ): Promise<T> {
    const response = await request(args);
    return response.json();
  }

async function request({
    endpoint,
    params: query = {},
    request_body,
    method,
    max_retries,
    base_url = "http://127.0.0.1:8000",
    headers,
    ...options
  }: RequestOptions): Promise<Response> {
    const url = new URL(base_url + endpoint);
    const includeBody = (method === "POST" || method === "PUT") && !!request_body;
    const isFormData = includeBody && request_body instanceof FormData;
    let body: string | FormData | undefined;

    if (includeBody && isFormData) {
        body = request_body;
    } else if (includeBody) {
        body = JSON.stringify(request_body);
    } else {
        body = undefined;
    }

    const response = await fetchWithRetries(
      url.toString(),
      {
        headers: {
          ...((includeBody && !isFormData)
            ? { "Content-Type": "application/json; charset=utf-8" }
            : undefined),
          ...headers,
        },
        method,
        body: body,
        timeout: 15000, // timeout if no data in 15 seconds
        ...options,
      },
      max_retries
    );
    if (!response.ok) {
      const error = await response.json();
      throw new TreemapResponseError(
        response.status,
        response.statusText,
        response.headers,
        error
      );
    }
    return response;
  }

  async function fetchWithRetries(
    url: RequestInfo,
    init: RequestInit,
    max_retries = 0
  ): Promise<Response> {
    const res = await fetch(url, init);
    if (res.status === 429 && max_retries > 0) {
      const rateLimitReset = Number(res.headers.get("x-rate-limit-reset"));
      const rateLimitRemaining = Number(res.headers.get("x-rate-limit-remaining"));
      const timeTillReset = rateLimitReset * 1000 - Date.now();
      let timeToWait = 1000;
      if (rateLimitRemaining === 0)
        timeToWait = timeTillReset;
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
      return fetchWithRetries(url, init, max_retries - 1);
    }
    return res;
  }

  class TreemapResponseError extends Error {
    status: number;
    statusText: string;
    headers: Record<string, any>;
    error: Record<string, any>;
    constructor(
      status: number,
      statusText: string,
      headers: Headers,
      error: Record<string, any>
    ) {
      super();
      this.status = status;
      this.statusText = statusText;
      this.headers = Object.fromEntries(headers);
      this.error = error;
    }
  }
