// src/components/TagPdfDownload.tsx
// Lazy-loaded wrapper: keeps the heavy @react-pdf/renderer out of the main bundle.
import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Printer } from 'lucide-react'
import ExhibitionTagsPDF, { TAG_STYLE_LABELS, type TagStyle } from '../views/ExhibitionTagsPDF'
import type { Submission } from '../../../payload-project/src/payload-types'

type Props = {
  submissions: Submission[]
  galleryName?: string | null
  exhibitionTitle: string
}
export default function TagPdfDownload({ submissions, galleryName, exhibitionTitle }: Props) {
  const [tagStyle, setTagStyle] = useState<TagStyle>('classic')

  if (submissions.length === 0) return null

  const pdfDocument = (
    <ExhibitionTagsPDF
      submissions={submissions}
      galleryName={galleryName ?? undefined}
      tagStyle={tagStyle}
    />
  )

  return (
    <div className="flex items-center gap-2">
      <select
        value={tagStyle}
        onChange={e => setTagStyle(e.target.value as TagStyle)}
        className="bg-neutral-50 border border-neutral-300 text-sm font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-ink/30 outline-none cursor-pointer text-neutral-700"
      >
        {(Object.keys(TAG_STYLE_LABELS) as TagStyle[]).map(key => (
          <option key={key} value={key}>{TAG_STYLE_LABELS[key]}</option>
        ))}
      </select>

      <PDFDownloadLink
        document={pdfDocument}
        fileName={`${exhibitionTitle.replace(/\s+/g, '_')}_Tags_${tagStyle}.pdf`}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
      >
        {({ loading: pdfLoading }) => (
          <>
            <Printer className="w-4 h-4" />
            {pdfLoading ? 'Generating...' : 'Print Tags'}
          </>
        )}
      </PDFDownloadLink>
    </div>
  )
}
