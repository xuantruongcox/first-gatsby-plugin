import fetch, { HeadersInit } from "node-fetch"

/**
 * Fetch utility for requests to the example api.
 * You can use a GraphQL client module instead if you prefer a more full-featured experience.
 * @see https://graphql.org/code/#javascript-client
 */
export async function fetchGraphQL<T>(endpoint: string, query: string, headers?: HeadersInit): Promise<T> {
  const response = await fetch(endpoint, {
    method: `POST`,
    headers: {
      "Content-Type": `application/json`,
      ...headers
    } satisfies HeadersInit,
    body: JSON.stringify({
      query,
    }),
  })

  return await response.json()
}