import { IdMapper } from './id-mapper'
import { FileMigrator } from './file-migrator'
import {
  OldUser,
  OldPermissionGroup,
  OldTrack,
  OldVersion,
  OldScore,
  OldPhoto,
  OldTag,
  OldComment,
  OldArticle,
  OldRating,
  OldLike,
  OldVersionTag,
  OldInvitationCode,
  OldSystemSetting,
  OldAnnouncement,
} from './old-data-reader'
import {
  convertToLexicalRichText,
  generatePlaceholderEmail,
  generateSlug,
  formatTimestamp,
  processBatch,
  withErrorHandling,
  Logger,
} from './utils'

export class DataTransformer {
  private idMapper: IdMapper
  private fileMigrator: FileMigrator
  private payload: any

  constructor(idMapper: IdMapper, fileMigrator: FileMigrator, payload: any) {
    this.idMapper = idMapper
    this.fileMigrator = fileMigrator
    this.payload = payload
  }

  // 迁移权限组
  async migratePermissionGroups(oldGroups: OldPermissionGroup[]) {
    Logger.info(`开始迁移权限组，共 ${oldGroups.length} 个`)

    const results = await processBatch(
      oldGroups,
      async (oldGroup) => {
        return await withErrorHandling(async () => {
          // 首先检查是否已存在同名权限组
          const existingGroups = await this.payload.find({
            collection: 'permission-groups',
            where: {
              name: {
                equals: oldGroup.name,
              },
            },
            limit: 1,
            overrideAccess: true,
          })

          let newGroup
          if (existingGroups.docs.length > 0) {
            // 如果已存在，使用现有的权限组
            newGroup = existingGroups.docs[0]
            Logger.info(`权限组已存在，使用现有: ${oldGroup.name} -> ${newGroup.id}`)
          } else {
            // 如果不存在，创建新的权限组
            newGroup = await this.payload.create({
              collection: 'permission-groups',
              data: {
                name: oldGroup.name,
                can_view_scores: Boolean(oldGroup.can_view_scores),
                can_upload_scores: Boolean(oldGroup.can_upload_scores),
                can_upload_photos: Boolean(oldGroup.can_upload_photos),
                can_post_comments: Boolean(oldGroup.can_post_comments),
                can_create_tracks: Boolean(oldGroup.can_create_tracks),
                // 新系统中的额外权限字段，设置默认值
                can_manage_permission_groups: false,
                can_manage_system_settings: false,
                can_manage_users: false,
                can_manage_invitation_codes: false,
              },
              // 跳过访问控制
              overrideAccess: true,
            })
            Logger.info(`创建新权限组: ${oldGroup.name} -> ${newGroup.id}`)
          }

          this.idMapper.addMapping('permission-groups', oldGroup.id, newGroup.id.toString())
          return newGroup
        }, `迁移权限组 ${oldGroup.name}`)
      },
      5,
      (processed, total) => Logger.info(`权限组迁移进度: ${processed}/${total}`),
    )

    const successCount = results.filter((r) => r !== null).length
    Logger.info(`权限组迁移完成: ${successCount}/${oldGroups.length} 成功`)
    return results
  }

  // 迁移用户
  async migrateUsers(oldUsers: OldUser[]) {
    Logger.info(`开始迁移用户，共 ${oldUsers.length} 个`)

    const results = await processBatch(
      oldUsers,
      async (oldUser) => {
        return await withErrorHandling(async () => {
          // 迁移头像文件
          let avatarMediaId: string | undefined
          if (oldUser.avatar_filename && this.fileMigrator) {
            const avatarResult = this.fileMigrator.migrateUserAvatar(oldUser.avatar_filename)
            if (avatarResult.success && avatarResult.newPath) {
              // 为头像创建media记录
              const avatarMedia = await this.payload.create({
                collection: 'media',
                data: {
                  alt: `${oldUser.username}的头像`,
                  filename: oldUser.avatar_filename,
                  mimeType: 'image/jpeg',
                  filesize: 0,
                  width: 0,
                  height: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                filePath: avatarResult.newPath,
              })
              avatarMediaId = avatarMedia.id.toString()
            }
          }

          // 获取权限组ID
          const permissionGroupId = this.idMapper.getNewId('permission-groups', oldUser.group_id)
          if (!permissionGroupId) {
            throw new Error(`找不到权限组映射: ${oldUser.group_id}`)
          }

          // 生成唯一的邮箱地址
          let email = oldUser.email || generatePlaceholderEmail(oldUser.username)
          let emailCounter = 1

          // 如果生成的邮箱是默认的 user@example.com，则使用用户ID来确保唯一性
          if (!oldUser.email && email === 'user@example.com') {
            email = `user${oldUser.id}@example.com`
          }

          // 检查是否已存在相同用户名的用户
          const existingUserByUsername = await this.payload.find({
            collection: 'users',
            where: {
              username: {
                equals: oldUser.username,
              },
            },
            limit: 1,
            overrideAccess: true,
          })

          // 如果邮箱是生成的占位邮箱，确保其唯一性
          if (!oldUser.email) {
            while (true) {
              const existingUserByEmail = await this.payload.find({
                collection: 'users',
                where: {
                  email: {
                    equals: email,
                  },
                },
                limit: 1,
                overrideAccess: true,
              })

              if (existingUserByEmail.docs.length === 0) {
                break // 邮箱唯一，可以使用
              }

              // 邮箱重复，生成新的邮箱
              const baseEmail = generatePlaceholderEmail(oldUser.username)
              const [localPart, domain] = baseEmail.split('@')
              email = `${localPart}${emailCounter}@${domain}`
              emailCounter++
            }
          }

          // 最终检查邮箱是否存在（对于真实邮箱）
          const existingUserByEmail = await this.payload.find({
            collection: 'users',
            where: {
              email: {
                equals: email,
              },
            },
            limit: 1,
            overrideAccess: true,
          })

          let newUser
          if (existingUserByUsername.docs.length > 0) {
            // 用户名已存在，使用现有用户
            newUser = existingUserByUsername.docs[0]
            Logger.info(`用户名已存在，复用现有用户: ${oldUser.username} -> ${newUser.id}`)
          } else if (existingUserByEmail.docs.length > 0) {
            // 邮箱已存在，使用现有用户
            newUser = existingUserByEmail.docs[0]
            Logger.info(`邮箱已存在，复用现有用户: ${email} -> ${newUser.id}`)
          } else {
            // 创建新用户
            try {
              const userData = {
                username: oldUser.username,
                email: email,
                password: 'temp-password-needs-reset', // 临时密码，需要重置
                needs_password_reset: true, // 标识需要重置密码
                bio: convertToLexicalRichText(oldUser.bio || oldUser.about_me),
                activity_score: oldUser.activity_score || 0,
                // last_seen 和 has_seen_welcome 字段在新系统中不存在
                group: parseInt(permissionGroupId),
                avatar: avatarMediaId ? parseInt(avatarMediaId) : null,
              }

              Logger.info(
                `准备创建用户: ${oldUser.username}, 邮箱: ${email}, 权限组: ${permissionGroupId}`,
              )

              newUser = await this.payload.create({
                collection: 'users',
                data: userData,
                overrideAccess: true,
              })
              Logger.info(`创建新用户成功: ${oldUser.username} -> ${newUser.id}`)
            } catch (createError: any) {
              Logger.error(`创建用户失败: ${oldUser.username}`, {
                error: createError.message,
                email: email,
                permissionGroupId: permissionGroupId,
                oldUserId: oldUser.id,
              })
              throw createError
            }
          }

          this.idMapper.addMapping('users', oldUser.id, newUser.id.toString())
          Logger.info(`迁移用户: ${oldUser.username} -> ${newUser.id}`)
          return newUser
        }, `迁移用户 ${oldUser.username}`)
      },
      5,
      (processed, total) => Logger.info(`用户迁移进度: ${processed}/${total}`),
    )

    const successCount = results.filter((r) => r !== null).length
    Logger.info(`用户迁移完成: ${successCount}/${oldUsers.length} 成功`)
    return results
  }

  // 迁移标签
  async migrateTags(oldTags: OldTag[]) {
    Logger.info(`开始迁移标签，共 ${oldTags.length} 个`)

    const results = await processBatch(
      oldTags,
      async (oldTag) => {
        return await withErrorHandling(async () => {
          // 首先检查是否已存在同名标签
          const existingTags = await this.payload.find({
            collection: 'tags',
            where: {
              name: {
                equals: oldTag.name,
              },
            },
            limit: 1,
            overrideAccess: true,
          })

          let newTag
          if (existingTags.docs.length > 0) {
            // 如果已存在，使用现有的标签
            newTag = existingTags.docs[0]
            Logger.info(`标签已存在，使用现有: ${oldTag.name} -> ${newTag.id}`)
          } else {
            // 如果不存在，创建新的标签
            newTag = await this.payload.create({
              collection: 'tags',
              data: {
                name: oldTag.name,
              },
            })
            Logger.info(`创建新标签: ${oldTag.name} -> ${newTag.id}`)
          }

          this.idMapper.addMapping('tags', oldTag.id, newTag.id.toString())
          return newTag
        }, `迁移标签 ${oldTag.name}`)
      },
      10,
      (processed, total) => Logger.info(`标签迁移进度: ${processed}/${total}`),
    )

    const successCount = results.filter((r) => r !== null).length
    Logger.info(`标签迁移完成: ${successCount}/${oldTags.length} 成功`)
    return results
  }

  // 迁移曲目
  async migrateTracks(oldTracks: OldTrack[]) {
    Logger.info(`开始迁移曲目，共 ${oldTracks.length} 个`)

    const usedSlugs = new Set<string>()

    const results = await processBatch(
      oldTracks,
      async (oldTrack) => {
        return await withErrorHandling(async () => {
          let baseSlug = generateSlug(oldTrack.title)
          let slug = baseSlug
          let counter = 1

          // 确保slug唯一性（检查数据库和内存中的slug）
          while (usedSlugs.has(slug)) {
            slug = `${baseSlug}-${counter}`
            counter++
          }

          // 检查数据库中是否已存在相同slug的曲目
          let existingTrack = await this.payload.find({
            collection: 'tracks',
            where: {
              slug: {
                equals: slug,
              },
            },
            limit: 1,
            overrideAccess: true,
          })

          // 如果数据库中已存在，继续生成新的slug
          while (existingTrack.docs.length > 0) {
            slug = `${baseSlug}-${counter}`
            counter++
            existingTrack = await this.payload.find({
              collection: 'tracks',
              where: {
                slug: {
                  equals: slug,
                },
              },
              limit: 1,
              overrideAccess: true,
            })
          }

          usedSlugs.add(slug)

          const newTrack = await this.payload.create({
            collection: 'tracks',
            data: {
              title: oldTrack.title,
              description: convertToLexicalRichText(oldTrack.description),
              slug: slug,
            },
          })

          this.idMapper.addMapping('tracks', oldTrack.id, newTrack.id.toString())
          Logger.info(`迁移曲目: ${oldTrack.title} -> ${newTrack.id}`)
          return newTrack
        }, `迁移曲目 ${oldTrack.title}`)
      },
      5,
      (processed, total) => Logger.info(`曲目迁移进度: ${processed}/${total}`),
    )

    const successCount = results.filter((r) => r !== null).length
    Logger.info(`曲目迁移完成: ${successCount}/${oldTracks.length} 成功`)
    return results
  }

  // 迁移曲目版本（需要处理点赞和评分）
  async migrateTrackVersions(
    oldVersions: OldVersion[],
    oldLikes: OldLike[],
    oldRatings: OldRating[],
    oldVersionTags: OldVersionTag[],
  ) {
    Logger.info(`开始迁移曲目版本，共 ${oldVersions.length} 个`)

    // 按版本ID分组点赞和评分
    const likesByVersion = new Map<number, OldLike[]>()
    const ratingsByVersion = new Map<number, OldRating[]>()
    const tagsByVersion = new Map<number, number[]>()

    oldLikes.forEach((like) => {
      if (!likesByVersion.has(like.version_id)) {
        likesByVersion.set(like.version_id, [])
      }
      likesByVersion.get(like.version_id)!.push(like)
    })

    oldRatings.forEach((rating) => {
      if (!ratingsByVersion.has(rating.version_id)) {
        ratingsByVersion.set(rating.version_id, [])
      }
      ratingsByVersion.get(rating.version_id)!.push(rating)
    })

    oldVersionTags.forEach((vt) => {
      if (!tagsByVersion.has(vt.version_id)) {
        tagsByVersion.set(vt.version_id, [])
      }
      tagsByVersion.get(vt.version_id)!.push(vt.tag_id)
    })

    const results = await processBatch(
      oldVersions,
      async (oldVersion) => {
        return await withErrorHandling(async () => {
          // 获取关联ID
          const trackId = this.idMapper.getNewId('tracks', oldVersion.track_id)
          const creatorId = this.idMapper.getNewId('users', oldVersion.user_id)

          if (!trackId || !creatorId) {
            throw new Error(
              `找不到关联映射: track=${oldVersion.track_id}, user=${oldVersion.user_id}`,
            )
          }

          // 处理标签
          const versionTagIds = tagsByVersion.get(oldVersion.id) || []
          const tagIds = versionTagIds
            .map((tagId) => this.idMapper.getNewId('tags', tagId))
            .filter((id) => id !== undefined) as string[]

          // 处理点赞
          const versionLikes = likesByVersion.get(oldVersion.id) || []
          const likeUserIds = versionLikes
            .map((like) => this.idMapper.getNewId('users', like.user_id))
            .filter((id) => id !== undefined) as string[]

          // 处理评分
          const versionRatings = ratingsByVersion.get(oldVersion.id) || []
          const ratings = versionRatings
            .map((rating) => {
              const userId = this.idMapper.getNewId('users', rating.user_id)
              return userId
                ? {
                    user: userId,
                    difficulty: rating.difficulty,
                  }
                : null
            })
            .filter((rating) => rating !== null)

          const newVersion = await this.payload.create({
            collection: 'track-versions',
            data: {
              title: oldVersion.title,
              notes: convertToLexicalRichText(oldVersion.notes),
              track: parseInt(trackId),
              creator: parseInt(creatorId),
              tags: tagIds.map((id) => parseInt(id)),
              likes: likeUserIds.map((id) => parseInt(id)),
              ratings: ratings.map((r) => ({
                user: parseInt(r.user),
                difficulty: r.difficulty,
              })),
              createdAt: formatTimestamp(oldVersion.timestamp),
            },
          })

          this.idMapper.addMapping('track-versions', oldVersion.id, newVersion.id.toString())
          Logger.info(`迁移版本: ${oldVersion.title} -> ${newVersion.id}`)
          return newVersion
        }, `迁移版本 ${oldVersion.title}`)
      },
      3,
      (processed, total) => Logger.info(`版本迁移进度: ${processed}/${total}`),
    )

    const successCount = results.filter((r) => r !== null).length
    Logger.info(`版本迁移完成: ${successCount}/${oldVersions.length} 成功`)
    return results
  }

  // 迁移乐谱
  async migrateScores(oldScores: OldScore[]) {
    Logger.info(`开始迁移乐谱，共 ${oldScores.length} 个`)

    const results = await processBatch(
      oldScores,
      async (oldScore) => {
        return await withErrorHandling(async () => {
          // 迁移文件
          const fileResult = this.fileMigrator.migrateScoreFile(oldScore.filename)
          if (!fileResult.success || !fileResult.newPath) {
            throw new Error(`文件迁移失败: ${fileResult.error}`)
          }

          // 获取关联ID
          const versionId = this.idMapper.getNewId('track-versions', oldScore.version_id)
          const uploaderId = this.idMapper.getNewId('users', oldScore.user_id)

          if (!versionId || !uploaderId) {
            throw new Error(
              `找不到关联映射: version=${oldScore.version_id}, user=${oldScore.user_id}`,
            )
          }

          const newScore = await this.payload.create({
            collection: 'scores',
            data: {
              title: oldScore.description || '未命名乐谱',
              description: convertToLexicalRichText(oldScore.description),
              track_version: parseInt(versionId),
              uploader: parseInt(uploaderId),
              createdAt: formatTimestamp(oldScore.timestamp),
            },
            filePath: fileResult.newPath,
          })

          this.idMapper.addMapping('scores', oldScore.id, newScore.id.toString())
          Logger.info(`迁移乐谱: ${oldScore.filename} -> ${newScore.id}`)
          return newScore
        }, `迁移乐谱 ${oldScore.filename}`)
      },
      3,
      (processed, total) => Logger.info(`乐谱迁移进度: ${processed}/${total}`),
    )

    const successCount = results.filter((r) => r !== null).length
    Logger.info(`乐谱迁移完成: ${successCount}/${oldScores.length} 成功`)
    return results
  }

  // 迁移照片到媒体
  async migratePhotosToMedia(oldPhotos: OldPhoto[]) {
    Logger.info(`开始迁移照片到媒体，共 ${oldPhotos.length} 个`)

    const results = await processBatch(
      oldPhotos,
      async (oldPhoto) => {
        return await withErrorHandling(async () => {
          // 迁移文件
          const fileResult = this.fileMigrator.migratePhotoFile(oldPhoto.filename)
          if (!fileResult.success || !fileResult.newPath) {
            throw new Error(`文件迁移失败: ${fileResult.error}`)
          }

          // 获取关联ID
          const versionId = this.idMapper.getNewId('track-versions', oldPhoto.version_id)
          const uploaderId = this.idMapper.getNewId('users', oldPhoto.user_id)

          if (!versionId || !uploaderId) {
            throw new Error(
              `找不到关联映射: version=${oldPhoto.version_id}, user=${oldPhoto.user_id}`,
            )
          }

          const uploaderIdStr = this.idMapper.getNewId('users', oldPhoto.user_id)
          if (!uploaderIdStr) {
            throw new Error(`找不到用户映射: ${oldPhoto.user_id}`)
          }

          const newMedia = await this.payload.create({
            collection: 'media',
            data: {
              alt: oldPhoto.caption || '照片',
              filename: oldPhoto.filename,
              mimeType: 'image/jpeg', // 根据文件扩展名设置
              filesize: 0, // 需要从文件系统获取
              width: 0,
              height: 0,
              uploader: parseInt(uploaderIdStr),
              createdAt: formatTimestamp(oldPhoto.timestamp),
              updatedAt: formatTimestamp(oldPhoto.timestamp),
            },
            filePath: fileResult.newPath,
          })

          this.idMapper.addMapping('media', oldPhoto.id, newMedia.id.toString())
          Logger.info(`迁移照片: ${oldPhoto.filename} -> ${newMedia.id}`)
          return newMedia
        }, `迁移照片 ${oldPhoto.filename}`)
      },
      3,
      (processed, total) => Logger.info(`照片迁移进度: ${processed}/${total}`),
    )

    const successCount = results.filter((r) => r !== null).length
    Logger.info(`照片迁移完成: ${successCount}/${oldPhotos.length} 成功`)
    return results
  }

  // 迁移评论
  async migrateComments(oldComments: OldComment[]) {
    Logger.info(`开始迁移评论，共 ${oldComments.length} 个`)

    const results = await processBatch(
      oldComments,
      async (oldComment) => {
        return await withErrorHandling(async () => {
          const authorId = this.idMapper.getNewId('users', oldComment.user_id)
          if (!authorId) {
            throw new Error(`找不到用户映射: ${oldComment.user_id}`)
          }

          // 确定评论类型和关联对象
          let relatedCollection: string
          let relatedId: string | undefined

          if (oldComment.version_id) {
            relatedCollection = 'track-versions'
            relatedId = this.idMapper.getNewId('track-versions', oldComment.version_id)
          } else if (oldComment.track_id) {
            relatedCollection = 'tracks'
            relatedId = this.idMapper.getNewId('tracks', oldComment.track_id)
          } else {
            throw new Error('评论没有关联对象')
          }

          if (!relatedId) {
            throw new Error(`找不到关联对象映射: ${relatedCollection}`)
          }

          const newComment = await this.payload.create({
            collection: 'comments',
            data: {
              body: oldComment.body,
              author: parseInt(authorId),
              track: relatedCollection === 'tracks' ? parseInt(relatedId) : undefined,
              track_version:
                relatedCollection === 'track-versions' ? parseInt(relatedId) : undefined,
              createdAt: formatTimestamp(oldComment.timestamp),
            },
          })

          Logger.info(`迁移评论: ${oldComment.id} -> ${newComment.id}`)
          return newComment
        }, `迁移评论 ${oldComment.id}`)
      },
      5,
      (processed, total) => Logger.info(`评论迁移进度: ${processed}/${total}`),
    )

    const successCount = results.filter((r) => r !== null).length
    Logger.info(`评论迁移完成: ${successCount}/${oldComments.length} 成功`)
    return results
  }

  // 迁移文章
  async migrateArticles(oldArticles: OldArticle[]) {
    Logger.info(`开始迁移文章，共 ${oldArticles.length} 个`)

    const results = await processBatch(
      oldArticles,
      async (oldArticle) => {
        return await withErrorHandling(async () => {
          const authorId = this.idMapper.getNewId('users', oldArticle.user_id)
          if (!authorId) {
            throw new Error(`找不到用户映射: ${oldArticle.user_id}`)
          }

          const newArticle = await this.payload.create({
            collection: 'articles',
            data: {
              title: oldArticle.title,
              content_type: 'richtext',
              rich_content: convertToLexicalRichText(oldArticle.body),
              author: parseInt(authorId),
              createdAt: formatTimestamp(oldArticle.timestamp),
            },
          })

          Logger.info(`迁移文章: ${oldArticle.title} -> ${newArticle.id}`)
          return newArticle
        }, `迁移文章 ${oldArticle.title}`)
      },
      3,
      (processed, total) => Logger.info(`文章迁移进度: ${processed}/${total}`),
    )

    const successCount = results.filter((r) => r !== null).length
    Logger.info(`文章迁移完成: ${successCount}/${oldArticles.length} 成功`)
    return results
  }

  // 迁移邀请码
  async migrateInvitationCodes(oldCodes: OldInvitationCode[]) {
    Logger.info(`开始迁移邀请码，共 ${oldCodes.length} 个`)

    const results = await processBatch(
      oldCodes,
      async (oldCode) => {
        return await withErrorHandling(async () => {
          const groupId = this.idMapper.getNewId('permission-groups', oldCode.group_id)
          if (!groupId) {
            throw new Error(`找不到权限组映射: ${oldCode.group_id}`)
          }

          // 检查是否已存在相同code的邀请码
          const existingCode = await this.payload.find({
            collection: 'invitation-codes',
            where: {
              code: {
                equals: oldCode.code,
              },
            },
            limit: 1,
            overrideAccess: true,
          })

          let newCode
          if (existingCode.docs.length > 0) {
            // 邀请码已存在，使用现有的
            newCode = existingCode.docs[0]
            Logger.info(`邀请码已存在，使用现有: ${oldCode.code} -> ${newCode.id}`)
          } else {
            // 创建新邀请码
            newCode = await this.payload.create({
              collection: 'invitation-codes',
              data: {
                code: oldCode.code,
                group: parseInt(groupId),
                total_uses: oldCode.total_uses,
                uses_left: oldCode.uses_left,
                createdAt: formatTimestamp(oldCode.created_at),
              },
            })
            Logger.info(`创建新邀请码: ${oldCode.code} -> ${newCode.id}`)
          }

          this.idMapper.addMapping('invitation-codes', oldCode.id, newCode.id.toString())
          Logger.info(`迁移邀请码: ${oldCode.code} -> ${newCode.id}`)
          return newCode
        }, `迁移邀请码 ${oldCode.code}`)
      },
      5,
      (processed, total) => Logger.info(`邀请码迁移进度: ${processed}/${total}`),
    )

    const successCount = results.filter((r) => r !== null).length
    Logger.info(`邀请码迁移完成: ${successCount}/${oldCodes.length} 成功`)
    return results
  }

  // 迁移系统设置
  async migrateSystemSettings(oldSettings: OldSystemSetting[]) {
    Logger.info(`开始迁移系统设置，共 ${oldSettings.length} 个`)

    // 将设置转换为键值对
    const settingsMap = new Map<string, string>()
    oldSettings.forEach((setting) => {
      settingsMap.set(setting.key, setting.value)
    })

    const globalData = {
      registration_enabled: settingsMap.get('registration_enabled') === 'true',
      homepage_photo_max: parseInt(settingsMap.get('homepage_photo_max') || '10'),
      ai_polish_prompt: settingsMap.get('ai_polish_prompt') || '',
      welcome_message: settingsMap.get('welcome_message') || '欢迎加入合唱团！',
    }

    try {
      await this.payload.updateGlobal({
        slug: 'system-settings',
        data: globalData,
      })

      Logger.info('系统设置迁移完成')
      return globalData
    } catch (error) {
      Logger.error('系统设置迁移失败', error)
      throw error
    }
  }
}
