import type { GatsbyNode, SourceNodesArgs, NodeInput } from "gatsby";
import { fetchGraphQL } from "./utils";
import { IAuthorInput, IPostInput, NodeBuilderInput, IPluginOptionsInternal } from "./types";
import { NODE_TYPES, ERROR_CODES, CACHE_KEYS } from "./constants";

export const sourceNodes: GatsbyNode[`sourceNodes`] = async (gatsbyApi, pluginOptions: IPluginOptionsInternal) => {
    interface IApiResponse {
        data: {
            posts: Array<IPostInput>
            authors: Array<IAuthorInput>
        }
        errors?: Array<{
            message: string
            locations: Array<unknown>
        }>
    }
    const { reporter, cache } = gatsbyApi;
    const { endpoint } = pluginOptions;

    const sourcingTimer = reporter.activityTimer(`Sourcing from plugin API`);
    sourcingTimer.start();

    const lastFetchedDate: number = await cache.get(CACHE_KEYS.Timestamp);
    const lastFetchedDateCurrent = Date.now();

    reporter.verbose(`[plugin] Last fetched date: ${lastFetchedDate}`)

    const { data, errors } = await fetchGraphQL<IApiResponse>(endpoint, `
        query FetchApi{
            posts{
                id
                slug
                title
                image {
                    url
                    alt
                    width
                    height
                }
                author
            }
            authors {
                id
                name
            }
        }
    `);

    if (errors) {
        sourcingTimer.panicOnBuild({
            id: ERROR_CODES.GraphQLSourcing,
            context: {
                sourceMessage: `Sourcing from the GraphQL API failed`,
                graphqlError: errors[0].message
            }
        })
        return;
    }

    await cache.set(CACHE_KEYS.Timestamp, lastFetchedDateCurrent)

    const { posts = [], authors = [] } = data;

    sourcingTimer.setStatus(`Process ${posts.length} posts and ${authors.length} authors`)

    for (const post of posts) {
        nodeBuilder({ gatsbyApi, input: { type: NODE_TYPES.Post, data: post } })
    }
    for (const author of authors) {
        nodeBuilder({ gatsbyApi, input: { type: NODE_TYPES.Author, data: author } })
    }
    sourcingTimer.end()
};

interface INodeBuilderArgs {
    gatsbyApi: SourceNodesArgs
    input: NodeBuilderInput
}

export function nodeBuilder({ gatsbyApi, input }: INodeBuilderArgs) {
    const id = gatsbyApi.createNodeId(`${input.type}-${input.data.id}`)

    const node = {
        ...input.data,
        id,
        _id: input.data.id,
        parent: null,
        children: [],
        internal: {
            type: input.type,
            contentDigest: gatsbyApi.createContentDigest(input.data)
        },
    } satisfies NodeInput

    gatsbyApi.actions.createNode(node)

}