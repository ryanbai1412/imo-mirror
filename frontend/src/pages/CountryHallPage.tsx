import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  loadParticipants,
  loadCountries,
  type Country,
} from '../utils/data';
import { sortData, parseSortParams } from '../utils/sort';
import SortableTable, { type Column } from '../components/SortableTable';
import Loading from '../components/Loading';

const COLUMNS: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'participations', label: 'Part.', align: 'right' },
  { key: 'gold', label: 'G', align: 'right' },
  { key: 'silver', label: 'S', align: 'right' },
  { key: 'bronze', label: 'B', align: 'right' },
  { key: 'hm', label: 'HM', align: 'right' },
  { key: 'total_medals', label: 'Total', align: 'right' },
];

interface HallRow {
  id: number;
  name: string;
  participations: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  total_medals: number;
}

export default function CountryHallPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const [country, setCountry] = useState<Country | null>(null);
  const [rows, setRows] = useState<HallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { column, order } = parseSortParams(searchParams);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    Promise.all([loadParticipants(), loadCountries()]).then(([participants, countries]) => {
      setCountry(countries.find((c) => c.code === code) || null);
      const hallMap = new Map<number, HallRow>();
      for (const p of Object.values(participants)) {
        for (const r of p.results) {
          if (r.country_code !== code) continue;
          let entry = hallMap.get(p.id);
          if (!entry) {
            entry = { id: p.id, name: p.name, participations: 0, gold: 0, silver: 0, bronze: 0, hm: 0, total_medals: 0 };
            hallMap.set(p.id, entry);
          }
          entry.participations++;
          const award = (r.award || '').toLowerCase();
          if (award.includes('gold')) entry.gold++;
          else if (award.includes('silver')) entry.silver++;
          else if (award.includes('bronze')) entry.bronze++;
          else if (award.includes('honourable') || award.includes('hm')) entry.hm++;
          entry.total_medals = entry.gold + entry.silver + entry.bronze + entry.hm;
        }
      }
      const sorted = Array.from(hallMap.values()).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);
      setRows(sorted);
      setLoading(false);
    });
  }, [code]);

  const sortedRows = useMemo(() => {
    return column ? sortData(rows, column, order) : rows;
  }, [rows, column, order]);

  if (loading) return <Loading />;
  if (!code) return <div className="page-content"><h2>Please specify a country code</h2></div>;

  return (
    <div className="page-content">
      <h2>
        {country?.flag_url && (
          <img src={`https://www.imo-official.org/${country.flag_url}`} alt={code} className="country-flag-large" />
        )}
        {country?.name || code} &mdash; Hall of Fame
      </h2>
      <p className="page-subtitle">{rows.length} participants with awards</p>
      <div className="table-container">
        <SortableTable
          columns={COLUMNS}
          data={sortedRows as unknown as Record<string, unknown>[]}
          currentSort={column}
          currentOrder={order}
          renderCell={(row, col) => {
            const entry = row as unknown as HallRow;
            if (col.key === 'name') {
              return <Link to={`/participant_r.aspx?id=${entry.id}`}>{entry.name}</Link>;
            }
            if (col.key === 'gold' && entry.gold > 0) return <span className="award-gold-medal">{entry.gold}</span>;
            if (col.key === 'silver' && entry.silver > 0) return <span className="award-silver-medal">{entry.silver}</span>;
            if (col.key === 'bronze' && entry.bronze > 0) return <span className="award-bronze-medal">{entry.bronze}</span>;
            if (col.key === 'hm' && entry.hm > 0) return <span className="award-honourable-mention">{entry.hm}</span>;
            const val = row[col.key];
            return val != null ? String(val) : '';
          }}
          rowKey={(row) => String((row as unknown as HallRow).id)}
        />
      </div>
    </div>
  );
}
