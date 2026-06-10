import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Add, Search, Image, InsertDriveFile, VideoCameraBack, Link, ContentCopy, Download, Delete, Launch } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import PageHeader from '../../../components/common/PageHeader'
import ActionFormModal from '../../../components/common/ActionFormModal'
import { formatDate } from '../../../utils'

const TYPE_ICONS = {
  Image: <Image className="text-blue-500" />,
  Document: <InsertDriveFile className="text-amber-500" />,
  Video: <VideoCameraBack className="text-rose-500" />,
  Template: <Link className="text-indigo-500" />,
}

const INITIAL_ASSETS = [
  { id: 1, name: 'Brand Guide Logo v2', type: 'Document', size: '2.4 MB', updatedBy: 'Rajesh K', date: new Date(Date.now() - 172800000).toISOString(), link: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9' },
  { id: 2, name: 'Product Hero Banner Creative', type: 'Image', size: '4.8 MB', updatedBy: 'Ananya R', date: new Date(Date.now() - 86400000).toISOString(), link: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f' },
  { id: 3, name: 'AI Co-pilot Explainer Video', type: 'Video', size: '45.2 MB', updatedBy: 'Vikram N', date: new Date(Date.now() - 259200000).toISOString(), link: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 4, name: 'Q2 Promo Newsletter HTML Layout', type: 'Template', size: '150 KB', updatedBy: 'Priya S', date: new Date(Date.now() - 43200000).toISOString(), link: 'https://raw.githubusercontent.com/mailchimp/email-blueprints/master/templates/base_template.html' },
  { id: 5, name: 'Google Ads PPC Banner Rect', type: 'Image', size: '1.2 MB', updatedBy: 'Rajesh K', date: new Date(Date.now() - 345600000).toISOString(), link: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f' },
]

export default function MarketingAssets() {
  const [assets, setAssets] = useState(INITIAL_ASSETS)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [isUploadOpen, setUploadOpen] = useState(false)

  const handleUploadAsset = (values) => {
    const newAsset = {
      id: Date.now(),
      name: values.name,
      type: values.type,
      size: values.size || '1.0 MB',
      updatedBy: 'Marketing Executive',
      date: new Date().toISOString(),
      link: values.link || 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
    }
    setAssets(prev => [newAsset, ...prev])
    setUploadOpen(false)
  }

  const handleDeleteAsset = (id) => {
    setAssets(prev => prev.filter(a => a.id !== id))
  }

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link)
    // Simple temporary alert or toast log (can be plain text dialog)
  }

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (typeFilter && asset.type !== typeFilter) return false
      if (search && !asset.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [assets, search, typeFilter])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Asset Library"
        subtitle="Manage and reference media creatives, documents, and blast templates"
        breadcrumbs={['Dashboard', 'Asset Library']}
        actions={
          <button onClick={() => setUploadOpen(true)} className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> Upload Creative Asset
          </button>
        }
      />

      <ActionFormModal
        open={isUploadOpen}
        title="Upload Creative Asset"
        subtitle="Provide asset name, category, file size and media link"
        fields={[
          { name: 'name', label: 'Asset Display Name', required: true },
          {
            name: 'type',
            label: 'Asset Category Type',
            type: 'select',
            options: ['Image', 'Document', 'Video', 'Template'].map(v => ({ value: v, label: v })),
          },
          { name: 'size', label: 'File Size (e.g. 1.2 MB)', required: true },
          { name: 'link', label: 'File Hosted Link URL (Optional)', type: 'url', fullWidth: true },
        ]}
        initialValues={{ name: '', type: 'Image', size: '', link: '' }}
        submitLabel="Add Asset"
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUploadAsset}
      />

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search asset files name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-auto min-w-[150px]">
          <option value="">All Categories</option>
          {['Image', 'Document', 'Video', 'Template'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Creative Assets Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredAssets.map((asset, i) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04 }}
              className="card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
            >
              {/* Card visual banner preview placeholder */}
              <div className="h-32 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center relative overflow-hidden">
                {asset.type === 'Image' ? (
                  <img src={asset.link} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="scale-[1.8] opacity-60">
                    {TYPE_ICONS[asset.type]}
                  </div>
                )}
                <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded font-semibold">{asset.size}</span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    {TYPE_ICONS[asset.type]}
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">{asset.type}</span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1 line-clamp-1">{asset.name}</h3>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">Uploaded by <span className="font-semibold">{asset.updatedBy}</span> on {formatDate(asset.date)}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-700/80">
                  <div className="flex items-center gap-1">
                    <Tooltip title="Copy File Link">
                      <button 
                        onClick={() => handleCopyLink(asset.link)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <ContentCopy style={{ fontSize: 16 }} />
                      </button>
                    </Tooltip>
                    {asset.link && (
                      <Tooltip title="Download / Open Live">
                        <a 
                          href={asset.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors inline-block"
                        >
                          <Launch style={{ fontSize: 16 }} />
                        </a>
                      </Tooltip>
                    )}
                  </div>
                  
                  <Tooltip title="Delete Asset">
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <Delete style={{ fontSize: 16 }} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12 text-neutral-400 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700">
          No creative assets match the search queries.
        </div>
      )}
    </div>
  )
}
