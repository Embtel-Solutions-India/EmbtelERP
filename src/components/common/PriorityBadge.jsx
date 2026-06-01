import { FaFire, FaThermometerHalf, FaSnowflake, FaBolt, FaArrowUp, FaArrowRight, FaArrowDown } from 'react-icons/fa'

const config = {
  hot:    { class: 'badge-error',   label: 'Hot',    Icon: FaFire           },
  warm:   { class: 'badge-warning', label: 'Warm',   Icon: FaThermometerHalf},
  cold:   { class: 'badge-info',    label: 'Cold',   Icon: FaSnowflake      },
  urgent: { class: 'badge-purple',  label: 'Urgent', Icon: FaBolt           },
  high:   { class: 'badge-error',   label: 'High',   Icon: FaArrowUp        },
  medium: { class: 'badge-warning', label: 'Medium', Icon: FaArrowRight     },
  low:    { class: 'badge-info',    label: 'Low',    Icon: FaArrowDown      },
}

export default function PriorityBadge({ priority }) {
  const c = config[priority?.toLowerCase()] || config.medium
  const { Icon } = c
  return (
    <span className={c.class}>
      <Icon style={{ fontSize: 10 }} />
      {c.label}
    </span>
  )
}
