import type { GatsbyNode, SourceNodesArgs, NodeInput } from "gatsby";
import { fetchGraphQL } from "./utils";
import { IAuthorInput, IPostInput, NodeBuilderInput } from "./types";
import { NODE_TYPES } from "./constants";

export const sourceNodes: GatsbyNode[`sourceNodes`] = async (gatsbyApi) => {
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
    const { data } = await fetchGraphQL<IApiResponse>(`http://localhost:4000/graphql`, `
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

    const { posts = [], authors = [] } = data;

    for (const post of posts) {
        nodeBuilder({ gatsbyApi, input: { type: NODE_TYPES.Post, data: post } })
    }
    for (const author of authors) {
        nodeBuilder({ gatsbyApi, input: { type: NODE_TYPES.Author, data: author } })
    }
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