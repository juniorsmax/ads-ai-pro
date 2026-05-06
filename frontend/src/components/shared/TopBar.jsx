import AccountSwitcher from './AccountSwitcher'

export default function TopBar({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <AccountSwitcher />
        {actions}
      </div>
    </div>
  )
}
