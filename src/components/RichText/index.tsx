import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'
import { JSXConverters } from 'payloadcms-lexical-ext'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'
import { SerializedImageNode } from '@/components/RichTextEditor/ImageNode'
import { SerializedVideoNode } from '@/components/RichTextEditor/VideoNode'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps>
  | SerializedImageNode
  | SerializedVideoNode

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => {
  const converters = {
    ...defaultConverters,
    ...JSXConverters,
    ...LinkJSXConverter({ internalDocToHref }),
  } as any

  // 添加自定义图片节点转换器
  converters.image = ({ node }: { node: SerializedImageNode }) => {
    return (
      <img
        src={node.src}
        alt={node.altText || ''}
        width={node.width || undefined}
        height={node.height || undefined}
        style={{
          maxWidth: node.maxWidth ? `${node.maxWidth}px` : '100%',
          height: 'auto',
        }}
        className="my-4 rounded-lg"
      />
    )
  }

  // 添加自定义视频节点转换器
  converters.video = ({ node }: { node: SerializedVideoNode }) => {
    const { src, width = 560, height = 315, title = '' } = node
    
    // 检查是否是YouTube或Vimeo链接
    const isYoutube = src.includes('youtube.com') || src.includes('youtu.be')
    const isVimeo = src.includes('vimeo.com')
    const isBilibili = src.includes('bilibili.com')
    
    if (isYoutube || isVimeo || isBilibili) {
      let embedSrc = src
      
      // 转换YouTube链接为嵌入格式
      if (isYoutube) {
        const videoId = src.includes('youtu.be/') 
          ? src.split('youtu.be/')[1]?.split('?')[0]
          : src.split('v=')[1]?.split('&')[0]
        if (videoId) {
          embedSrc = `https://www.youtube.com/embed/${videoId}`
        }
      }
      
      // 转换Vimeo链接为嵌入格式
      if (isVimeo) {
        const videoId = src.split('vimeo.com/')[1]?.split('?')[0]
        if (videoId) {
          embedSrc = `https://player.vimeo.com/video/${videoId}`
        }
      }
      
      // 转换Bilibili链接为嵌入格式
      if (isBilibili) {
        const bvMatch = src.match(/BV[a-zA-Z0-9]+/)
        if (bvMatch) {
          embedSrc = `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}&page=1`
        }
      }
      
      return (
        <div className="my-4">
          <iframe
            src={embedSrc}
            width={width}
            height={height}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          />
        </div>
      )
    }
    
    // 对于其他视频链接，使用video标签
    return (
      <div className="my-4">
        <video
          src={src}
          width={width}
          height={height}
          controls
          className="rounded-lg"
        >
          您的浏览器不支持视频播放。
        </video>
      </div>
    )
  }

  converters.blocks = {
    banner: ({ node }: any) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }: any) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }: any) => <CodeBlock className="col-start-2" {...node.fields} />,
    cta: ({ node }: any) => <CallToActionBlock {...node.fields} />,
  }

  return converters
}

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose prose-xl dark:prose-invert prose-headings:font-sans prose-headings:tracking-tight prose-p:font-serif prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6 prose-p:whitespace-pre-wrap': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
