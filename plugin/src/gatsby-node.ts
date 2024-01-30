export type { IPluginOptions, IPluginOptionsInternal } from "./types"
export { sourceNodes } from "./source-nodes"
export {pluginOptionsSchema} from "./plugin-options-schema"
export { onPluginInit } from "./on-plugin-init"
export {createSchemaCustomization} from './create-schema-customization';

exports.PluginOptions = ({Joi})=>{
    return Joi.object({
        message: Joi.string()
        .required()
        .description(`The message logged to the console.`)
    })
}