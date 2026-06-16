import SupportSidebar from '../SupportSidebar/SupportSidebar'
import Header from '../Header/Header'
import './SupportLayout.scss'

function SupportLayout({ title, children }) {
  return (
    <div className="support-layout">
      <SupportSidebar />
      <Header title={title} />
      <main className="support-layout__content">
        {children}
      </main>
    </div>
  )
}

export default SupportLayout
