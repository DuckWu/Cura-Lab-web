// src/views/ExhibitionTagsPDF.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Submission, Artwork, User } from '../../../payload-project/src/payload-types'

// 注册字体 (可选：为了更好看的英文衬线体，或者你可以注册中文字体)
// 这里暂时使用默认字体，如果需要中文支持需要单独加载 .ttf 字体文件
// Font.register({ family: 'NotoSansSC', src: '/fonts/NotoSansSC-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start', // 确保从顶部开始排列
  },
  // 每个标签卡片 (8个一页 -> 宽度50%，高度25%)
  labelCard: {
    width: '50%',
    height: '25%', // A4 高度大约可以放4排
    padding: 15,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5', // 浅灰色虚线方便裁剪
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  // 最后一列不需要右边框 (可选优化)
  noRightBorder: {
    borderRightWidth: 0,
  },
  // 艺术家名字 (大且加粗)
  artistName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold', // 使用内置加粗字体
  },
  // 作品信息块
  artworkInfo: {
    marginTop: 4,
  },
  // 作品标题 (斜体)
  title: {
    fontSize: 12,
    fontFamily: 'Helvetica-Oblique', // 使用内置斜体
    marginBottom: 2,
  },
  // 材质和年份
  details: {
    fontSize: 10,
    color: '#444',
    marginBottom: 2,
  },
  // 价格
  price: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  // 展签底部的画廊名字 (小字)
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 15,
    fontSize: 8,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
})

type Props = {
  submissions: Submission[]
  galleryName?: string
}

export default function ExhibitionTagsPDF({ submissions, galleryName }: Props) {
  // 只渲染状态为 accepted 的作品
  const acceptedSubmissions = submissions.filter(s => s.juryStatus === 'accepted')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {acceptedSubmissions.map((sub, index) => {
          const artwork = sub.artwork as Artwork
          const artist = sub.artist as User
          
          // 判断是否是偶数列（用于去掉右边框，美观考虑）
          const isEvenColumn = (index + 1) % 2 === 0

          return (
            <View key={sub.id} style={[styles.labelCard, isEvenColumn ? { borderRightWidth: 0 } : {}]}>
              {/* Artist Name */}
              <Text style={styles.artistName}>
                {artist.name || 'Unknown Artist'}
              </Text>

              {/* Artwork Details */}
              <View style={styles.artworkInfo}>
                <Text>
                  <Text style={styles.title}>{artwork.title || 'Untitled'}</Text>
                  <Text style={styles.details}>, {artwork.year}</Text>
                </Text>
                
                <Text style={styles.details}>{artwork.medium}</Text>
                
                <Text style={styles.details}>
                  {artwork.dimensions?.height} x {artwork.dimensions?.width} {artwork.dimensions?.depth ? `x ${artwork.dimensions.depth}` : ''} {artwork.dimensions?.unit}
                </Text>

                {artwork.price && (
                  <Text style={styles.price}>${artwork.price.toLocaleString()}</Text>
                )}
              </View>

              {/* Gallery Branding */}
              <Text style={styles.footer}>{galleryName || 'CURA LAB'}</Text>
            </View>
          )
        })}
      </Page>
    </Document>
  )
}