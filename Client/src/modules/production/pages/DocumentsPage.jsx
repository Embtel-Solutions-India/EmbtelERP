import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Add, Search, Delete, GetApp, InsertDriveFile } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import PageHeader from '../../../components/common/PageHeader'
import ActionFormModal from '../../../components/common/ActionFormModal'
import { fetchDocuments, createDocumentAsync, deleteDocumentAsync } from '../../../redux/slices/documentSlice'
import { formatDate } from '../../../utils'

export default function DocumentsPage() {
  const dispatch = useDispatch()
  const { list: documents, loading } = useSelector((s) => s.documents)
  const { user } = useSelector((s) => s.auth)
  const [search, setSearch] = useState('')
  const [isFormOpen, setFormOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchDocuments())
  }, [dispatch])

  const filteredDocs = documents.filter((doc) => {
    const query = search.toLowerCase()
    return (
      doc.title?.toLowerCase().includes(query) ||
      doc.kind?.toLowerCase().includes(query)
    )
  })

  const handleUpload = (values) => {
    dispatch(createDocumentAsync({
      title: values.title,
      kind: values.kind,
      storageUrl: values.storageUrl || 'https://example.com/demo.pdf',
      businessId: user?.businessId,
    })).then(() => setFormOpen(false))
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      dispatch(deleteDocumentAsync(id))
    }
  }

  const documentFields = [
    { name: 'title', label: 'Document Title', required: true, fullWidth: true },
    {
      name: 'kind',
      label: 'Document Type',
      type: 'select',
      options: ['PDF', 'Word Document', 'Image/ID', 'Passport Copy', 'Sponsor Letter', 'Other'].map((v) => ({ value: v, label: v })),
      required: true,
    },
    { name: 'storageUrl', label: 'Storage Download URL', placeholder: 'https://...', required: true, fullWidth: true },
  ]

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Document Repository"
        subtitle="Upload, track, and replace client visa documentation files"
        breadcrumbs={['Dashboard', 'Documents']}
        actions={
          <button onClick={() => setFormOpen(true)} className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> Upload Document
          </button>
        }
      />

      <ActionFormModal
        open={isFormOpen}
        title="Upload Client Document"
        subtitle="Select document kind and specify stored URL copy"
        fields={documentFields}
        initialValues={{ title: '', kind: 'PDF', storageUrl: '' }}
        submitLabel="Upload"
        onClose={() => setFormOpen(false)}
        onSubmit={handleUpload}
      />

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search document title or format…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* List view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && (
          <div className="col-span-full text-center py-6 text-sm text-slate-400">Loading document vault...</div>
        )}
        {!loading && filteredDocs.length === 0 && (
          <div className="col-span-full text-center py-12 card text-slate-400">No documents found. Click upload to add one.</div>
        )}
        {!loading && filteredDocs.map((doc, i) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card p-5 hover:shadow-card-hover cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                  <InsertDriveFile style={{ fontSize: 20 }} />
                </div>
                <span className="badge badge-info text-[10px] uppercase tracking-wide font-bold">{doc.kind}</span>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">{doc.title}</h3>
              <p className="text-xs text-slate-400 mt-2">
                Uploaded by: {doc.createdBy ? `${doc.createdBy.firstName} ${doc.createdBy.lastName}` : 'System'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {doc.createdAt ? formatDate(doc.createdAt) : '—'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-gray-800">
              <Tooltip title="Download Link">
                <a
                  href={doc.storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 dark:hover:bg-gray-700 transition-colors"
                >
                  <GetApp style={{ fontSize: 16 }} />
                </a>
              </Tooltip>
              <Tooltip title="Delete Document">
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-gray-700 transition-colors"
                >
                  <Delete style={{ fontSize: 16 }} />
                </button>
              </Tooltip>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
