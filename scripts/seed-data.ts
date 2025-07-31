import type { Payload } from 'payload'

/**
 * Seed data script for the choir management system
 * Creates sample tags, tracks, track versions, and pages
 */
export const seedData = async (payload: Payload, adminUserId: string) => {
  console.log('🌱 开始创建种子数据...')

  // 1. Create Tags
  console.log('🏷️  正在创建标签...')
  const tags = [
    { name: 'SATB' },
    { name: '无伴奏' },
    { name: '经典' },
    { name: '流行' },
    { name: '民族' },
    { name: '宗教' },
    { name: '现代' },
    { name: '儿童合唱' },
  ]

  const createdTags = []
  for (const tagData of tags) {
    try {
      const tag = await payload.create({
        collection: 'tags',
        data: tagData,
      })
      createdTags.push(tag)
      console.log(`✅ 已创建标签: ${tagData.name}`)
    } catch (error) {
      console.log(`⚠️  创建标签 ${tagData.name} 时出错:`, error)
    }
  }

  // 2. Create Tracks
  console.log('🎵 正在创建曲目...')
  const tracks = [
    {
      title: '欢乐颂',
      description: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '贝多芬第九交响曲第四乐章的著名合唱曲目，表达了人类团结友爱的崇高理想。这首作品以其激昂的旋律和深刻的精神内涵，成为世界合唱文献中的经典之作。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      slug: 'ode-to-joy',
    },
    {
      title: '茉莉花',
      description: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '中国著名的民歌，旋律优美动听，歌词清新淡雅。这首歌曲经过多次改编，已成为中国民族音乐的经典代表作品之一。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      slug: 'jasmine-flower',
    },
    {
      title: 'Ave Maria',
      description: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '舒伯特创作的经典宗教合唱作品，以其庄严神圣的旋律和深沉的宗教情感而闻名。这首作品是合唱团经常演唱的经典曲目。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      slug: 'ave-maria',
    },
    {
      title: '青春舞曲',
      description: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '王洛宾先生根据维吾尔族民歌改编的经典作品，节奏欢快，充满青春活力。这首歌曲深受广大青年朋友的喜爱。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      slug: 'youth-dance',
    },
    {
      title: 'Hallelujah',
      description: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'Leonard Cohen创作的经典歌曲，后被多位艺术家翻唱。这首歌曲以其深刻的歌词和优美的旋律成为现代合唱文献中的重要作品。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      slug: 'hallelujah',
    },
  ]

  const createdTracks = []
  for (const trackData of tracks) {
    try {
      const track = await payload.create({
        collection: 'tracks',
        data: trackData,
      })
      createdTracks.push(track)
      console.log(`✅ 已创建曲目: ${trackData.title}`)
    } catch (error) {
      console.log(`⚠️  创建曲目 ${trackData.title} 时出错:`, error)
    }
  }

  // 3. Create Track Versions
  console.log('🎼 正在创建曲目版本...')
  const versions = [
    // 欢乐颂版本
    {
      title: '欢乐颂 SATB 版本',
      notes: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '标准四部合唱版本，适合成人合唱团演出。注意高音部分的音准控制，低音部分要有力度支撑。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      track: createdTracks[0]?.id,
      creator: parseInt(adminUserId, 10),
      tags: [createdTags[0]?.id, createdTags[2]?.id].filter(Boolean), // SATB, 经典
    },
    {
      title: '欢乐颂 无伴奏版本',
      notes: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '纯人声演唱版本，更加突出合唱的和声美感。要求合唱团员具备较高的音乐素养和音准控制能力。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      track: createdTracks[0]?.id,
      creator: parseInt(adminUserId, 10),
      tags: [createdTags[1]?.id, createdTags[2]?.id].filter(Boolean), // 无伴奏, 经典
    },
    // 茉莉花版本
    {
      title: '茉莉花 民族风版本',
      notes: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '保持原有民族特色的编排，适合展现中国传统音乐的韵味。演唱时要注意咬字清晰，体现汉语的声韵美。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      track: createdTracks[1]?.id,
      creator: parseInt(adminUserId, 10),
      tags: [createdTags[4]?.id, createdTags[2]?.id].filter(Boolean), // 民族, 经典
    },
    // Ave Maria版本
    {
      title: 'Ave Maria 宗教合唱版本',
      notes: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '舒伯特原版的宗教合唱编排，要求演唱者具备良好的音乐修养和对宗教音乐的理解。注意情感的控制和表达。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      track: createdTracks[2]?.id,
      creator: parseInt(adminUserId, 10),
      tags: [createdTags[5]?.id, createdTags[2]?.id].filter(Boolean), // 宗教, 经典
    },
    // 青春舞曲版本
    {
      title: '青春舞曲 现代编排版本',
      notes: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '融入现代编曲元素的版本，保持原有的民族特色同时增加了现代感。适合青年合唱团演出。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      track: createdTracks[3]?.id,
      creator: parseInt(adminUserId, 10),
      tags: [createdTags[6]?.id, createdTags[4]?.id].filter(Boolean), // 现代, 民族
    },
    // Hallelujah版本
    {
      title: 'Hallelujah 流行合唱版本',
      notes: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '改编自Leonard Cohen的经典作品，适合现代合唱团演出。要注意歌词的情感表达和音乐的层次感。',
                  version: 1,
                },
              ],
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      track: createdTracks[4]?.id,
      creator: parseInt(adminUserId, 10),
      tags: [createdTags[3]?.id, createdTags[6]?.id].filter(Boolean), // 流行, 现代
    },
  ]

  const createdVersions = []
  for (const versionData of versions) {
    if (versionData.track) {
      try {
        const version = await payload.create({
          collection: 'track-versions',
          data: versionData,
        })
        createdVersions.push(version)
        console.log(`✅ 已创建版本: ${versionData.title}`)
      } catch (error) {
        console.log(`⚠️  创建版本 ${versionData.title} 时出错:`, error)
      }
    }
  }

  // 4. Create About Page
  console.log('📄 正在创建 About 页面...')
  try {
    await payload.create({
      collection: 'pages',
      data: {
        title: '关于我们',
        publishedAt: new Date().toISOString(),
        slug: 'about',
        hero: {
          type: 'lowImpact',
          richText: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'heading',
                  children: [
                    {
                      type: 'text',
                      text: '欢迎来到合唱团乐谱共享平台',
                      version: 1,
                    },
                  ],
                  tag: 'h1',
                  version: 1,
                },
              ],
              direction: 'ltr' as const,
              format: '',
              indent: 0,
              version: 1,
            },
          },
          media: null,
        },
        layout: [
          {
            blockType: 'content',
            columns: [
              {
                size: 'full',
                richText: {
                  root: {
                    type: 'root',
                    children: [
                      {
                        type: 'heading',
                        children: [
                          {
                            type: 'text',
                            text: '我们的使命',
                            version: 1,
                          },
                        ],
                        tag: 'h2',
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: '我们致力于为合唱团提供一个优质的乐谱共享和管理平台。通过现代化的技术手段，让合唱团员能够方便地获取、分享和管理乐谱资源，促进合唱艺术的传播和发展。',
                            version: 1,
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'heading',
                        children: [
                          {
                            type: 'text',
                            text: '平台特色',
                            version: 1,
                          },
                        ],
                        tag: 'h2',
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: '• 丰富的乐谱资源库，涵盖各种风格和难度的合唱作品',
                            version: 1,
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: '• 完善的分类和标签系统，帮助快速找到所需乐谱',
                            version: 1,
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: '• 用户友好的界面设计，支持各种设备访问',
                            version: 1,
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: '• 活跃的社区交流功能，促进合唱爱好者之间的互动',
                            version: 1,
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'heading',
                        children: [
                          {
                            type: 'text',
                            text: '联系我们',
                            version: 1,
                          },
                        ],
                        tag: 'h2',
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: '如果您有任何问题或建议，欢迎通过以下方式联系我们：',
                            version: 1,
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: '📧 邮箱：contact@choir-platform.com',
                            version: 1,
                          },
                        ],
                        version: 1,
                      },
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            text: '🎵 让我们一起传播合唱艺术的美好！',
                            version: 1,
                          },
                        ],
                        version: 1,
                      },
                    ],
                    direction: 'ltr' as const,
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                },
              },
            ],
          },
        ],
        meta: {
          title: '关于我们 - 合唱团乐谱共享平台',
          description: '了解我们的合唱团乐谱共享平台，我们的使命、特色和联系方式。',
        },
      },
    })
    console.log('✅ 已创建 About 页面')
  } catch (error) {
    console.log('⚠️  创建 About 页面时出错:', error)
  }

  console.log('🎉 种子数据创建完成！')
  console.log(`📊 创建统计:`)
  console.log(`   • 标签: ${createdTags.length} 个`)
  console.log(`   • 曲目: ${createdTracks.length} 个`)
  console.log(`   • 版本: ${createdVersions.length} 个`)
  console.log(`   • 页面: 1 个 (About)`)
}