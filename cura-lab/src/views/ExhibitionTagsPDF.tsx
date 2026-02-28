// src/views/ExhibitionTagsPDF.tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { Submission, Artwork, User } from '../../../payload-project/src/payload-types'

// ─── 字体风格预设 ───────────────────────────────────────────
// 如果需要中文支持，注册 Noto Sans SC 等字体：
// Font.register({ family: 'NotoSansSC', src: '/fonts/NotoSansSC-Regular.ttf' })
// Font.register({ family: 'NotoSansSC-Bold', src: '/fonts/NotoSansSC-Bold.ttf' })

export const TAG_STYLE_LABELS: Record<TagStyle, string> = {
  classic: 'Classic',
  modern: 'Modern',
  minimal: 'Minimal',
  editorial: 'Editorial',
}

export type TagStyle = 'classic' | 'modern' | 'minimal' | 'editorial'

const tagStyleConfigs: Record<TagStyle, {
  titleFont: string
  titleSize: number
  titleTransform?: 'uppercase' | 'none'
  titleLetterSpacing?: number
  bodyFont: string
  bodySize: number
  artistFont: string
  artistSize: number
  priceFont: string
  footerFont: string
  accentColor: string
  dividerStyle?: 'line' | 'dot' | 'none'
}> = {
  // 经典美术馆风格：衬线体，优雅
  classic: {
    titleFont: 'Times-Italic',
    titleSize: 14,
    titleTransform: 'none',
    bodyFont: 'Times-Roman',
    bodySize: 9,
    artistFont: 'Times-Bold',
    artistSize: 11,
    priceFont: 'Times-Roman',
    footerFont: 'Helvetica',
    accentColor: '#333',
    dividerStyle: 'line',
  },
  // 现代画廊风格：无衬线，干净
  modern: {
    titleFont: 'Helvetica-Bold',
    titleSize: 13,
    titleTransform: 'none',
    bodyFont: 'Helvetica',
    bodySize: 9,
    artistFont: 'Helvetica',
    artistSize: 10,
    priceFont: 'Helvetica-Bold',
    footerFont: 'Helvetica',
    accentColor: '#000',
    dividerStyle: 'none',
  },
  // 极简风格：大量留白，小字
  minimal: {
    titleFont: 'Helvetica',
    titleSize: 11,
    titleTransform: 'uppercase',
    titleLetterSpacing: 1.5,
    bodyFont: 'Helvetica',
    bodySize: 8,
    artistFont: 'Helvetica',
    artistSize: 8,
    priceFont: 'Helvetica',
    footerFont: 'Helvetica',
    accentColor: '#666',
    dividerStyle: 'none',
  },
  // 编辑/杂志风格：大标题，戏剧感
  editorial: {
    titleFont: 'Times-BoldItalic',
    titleSize: 18,
    titleTransform: 'none',
    bodyFont: 'Helvetica',
    bodySize: 8,
    artistFont: 'Helvetica-Bold',
    artistSize: 10,
    priceFont: 'Helvetica',
    footerFont: 'Courier',
    accentColor: '#000',
    dividerStyle: 'dot',
  },
}

// ─── 基础样式 ─────────────────────────────────────────────
const baseStyles = StyleSheet.create({
  page: {
    padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    backgroundColor: '#fff',
  },
  labelCard: {
    width: '50%',
    height: '25%',
    padding: 20,
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#d0d0d0',
    borderStyle: 'dashed',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  noRightBorder: {
    borderRightWidth: 0,
  },
  dividerLine: {
    height: 0.5,
    backgroundColor: '#ccc',
    marginVertical: 6,
    width: 40,
  },
  dividerDot: {
    marginVertical: 6,
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#999',
  },
  spacer: {
    flex: 1,
  },
})

// ─── 分隔符组件 ──────────────────────────────────────────
function Divider({ style }: { style: 'line' | 'dot' | 'none' }) {
  if (style === 'line') return <View style={baseStyles.dividerLine} />
  if (style === 'dot') {
    return (
      <View style={baseStyles.dividerDot}>
        <View style={baseStyles.dot} />
        <View style={baseStyles.dot} />
        <View style={baseStyles.dot} />
      </View>
    )
  }
  return <View style={{ marginVertical: 4 }} />
}

// ─── 单个标签卡片 ─────────────────────────────────────────
function TagCard({
  submission,
  config,
  galleryName,
  isEvenColumn,
}: {
  submission: Submission
  config: typeof tagStyleConfigs[TagStyle]
  galleryName: string
  isEvenColumn: boolean
}) {
  const artwork = (typeof submission.artwork === 'object' ? submission.artwork : {}) as Artwork
  const artist = (typeof submission.artist === 'object' ? submission.artist : {}) as User

  // 优先使用 displayArtists，否则 fallback 到 artist.name / email
  const displayArtists = (submission as any).displayArtists as string[] | undefined
  const artistDisplay = displayArtists && displayArtists.length > 0
    ? displayArtists.join(', ')
    : artist.name || (artist as any).email || 'Unknown Artist'

  const formatDimensions = () => {
    const d = artwork.dimensions
    if (!d) return ''
    const parts = [d.height, d.width, d.depth].filter(Boolean).join(' × ')
    return `${parts} ${d.unit || ''}`
  }

  return (
    <View style={[baseStyles.labelCard, isEvenColumn ? baseStyles.noRightBorder : {}]}>
      {/* 弹性空间，把内容垂直居中 */}
      <View style={baseStyles.spacer} />

      {/* ① 艺术家名（最上方，加粗） */}
      <Text
        style={{
          fontFamily: config.artistFont,
          fontSize: config.artistSize,
          color: '#222',
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        {artistDisplay}
      </Text>

      {/* ② 作品名（斜体）+ 年份 同一行 */}
      <Text style={{ textAlign: 'center', marginBottom: 3 }}>
        <Text
          style={{
            fontFamily: config.titleFont,
            fontSize: config.titleSize,
            color: config.accentColor,
          }}
        >
          {artwork.title || 'Untitled'}
        </Text>
        {artwork.year && (
          <Text
            style={{
              fontFamily: config.bodyFont,
              fontSize: config.bodySize,
              color: '#555',
            }}
          >
            , {artwork.year}
          </Text>
        )}
      </Text>

      {/* ③ 材质 */}
      {artwork.medium && (
        <Text
          style={{
            fontFamily: config.bodyFont,
            fontSize: config.bodySize,
            color: '#555',
            textAlign: 'center',
            marginBottom: 1,
          }}
        >
          {artwork.medium}
        </Text>
      )}

      {/* ④ 尺寸 */}
      {artwork.dimensions && (
        <Text
          style={{
            fontFamily: config.bodyFont,
            fontSize: config.bodySize,
            color: '#555',
            textAlign: 'center',
            marginBottom: 1,
          }}
        >
          {formatDimensions()}
        </Text>
      )}

      {/* ⑤ 价格 */}
      {artwork.price && (
        <Text
          style={{
            fontFamily: config.priceFont,
            fontSize: config.bodySize + 1,
            color: config.accentColor,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          ${artwork.price.toLocaleString()}
        </Text>
      )}

      {/* 弹性空间 */}
      <View style={baseStyles.spacer} />

      {/* ⑥ 画廊名 */}
      <Text
        style={{
          fontFamily: config.footerFont,
          fontSize: 7,
          color: '#aaa',
          textTransform: 'uppercase',
          letterSpacing: 2,
          textAlign: 'center',
        }}
      >
        {galleryName}
      </Text>
    </View>
  )
}

// ─── 主组件 ───────────────────────────────────────────────
interface Props {
  submissions: Submission[]
  galleryName?: string
  tagStyle?: TagStyle
  [key: string]: any // 允许 react-pdf 传入额外 props
}

export default function ExhibitionTagsPDF({
  submissions,
  galleryName = 'CURA LAB',
  tagStyle = 'classic',
}: Props) {
  const config = tagStyleConfigs[tagStyle]
  const accepted = submissions.filter((s) => s.juryStatus === 'accepted')

  // 每页8个标签 (2列 × 4行)
  const perPage = 8
  const pages: Submission[][] = []
  for (let i = 0; i < accepted.length; i += perPage) {
    pages.push(accepted.slice(i, i + perPage))
  }

  return (
    <Document>
      {pages.map((pageSubmissions, pageIndex) => (
        <Page key={pageIndex} size="A4" style={baseStyles.page}>
          {pageSubmissions.map((sub, index) => (
            <TagCard
              key={sub.id}
              submission={sub}
              config={config}
              galleryName={galleryName}
              isEvenColumn={(index + 1) % 2 === 0}
            />
          ))}
        </Page>
      ))}
    </Document>
  )
}