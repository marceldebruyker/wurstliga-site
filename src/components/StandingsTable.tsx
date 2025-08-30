import { useEffect, useState } from 'react';
import Badge from './Badge';

type Row = { name:string; wurstliga_sum:number; kicktipp_sum_P:number; tv_sum:number; null_sum:number; sts_sum:number };

export default function StandingsTable(){
  const [rows, setRows] = useState<Row[]>([]);
  const [spielCounted, setSpielCounted] = useState<number[]>([]);

  useEffect(() => {
    const baseUrl = import.meta.env.PUBLIC_DATA_BASE_URL || 'https://marceldebruyker.github.io/wurstliga-data/season-2025-26';
    const url = `${baseUrl}/../standings.json?t=${Date.now()}`;
    fetch(url).then(r=>r.json()).then(d=>{
      setRows(d.players);
      setSpielCounted(d.spieltage_counted);
    }).catch(console.error);
  }, []);

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-3 text-sm text-zinc-400">
      {spielCounted.length > 0 ? `Daten bis Spieltag ${Math.max(...spielCounted)}` : 'Keine Daten verfügbar'}
    </div>
      <table className="w-full text-sm">
        <thead className="text-zinc-400">
          <tr className="border-b border-zinc-800">
            <th className="py-2 text-left">Rang</th>
            <th className="py-2 text-left">Name</th>
            <th className="py-2 text-right">Wurstliga</th>
            <th className="py-2 text-right">Kicktipp P</th>
            <th className="py-2 text-right">TV</th>
            <th className="py-2 text-right">NULL</th>
            <th className="py-2 text-right">STS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} className="border-b border-zinc-900/60">
              <td className="py-2 pr-4 text-zinc-400">{i+1}</td>
              <td className="py-2 pr-4">{r.name}</td>
              <td className="py-2 text-right font-semibold">{r.wurstliga_sum}</td>
              <td className="py-2 text-right">{r.kicktipp_sum_P}</td>
              <td className="py-2 text-right"><Badge tone={r.tv_sum? 'red':'zinc'}>{r.tv_sum}</Badge></td>
              <td className="py-2 text-right"><Badge tone={r.null_sum? 'red':'zinc'}>{r.null_sum}</Badge></td>
              <td className="py-2 text-right"><Badge tone={r.sts_sum? 'green':'zinc'}>{r.sts_sum}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}