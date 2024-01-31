require('dotenv').config({
  path: `.env.development`
})
import type { GatsbyConfig } from "gatsby"
import type { IPluginOptions } from "plugin"

/**
 * In a real-world scenario, you would probably place this in a .env file
 * @see https://www.gatsbyjs.com/docs/how-to/local-development/environment-variables/
 */
const GRAPHQL_ENDPOINT = `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`

const config: GatsbyConfig = {
  graphqlTypegen: true,
  plugins: [
    {
      resolve: `plugin`,
      // You can pass any serializable options to the plugin
      options: {
        endpoint: GRAPHQL_ENDPOINT,
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
      } satisfies IPluginOptions,
    },
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,

  ],
}

export default config
