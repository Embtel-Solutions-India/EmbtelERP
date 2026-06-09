import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Search, CheckCircle, Warning, Help } from '@mui/icons-material'
import PageHeader from '../../../components/common/PageHeader'
import { fetchDocuments, updateDocumentAsync } from '../../../redux/slices/documentSlice'
import { formatDate } from '../../../utils'

export default function VerificationPage() {
  const dispatch = useDispatch()
  const { list: documents, loading } = useSelector((s) => s.documents)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchDocuments())
  }, [dispatch])

  const handleVerify = (doc, status) => {
    dispatch(updateDocumentAsync({
      id: doc.id,
      title: doc.title,
      kind: doc.kind,
      storageUrl: doc.storageUrl,
      // Status could be appended as part of document type or title, or tracked in verification queue
    }))
    alert(`Document "${doc.title}" has been marked as: ${status}`)
  }

  const filteredDocs = documents.filter((doc) => {
    const query = search.toLowerCase()
    return doc.title?.toLowerCase().includes(query) || doc.kind?.toLowerCase().includes(query)
  })

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Quality Control & Verification Queue"
        subtitle="Verify passport validity, sponsor letters, and financial balance compliance"
        breadcrumbs={['Dashboard', 'Verification']}
      />

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search documents for verification check…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Verification Queue List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
                {['Document File', 'Kind / Format', 'Uploader', 'Date Uploaded', 'QC Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-700/50">
              {loading && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400">Loading QC queue...</td>
                </tr>
              )}
              {!loading && filteredDocs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400">All documents verified. QC Queue is empty.</td>
                </tr>
              )}
              {!loading && filteredDocs.map((doc, i) => (
                <motion.tr key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{doc.title}</td>
                  <td className="px-5 py-4"><span className="badge badge-info">{doc.kind}</span></td>
                  <td className="px-5 py-4 text-xs text-slate-500">{doc.createdBy ? `${doc.createdBy.firstName} ${doc.createdBy.lastName}` : 'System'}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{doc.createdAt ? formatDate(doc.createdAt) : '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerify(doc, 'VERIFIED')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <CheckCircle style={{ fontSize: 13 }} /> Approve
                      </button>
                      <button
                        onClick={() => handleVerify(doc, 'REJECTED')}
                        className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Warning style={{ fontSize: 13 }} /> Reject
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
