import { useEffect, useMemo, useState, useRef } from 'react';

type Point = { spieltag:number; name:string; rank:number; cumWurst:number };

export default function RankEvolution(){
  const [points, setPoints] = useState<Point[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // First get metadata to see which Spieltage are available
    fetch('/season-2025-26/metadata.json')
      .then(r => r.json())
      .then(meta => {
        const availableSpieltagIds = Object.keys(meta.spieltage).map(Number).sort((a,b) => a-b);
        
        return Promise.all(
          availableSpieltagIds.map(async (n) => {
            const r = await fetch(`/season-2025-26/spieltage/${String(n).padStart(2,'0')}.json`);
            if(!r.ok) return null; 
            const d = await r.json();
            if(d.status==="not_started") return null;
            return d;
          })
        );
      }).then(all => {
        const docs = all.filter(Boolean) as any[];
        console.log('Loaded docs:', docs.length);
        
        const names = Array.from(new Set(docs.flatMap(d=>d.players.map((p:any)=>p.name))));
        console.log('Player names:', names);
        
        const cum = new Map(names.map(n=>[n,0] as const));
        const out:Point[] = [];
        docs.sort((a,b)=>a.spieltag-b.spieltag).forEach(d=>{
          d.players.forEach((p:any)=> cum.set(p.name, (cum.get(p.name)||0)+p.wurstliga_pts));
          // ranking by cumulative Wurstliga descending
          const ranking = names.slice().sort((a,b)=> (cum.get(b)||0)-(cum.get(a)||0));
          ranking.forEach((name)=>{
            out.push({ spieltag: d.spieltag, name, cumWurst: cum.get(name)!, rank: ranking.indexOf(name)+1 });
          })
        });
        
        console.log('Generated points:', out.length);
        setPlayers(names);
        setPoints(out);
        setLoading(false);
      }).catch(err => {
        console.error('Error loading chart data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const byPlayer = useMemo(()=>{
    const m = new Map<string, {x:number[], y:number[]}>();
    points.forEach(p=>{
      const obj = m.get(p.name) || {x:[], y:[]};
      obj.x.push(p.spieltag); obj.y.push(p.rank); m.set(p.name, obj);
    });
    return m;
  }, [points]);

  useEffect(() => {
    let chart: any = null;
    
    const initChart = async () => {
      if (byPlayer.size === 0) return;
      
      // Dynamic import Chart.js for client-side only
      const { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } = await import('chart.js');
      Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);
      
      const ctx = document.getElementById('rankChart') as HTMLCanvasElement | null;
      if (!ctx) return;
      
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from(new Set(points.map(p=>p.spieltag))).sort((a,b)=>a-b),
          datasets: Array.from(byPlayer.entries()).map(([name, v]) => ({
            label: name,
            data: v.y,
            tension: .2,
            pointRadius: 3
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { reverse: true, title: { display: true, text: 'Rang' }, ticks: { stepSize: 1 } },
            x: { title: { display: true, text: 'Spieltag' } }
          },
          plugins: { legend: { position: 'bottom' } }
        }
      });
    };
    
    initChart();
    
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [byPlayer, points]);

  if (loading) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <div className="text-zinc-400">Loading chart data...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }
  
  if (points.length === 0) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <div className="text-zinc-400">No data available</div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full">
      <canvas id="rankChart" />
    </div>
  );
}