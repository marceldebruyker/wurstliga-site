import { useEffect, useState } from 'react';

type PlayerRank = {
  spieltag: number;
  name: string;
  rank: number;
  points: number;
};

export default function SimpleRankChart() {
  const [data, setData] = useState<PlayerRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get metadata first
        const metaRes = await fetch('/season-2025-26/metadata.json');
        const meta = await metaRes.json();
        const spieltageIds = Object.keys(meta.spieltage).map(Number).sort((a,b) => a-b);
        
        console.log('Loading Spieltage:', spieltageIds);
        
        // Load all Spieltag data
        const allData: PlayerRank[] = [];
        const cumulativePoints = new Map<string, number>();
        
        for (const spieltagId of spieltageIds) {
          const res = await fetch(`/season-2025-26/spieltage/${String(spieltagId).padStart(2,'0')}.json`);
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
        
        console.log('Generated data points:', allData.length);
        setData(allData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return <div className="h-96 w-full flex items-center justify-center text-zinc-400">Loading chart...</div>;
  }

  if (data.length === 0) {
    return <div className="h-96 w-full flex items-center justify-center text-zinc-400">No data available</div>;
  }

  // Get unique players and spieltage
  const players = Array.from(new Set(data.map(d => d.name)));
  const spieltage = Array.from(new Set(data.map(d => d.spieltag))).sort((a,b) => a-b);
  
  // Create SVG chart
  const width = 800;
  const height = 300;
  const margin = { top: 20, right: 120, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const maxRank = Math.max(...data.map(d => d.rank));
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280', '#14b8a6', '#f43f5e', '#8b5cf6'];

  return (
    <div className="h-96 w-full overflow-x-auto">
      <svg width={width} height={height} className="bg-zinc-900 rounded-lg">
        {/* Grid lines */}
        {spieltage.map(st => {
          const x = margin.left + ((st - spieltage[0]) / (spieltage[spieltage.length - 1] - spieltage[0])) * chartWidth;
          return (
            <line
              key={st}
              x1={x}
              y1={margin.top}
              x2={x}
              y2={margin.top + chartHeight}
              stroke="#374151"
              strokeWidth={1}
            />
          );
        })}
        
        {/* Rank lines */}
        {Array.from({length: maxRank}, (_, i) => i + 1).map(rank => {
          const y = margin.top + ((rank - 1) / (maxRank - 1)) * chartHeight;
          return (
            <line
              key={rank}
              x1={margin.left}
              y1={y}
              x2={margin.left + chartWidth}
              y2={y}
              stroke="#374151"
              strokeWidth={1}
            />
          );
        })}
        
        {/* Player lines */}
        {players.map((player, playerIndex) => {
          const playerData = data.filter(d => d.name === player).sort((a, b) => a.spieltag - b.spieltag);
          const color = colors[playerIndex % colors.length];
          
          const pathData = playerData.map((point, index) => {
            const x = margin.left + ((point.spieltag - spieltage[0]) / (spieltage[spieltage.length - 1] - spieltage[0])) * chartWidth;
            const y = margin.top + ((point.rank - 1) / (maxRank - 1)) * chartHeight;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');
          
          return (
            <g key={player}>
              <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth={2}
                className="hover:stroke-4"
              />
              {playerData.map(point => {
                const x = margin.left + ((point.spieltag - spieltage[0]) / (spieltage[spieltage.length - 1] - spieltage[0])) * chartWidth;
                const y = margin.top + ((point.rank - 1) / (maxRank - 1)) * chartHeight;
                return (
                  <circle
                    key={`${player}-${point.spieltag}`}
                    cx={x}
                    cy={y}
                    r={3}
                    fill={color}
                  />
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
          const x = margin.left + ((st - spieltage[0]) / (spieltage[spieltage.length - 1] - spieltage[0])) * chartWidth;
          return (
            <text
              key={st}
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
        {Array.from({length: Math.min(maxRank, 8)}, (_, i) => i + 1).map(rank => {
          const y = margin.top + ((rank - 1) / (maxRank - 1)) * chartHeight;
          return (
            <text
              key={rank}
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
        
        {/* Legend */}
        {players.slice(0, 8).map((player, index) => {
          const color = colors[index % colors.length];
          return (
            <g key={player}>
              <line
                x1={margin.left + chartWidth + 10}
                y1={margin.top + index * 20 + 10}
                x2={margin.left + chartWidth + 25}
                y2={margin.top + index * 20 + 10}
                stroke={color}
                strokeWidth={2}
              />
              <text
                x={margin.left + chartWidth + 30}
                y={margin.top + index * 20 + 14}
                fill="#d1d5db"
                fontSize="11"
              >
                {player.length > 12 ? player.substring(0, 12) + '...' : player}
              </text>
            </g>
          );
        })}
        
        {/* Axis labels */}
        <text x={margin.left + chartWidth/2} y={height - 5} textAnchor="middle" fill="#9ca3af" fontSize="14">Spieltag</text>
        <text x={15} y={margin.top + chartHeight/2} textAnchor="middle" fill="#9ca3af" fontSize="14" transform={`rotate(-90 15 ${margin.top + chartHeight/2})`}>Rang</text>
      </svg>
    </div>
  );
}