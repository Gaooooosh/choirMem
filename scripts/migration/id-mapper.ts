// ID映射器 - 维护旧系统ID到新系统ID的映射关系
export class IdMapper {
  private maps: Map<string, Map<number, string>> = new Map()

  constructor() {
    // 初始化各个集合的映射表
    this.maps.set('users', new Map())
    this.maps.set('permission-groups', new Map())
    this.maps.set('tracks', new Map())
    this.maps.set('track-versions', new Map())
    this.maps.set('scores', new Map())
    this.maps.set('media', new Map())
    this.maps.set('tags', new Map())
    this.maps.set('comments', new Map())
    this.maps.set('articles', new Map())
    this.maps.set('invitation-codes', new Map())
    this.maps.set('user-collections', new Map())
  }

  // 添加映射关系
  addMapping(collection: string, oldId: number, newId: string) {
    const map = this.maps.get(collection)
    if (!map) {
      throw new Error(`Unknown collection: ${collection}`)
    }
    map.set(oldId, newId)
  }

  // 获取新ID
  getNewId(collection: string, oldId: number): string | undefined {
    const map = this.maps.get(collection)
    if (!map) {
      throw new Error(`Unknown collection: ${collection}`)
    }
    return map.get(oldId)
  }

  // 批量获取新ID
  getNewIds(collection: string, oldIds: number[]): (string | undefined)[] {
    return oldIds.map(oldId => this.getNewId(collection, oldId))
  }

  // 获取映射统计
  getStats() {
    const stats: Record<string, number> = {}
    for (const [collection, map] of this.maps) {
      stats[collection] = map.size
    }
    return stats
  }

  // 检查是否存在映射
  hasMapping(collection: string, oldId: number): boolean {
    const map = this.maps.get(collection)
    if (!map) {
      throw new Error(`Unknown collection: ${collection}`)
    }
    return map.has(oldId)
  }

  // 清空指定集合的映射
  clearCollection(collection: string) {
    const map = this.maps.get(collection)
    if (!map) {
      throw new Error(`Unknown collection: ${collection}`)
    }
    map.clear()
  }

  // 清空所有映射
  clearAll() {
    for (const map of this.maps.values()) {
      map.clear()
    }
  }

  // 导出映射数据（用于调试或持久化）
  exportMappings() {
    const exported: Record<string, Record<number, string>> = {}
    for (const [collection, map] of this.maps) {
      exported[collection] = Object.fromEntries(map)
    }
    return exported
  }

  // 导入映射数据
  importMappings(data: Record<string, Record<number, string>>) {
    for (const [collection, mappings] of Object.entries(data)) {
      const map = this.maps.get(collection)
      if (map) {
        map.clear()
        for (const [oldId, newId] of Object.entries(mappings)) {
          map.set(parseInt(oldId), newId)
        }
      }
    }
  }
}