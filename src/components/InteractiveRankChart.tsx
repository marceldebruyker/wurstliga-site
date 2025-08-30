import { useEffect, useState, useMemo } from 'react';

type PlayerRank = {
  spieltag: number;
  name: string;
  rank: number;
  points: number;
};

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6', 
  '#f43f5e', '#a855f7', '#fb7185', '#34d399', '#fbbf24',
  '#c084fc', '#60a5fa', '#f87171', '#4ade80', '#facc15',
  '#a78bfa', '#38bdf8', '#fb923c', '#ff6b9d', '#22d3ee'
];

export default function InteractiveRankChart() {
  const [data, setData] = useState<PlayerRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'random' | 'top5' | 'all' | 'none'>('random');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get metadata first
        const baseUrl = import.meta.env.PUBLIC_DATA_BASE_URL || 'https://marceldebruyker.github.io/wurstliga-data/season-2025-26';
        const metaRes = await fetch(`${baseUrl}/metadata.json?t=${Date.now()}`);
        const meta = await metaRes.json();
        const spieltageIds = Object.keys(meta.spieltage).map(Number).sort((a,b) => a-b);
        
        // Load all Spieltag data
        const allData: PlayerRank[] = [];
        const cumulativePoints = new Map<string, number>();
        
        for (const spieltagId of spieltageIds) {
          const res = await fetch(`${baseUrl}/spieltage/${String(spieltagId).padStart(2,'0')}.json?t=${Date.now()}`);
          if (!res.ok) continue;
          
          const spieltagData = await res.json();
          if (spieltagData.status === 'not_started') continue;
          
          // Update cumulative points
          spieltagData.players.forEach((p: any) => {
            const current = cumulativePoints.get(p.name) || 0;
            cumulativePoints.set(p.name, current + p.wurstliga_pts);
          });
          
          // Create ranking for this Spieltag
          const sortedPlayers = Array.from(cumulativePoints.entries())
            .sort((a, b) => b[1] - a[1]);
          
          sortedPlayers.forEach(([name, points], index) => {
            allData.push({
              spieltag: spieltagId,
              name,
              rank: index + 1,
              points
            });
          });
        }
        
        const players = Array.from(new Set(allData.map(d => d.name)));
        setAllPlayers(players);
        
        // Show 5 random players by default
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        setSelectedPlayers(new Set(shuffled.slice(0, 5)));
        setData(allData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const togglePlayer = (playerName: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerName)) {
      newSelected.delete(playerName);
    } else {
      newSelected.add(playerName);
    }
    setSelectedPlayers(newSelected);
    setSelectionMode('none'); // Reset to none when manually toggling
  };

  const selectRandom = () => {
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
    setSelectedPlayers(new Set(shuffled.slice(0, 5)));
    setSelectionMode('random');
  };

  const selectAll = () => {
    setSelectedPlayers(new Set(allPlayers));
    setSelectionMode('all');
  };

  const selectNone = () => {
    setSelectedPlayers(new Set());
    setSelectionMode('none');
  };

  const selectTop5 = () => {
    // Get final standings to determine top 5
    const finalRanks = data.filter(d => {
      const maxSpieltag = Math.max(...data.map(x => x.spieltag));
      return d.spieltag === maxSpieltag;
    }).sort((a, b) => a.rank - b.rank);
    
    setSelectedPlayers(new Set(finalRanks.slice(0, 5).map(d => d.name)));
    setSelectionMode('top5');
  };

  const filteredData = useMemo(() => {
    return data.filter(d => selectedPlayers.has(d.name));
  }, [data, selectedPlayers]);

  if (loading) {
    return <div className="h-96 w-full flex items-center justify-center text-zinc-400">Loading chart...</div>;
  }

  if (data.length === 0) {
    return <div className="h-96 w-full flex items-center justify-center text-zinc-400">No data available</div>;
  }

  const spieltage = Array.from(new Set(data.map(d => d.spieltag))).sort((a,b) => a-b);
  const maxRank = Math.max(...data.map(d => d.rank));
  
  // Fixed dimensions for SVG viewBox (will scale responsively)
  const width = 700;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  return (
    <div className="space-y-4">
      {/* Player Selection Controls */}
      <div className="bg-zinc-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <h3 className="text-sm font-medium text-zinc-200">Spieler auswählen:</h3>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={selectRandom}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectionMode === 'random' 
                  ? 'bg-brand text-white' 
                  : 'bg-zinc-600 text-white hover:bg-zinc-500'
              }`}
            >
              Random
            </button>
            <button 
              onClick={selectTop5}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectionMode === 'top5' 
                  ? 'bg-brand text-white' 
                  : 'bg-zinc-600 text-white hover:bg-zinc-500'
              }`}
            >
              Top 5
            </button>
            <button 
              onClick={selectAll}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectionMode === 'all' 
                  ? 'bg-brand text-white' 
                  : 'bg-zinc-600 text-white hover:bg-zinc-500'
              }`}
            >
              Alle
            </button>
            <button 
              onClick={selectNone}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectionMode === 'none' 
                  ? 'bg-brand text-white' 
                  : 'bg-zinc-600 text-white hover:bg-zinc-500'
              }`}
            >
              Keine
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {allPlayers.map((player, index) => {
            const color = COLORS[index % COLORS.length];
            const isSelected = selectedPlayers.has(player);
            
            return (
              <label 
                key={player}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  isSelected ? 'bg-zinc-700' : 'hover:bg-zinc-750'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePlayer(player)}
                  className="rounded"
                />
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-zinc-200 truncate">{player}</span>
              </label>
            );
          })}
        </div>
        
        <div className="text-xs text-zinc-400 mt-2">
          {selectedPlayers.size} von {allPlayers.length} Spielern ausgewählt
        </div>
      </div>

      {/* Chart */}
      <div className="bg-zinc-800 rounded-lg p-4 overflow-x-auto">
        {selectedPlayers.size === 0 ? (
          <div className="h-96 flex items-center justify-center text-zinc-400">
            Wähle Spieler aus, um deren Rangentwicklung zu sehen
          </div>
        ) : (
          <svg 
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-w-full bg-zinc-900 rounded"
            style={{ minHeight: '300px', maxHeight: '500px' }}
          >
            {/* Grid lines */}
            {spieltage.map(st => {
              const spieltagRange = spieltage[spieltage.length - 1] - spieltage[0];
              const x = margin.left + (spieltagRange === 0 ? chartWidth / 2 : ((st - spieltage[0]) / spieltagRange) * chartWidth);
              return (
                <line
                  key={`grid-${st}`}
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + chartHeight}
                  stroke="#374151"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
              );
            })}
            
            {Array.from({length: maxRank}, (_, i) => i + 1).map(rank => {
              const y = margin.top + ((rank - 1) / (maxRank - 1)) * chartHeight;
              return (
                <line
                  key={`rank-${rank}`}
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + chartWidth}
                  y2={y}
                  stroke="#374151"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
              );
            })}
            
            {/* Player lines */}
            {Array.from(selectedPlayers).map((player, playerIndex) => {
              const playerData = filteredData.filter(d => d.name === player).sort((a, b) => a.spieltag - b.spieltag);
              const playerColorIndex = allPlayers.indexOf(player);
              const color = COLORS[playerColorIndex % COLORS.length];
              
              if (playerData.length === 0) return null;
              
              const pathData = playerData.map((point, index) => {
                const spieltagRange = spieltage[spieltage.length - 1] - spieltage[0];
                const x = margin.left + (spieltagRange === 0 ? chartWidth / 2 : ((point.spieltag - spieltage[0]) / spieltagRange) * chartWidth);
                const y = margin.top + ((point.rank - 1) / (maxRank - 1)) * chartHeight;
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ');
              
              return (
                <g key={player}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.5}
                    className="hover:stroke-4"
                    style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }}
                  />
                  {playerData.map(point => {
                    const spieltagRange = spieltage[spieltage.length - 1] - spieltage[0];
                    const x = margin.left + (spieltagRange === 0 ? chartWidth / 2 : ((point.spieltag - spieltage[0]) / spieltagRange) * chartWidth);
                    const y = margin.top + ((point.rank - 1) / (maxRank - 1)) * chartHeight;
                    return (
                      <g key={`${player}-${point.spieltag}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r={4}
                          fill={color}
                          stroke="#1f2937"
                          strokeWidth={1}
                        />
                        <title>{`${player}: Rang ${point.rank} (${point.points} Pkt.) - Spieltag ${point.spieltag}`}</title>
                      </g>
                    );
                  })}
                </g>
              );
            })}
            
            {/* Axes */}
            <line x1={margin.left} y1={margin.top + chartHeight} x2={margin.left + chartWidth} y2={margin.top + chartHeight} stroke="#9ca3af" strokeWidth={2}/>
            <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + chartHeight} stroke="#9ca3af" strokeWidth={2}/>
            
            {/* X-axis labels */}
            {spieltage.map(st => {
              const spieltagRange = spieltage[spieltage.length - 1] - spieltage[0];
              const x = margin.left + (spieltagRange === 0 ? chartWidth / 2 : ((st - spieltage[0]) / spieltagRange) * chartWidth);
              return (
                <text
                  key={`x-${st}`}
                  x={x}
                  y={margin.top + chartHeight + 20}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize="12"
                >
                  {st}
                </text>
              );
            })}
            
            {/* Y-axis labels */}
            {Array.from({length: maxRank}, (_, i) => i + 1).map(rank => {
              const y = margin.top + ((rank - 1) / (maxRank - 1)) * chartHeight;
              return (
                <text
                  key={`y-${rank}`}
                  x={margin.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize="12"
                >
                  {rank}
                </text>
              );
            })}
            
            {/* Axis labels */}
            <text x={margin.left + chartWidth/2} y={height - 5} textAnchor="middle" fill="#9ca3af" fontSize="14">Spieltag</text>
            <text x={15} y={margin.top + chartHeight/2} textAnchor="middle" fill="#9ca3af" fontSize="14" transform={`rotate(-90 15 ${margin.top + chartHeight/2})`}>Rang</text>
          </svg>
        )}
      </div>
    </div>
  );
}