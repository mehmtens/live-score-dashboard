import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import CompetitionTabs from './components/CompetitionTabs'
import Header from './components/Header'
import MatchDetail from './components/MatchDetail'
import MatchList from './components/MatchList'
import { getCompetitionList, groupByCompetition, isLive } from './lib/matchUtils'

// Backend WebSocket sunucumuza bağlanıyoruz.
// Yerelde çalışırken .env yoksa localhost:5000'e bağlanır; deploy ettiğinde
// .env dosyasına VITE_SOCKET_URL=https://senin-backend-adresin şeklinde
// gerçek adresi yazman yeterli.
const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000')

export default function App() {
  const [matches, setMatches] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [activeTab, setActiveTab] = useState('TÜMÜ')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    // İlk yüklemede Redis'ten gelen veri
    const handleInitial = (data) => {
      setMatches(data)
      setSelectedId((current) => current ?? data[0]?.id ?? null)
    }

    // Her güncellemede gelen canlı veri
    const handleUpdate = (data) => setMatches(data)

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('initialMatches', handleInitial)
    socket.on('matchUpdate', handleUpdate)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('initialMatches', handleInitial)
      socket.off('matchUpdate', handleUpdate)
    }
  }, [])

  const competitions = useMemo(() => getCompetitionList(matches), [matches])

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLowerCase()

    return matches.filter((match) => {
      const matchesTab = activeTab === 'TÜMÜ' || match.competition === activeTab
      const matchesSearch =
        !query ||
        match.homeTeam?.toLowerCase().includes(query) ||
        match.awayTeam?.toLowerCase().includes(query)
      return matchesTab && matchesSearch
    })
  }, [matches, activeTab, search])

  const groups = useMemo(() => groupByCompetition(filteredMatches), [filteredMatches])

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedId) ?? null,
    [matches, selectedId]
  )

  const liveMatch = selectedMatch && isLive(selectedMatch) ? selectedMatch : null

  return (
    <div className="min-h-screen bg-ink font-sans text-text">
      <Header
        isConnected={isConnected}
        matchCount={matches.length}
        search={search}
        onSearchChange={setSearch}
        liveMatch={liveMatch}
      />
      <CompetitionTabs competitions={competitions} active={activeTab} onChange={setActiveTab} />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-8 lg:grid-cols-12">
        <section className="no-scrollbar lg:col-span-5 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
          <MatchList groups={groups} selectedId={selectedId} onSelect={(match) => setSelectedId(match.id)} />
        </section>

        <section className="lg:col-span-7">
          <MatchDetail match={selectedMatch} />
        </section>
      </main>
    </div>
  )
}
