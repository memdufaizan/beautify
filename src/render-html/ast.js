
import blockTags from 'block-elements'
import inlineTags from './inline-tags'
import voidTags from './void-tags'

/*::
// This is what posthtml gives us to work with.
type PostHTMLText = string
export type PostHTMLTree = Array<PostHTMLNode | PostHTMLText>
export type PostHTMLNode = {
  tag: string,
  attrs: {[id:string]: string},
  content: PostHTMLTree
}

// This is what we transform it into.
export type tree = Array<node>
export type node = {
  tag?: string,
  attrs: {[id:string]: string},
  meta: {
    isText: boolean,
    isBlock: boolean,
    isInline: boolean,
    isVoid: boolean
  },
  content: tree
}
*/

function treeReducer (tree/*: tree */, node/*: node */) /*: tree */{
  let last = tree[tree.length - 1]
  // Combine adjacent text nodes
  if (last.meta.isText && node.meta.isText) {
    last.content[0] = last.content[0] + node.content[0]
  } else {
    tree.push(node)
  }
  return tree
}

function normalizeAttrs (attrs) {
  let result = {}
  for (let key in attrs) {
    let lkey = key.toLowerCase()
    if (typeof attrs[key] !== 'undefined') {
      result[lkey] = String(attrs[key])
    }
  }
  return result
}

function doctypeNode (node) {
  node = node.replace(/^</, '').replace(/>$/, '')
  return {
    tag: node,
    attrs: {},
    meta: {
      isBlock: true,
      isVoid: true
    },
    content: []
  }
}

function textNode (node) {
  if (node.startsWith('<!DOCTYPE')) {
    return doctypeNode(node)
  }
  let result = {
    meta: {
      isText: true
    },
    content: [node]
  }
  if (node.includes('\n')) result.meta.isMultiline = true
  return result
}

function normalizeNode (node/*: PostHTMLNode | PostHTMLText */) /*: node */{
  let result/*: node */ = {}
  if (typeof node === 'string') {
    return textNode(node)
  }
  result.tag = node.tag.toLowerCase()
  result.attrs = normalizeAttrs(node.attrs)
  result.meta = {}
  // This is done intentionally to keep the JSONified representation more readable
  if (inlineTags.includes(result.tag)) result.meta.isInline = true
  if (blockTags.includes(result.tag)) result.meta.isBlock = true
  if (voidTags.includes(result.tag)) result.meta.isVoid = true
  result.content = normalizeTree(node.content)
  return result
}

function normalizeTree (tree/*: PostHTMLTree */) /*: tree */{
  if (typeof tree === 'undefined') return []
  // step 1. normalize nodes
  tree = tree.map(normalizeNode)
  // step 2. reduce array
  // I'm not very experienced with reduce so this is awkward looking.
  let head = tree.slice(0, 1)
  let tail = tree.slice(1)
  return tail.reduce(treeReducer, head)
}

export default {
  norm: function normalize (thing/*: PostHTMLTree | PostHTMLNode | PostHTMLText */) /*: tree|node */{
    if (Array.isArray(thing)) return normalizeTree(thing)
    return normalizeNode(thing)
  }
}
