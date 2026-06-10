import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { DarkMode, LightMode, Notifications, Security, Language, Palette } from '@mui/icons-material'
import { toggleTheme } from '../redux/slices/themeSlice'
import PageHeader from '../components/common/PageHeader'

const SettingRow = ({ icon, title, description, children }) => (
  <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{title}</p>
        {description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>}
      </div>
    </div>
    {children}
  </div>
)

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600'}`}
    >
      <motion.span
        animate={{ x: value ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-md"
      />
    </button>
  )
}

export default function Settings() {
  const dispatch = useDispatch()
  const { isDark } = useSelector((s) => s.theme)

  return (
    <div className="space-y-6 max-w-[700px] mx-auto">
      <PageHeader title="Settings" subtitle="Manage your CRM preferences" breadcrumbs={['Dashboard', 'Settings']} />

      {[
        {
          title: 'Appearance',
          icon: <Palette fontSize="small" />,
          items: [
            {
              icon: isDark ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />,
              title: 'Dark Mode',
              description: 'Toggle between light and dark interface',
              control: <Toggle value={isDark} onChange={() => dispatch(toggleTheme())} />,
            },
          ],
        },
        {
          title: 'Notifications',
          icon: <Notifications fontSize="small" />,
          items: [
            { icon: <Notifications fontSize="small" />, title: 'Push Notifications', description: 'Get notified about leads and meetings', control: <Toggle value={true} onChange={() => {}} /> },
            { icon: <Notifications fontSize="small" />, title: 'Email Alerts', description: 'Receive email summaries and alerts', control: <Toggle value={true} onChange={() => {}} /> },
            { icon: <Notifications fontSize="small" />, title: 'Follow-up Reminders', description: 'Reminders for scheduled follow-ups', control: <Toggle value={true} onChange={() => {}} /> },
          ],
        },
        {
          title: 'Security',
          icon: <Security fontSize="small" />,
          items: [
            { icon: <Security fontSize="small" />, title: 'Two-Factor Authentication', description: 'Add an extra layer of security', control: <Toggle value={false} onChange={() => {}} /> },
            { icon: <Security fontSize="small" />, title: 'Session Timeout', description: 'Auto-logout after 30 minutes of inactivity', control: <Toggle value={true} onChange={() => {}} /> },
          ],
        },
      ].map((section, si) => (
        <motion.div key={section.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }}
          className="card p-5">
          <h3 className="section-title mb-2">{section.title}</h3>
          {section.items.map((item) => (
            <SettingRow key={item.title} icon={item.icon} title={item.title} description={item.description}>
              {item.control}
            </SettingRow>
          ))}
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
        <h3 className="section-title mb-4">CRM Preferences</h3>
        <div className="space-y-4">
          {[
            { label: 'Default Currency', value: 'USD – US Dollar' },
            { label: 'Date Format', value: 'MMM DD, YYYY' },
            { label: 'Time Zone', value: 'Asia/Kolkata (IST)' },
            { label: 'Language', value: 'English (US)' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.label}</label>
              <select className="input-field w-auto text-sm">
                <option>{item.value}</option>
              </select>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary text-sm">Save Changes</button>
          <button className="btn-secondary text-sm">Reset Defaults</button>
        </div>
      </motion.div>
    </div>
  )
}
