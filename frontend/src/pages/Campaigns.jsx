import TopBar from '../components/shared/TopBar'
import CampaignTable from '../components/dashboard/CampaignTable'

export default function Campaigns() {
  return (
    <div>
      <TopBar title="Campañas" subtitle="Gestión y optimización de campañas" />
      <div className="p-6">
        <CampaignTable />
      </div>
    </div>
  )
}
