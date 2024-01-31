import type { GatsbyNode, SourceNodesArgs, NodeInput } from "gatsby";
import { fetchGraphQL } from "./utils";
import { IAuthorInput, IPostInput, IPostImageInput, NodeBuilderInput, IPluginOptionsInternal } from "./types";
import { IRemoteImageNodeInput } from 'gatsby-plugin-utils';
import { NODE_TYPES, ERROR_CODES, CACHE_KEYS } from "./constants";

let isFirstSource = true;

export const sourceNodes: GatsbyNode[`sourceNodes`] = async (gatsbyApi, pluginOptions: IPluginOptionsInternal) => {
    interface IApiResponse {
        data: {
            postCollection: {
                items: Array<IPostInput>
            }
            authorCollection: {
                items: Array<IAuthorInput>
            }
        }
        errors?: Array<{
            message: string
            locations: Array<unknown>
        }>
    }
    const { reporter, cache, actions, getNodes } = gatsbyApi;
    const { touchNode } = actions
    const { endpoint, accessToken } = pluginOptions;

    const sourcingTimer = reporter.activityTimer(`Sourcing from plugin API`);
    sourcingTimer.start();

    if (isFirstSource) {
        getNodes().forEach(node => {
            if (node.internal.owner !== `plugin`) {
                return
            }
            touchNode(node)
        })
        isFirstSource = false;
    }

    const lastFetchedDate: number = await cache.get(CACHE_KEYS.Timestamp);
    const lastFetchedDateCurrent = Date.now();

    reporter.verbose(`[plugin] Last fetched date: ${lastFetchedDate}`)

    let { data, errors } = await fetchGraphQL<IApiResponse>(endpoint, `
    query FetchApi {
        postCollection {
          items {
            id
            title
            slug
            image {
              ... on PostImage {
                url
                alt
                width
                height
              }
            }
            author
          }
        }
        authorCollection{
          items{
            id
            name
          }
        }
      }
      
    `, {
        'Authorization': `Bearer ${accessToken}`
    });
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

    const { postCollection: { items: posts }, authorCollection: { items: authors } } = data;
    sourcingTimer.setStatus(`Process ${posts.length} posts and ${authors.length} authors`)
    for (const post of posts) {
        nodeBuilder({ gatsbyApi, input: { type: NODE_TYPES.Post, data: post } });
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
    const extraData: Record<string, unknown> = {};

    if(input.type === 'contentfulPost'){
        const assetId = createAssetNode(gatsbyApi, input.data.image);
        extraData.image = assetId;
    }
    const node = {
        ...input.data,
        ...extraData,
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

export function createAssetNode(gatsbyApi: SourceNodesArgs, data: IPostImageInput){
    const id = gatsbyApi.createNodeId(`${NODE_TYPES.Asset}-${data.url}`);

    const assetNode = {
        id,
        url: data.url,
        mimeType: `image/jpg`,
        filename: data.url,
        width: data.width,
        height: data.height,
        alt: data.alt,
        placeholderUrl: `${data.url}&w=%width%&h=%height%`,
        parent: null,
        children: [],
        internal: {
            type: NODE_TYPES.Asset,
            contentDigest: gatsbyApi.createContentDigest(data)
        },
    } satisfies IRemoteImageNodeInput;
    gatsbyApi.actions.createNode(assetNode)
    return id;
}