import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { FaLinkedin, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa'
import SectionCard from '../../../components/common/SectionCard'

const data = [
  { name: 'LinkedIn',  value: 45, color: '#0a66c2' },
  { name: 'Twitter/X',  value: 25, color: '#0f1419' },
  { name: 'Instagram', value: 20, color: '#e1306c' },
  { name: 'YouTube',   value: 10, color: '#ff0000' },
]

const STATS = [
  { label: 'LinkedIn Followers',    value: '24.5k', Icon: FaLinkedin,  color: 'text-[#0a66c2]' },
  { label: 'Twitter/X Followers',   value: '15.2k', Icon: FaTwitter,   color: 'text-[#1d9bf0]' },
  { label: 'Instagram Followers',   value: '18.9k', Icon: FaInstagram, color: 'text-[#e1306c]' },
  { label: 'YouTube Subscribers',   value: '5.6k',  Icon: FaYoutube,   color: 'text-[#ff0000]' },
]

export default function MarketingSocialEngagement() {
  return (
    <SectionCard title="Social Channel Share" subtitle="Followers & engagement split" delay={0.2}>
      <div className="flex items-center gap-4">
        <div style={{ width: 120, height: 160 }} className="flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={3}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2.5">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <s.Icon className={s.color} size={14} />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</span>
              </div>
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{s.value}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
            {d.name} ({d.value}%)
          </span>
        ))}
      </div>
    </SectionCard>
  )
}
