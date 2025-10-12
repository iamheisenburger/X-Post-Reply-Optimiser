/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as creators from "../creators.js";
import type * as personalContext from "../personalContext.js";
import type * as postGeneration from "../postGeneration.js";
import type * as posts from "../posts.js";
import type * as sentReplies from "../sentReplies.js";
import type * as templates from "../templates.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  creators: typeof creators;
  personalContext: typeof personalContext;
  postGeneration: typeof postGeneration;
  posts: typeof posts;
  sentReplies: typeof sentReplies;
  templates: typeof templates;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
