import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadParticipants, type ParticipantInfo } from '../utils/data';
import Loading from '../components/Loading';

export default function ParticipantPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const [participant, setParticipant] = useState<ParticipantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    loadParticipants().then((data) => {
      setParticipant(data[id] || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Loading />;

  if (!id || !participant) {
    return (
      <div className="page-content">
        <h2>Participant not found</h2>
      </div>
    );
  }

  const totalGold = participant.results.filter((r) => r.award?.includes('Gold')).length;
  const totalSilver = participant.results.filter((r) => r.award?.includes('Silver')).length;
  const totalBronze = participant.results.filter((r) => r.award?.includes('Bronze')).length;
  const totalHM = participant.results.filter((r) => r.award?.includes('Honourable')).length;

  return (
    <div className="page-content">
      <h2>{participant.name}</h2>

      <div className="participant-summary">
        <p>
          <strong>Participations:</strong> {participant.results.length}
          {' | '}
          <strong>Gold:</strong> {totalGold}
          {' | '}
          <strong>Silver:</strong> {totalSilver}
          {' | '}
          <strong>Bronze:</strong> {totalBronze}
          {' | '}
          <strong>HM:</strong> {totalHM}
        </p>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Country</th>
            <th className="text-right">P1</th>
            <th className="text-right">P2</th>
            <th className="text-right">P3</th>
            <th className="text-right">P4</th>
            <th className="text-right">P5</th>
            <th className="text-right">P6</th>
            <th className="text-right">Total</th>
            <th className="text-right">Rank</th>
            <th>Award</th>
          </tr>
        </thead>
        <tbody>
          {participant.results
            .sort((a, b) => b.year - a.year)
            .map((r) => (
              <tr key={r.year}>
                <td>
                  <Link to={`/year_individual_r.aspx?year=${r.year}`}>{r.year}</Link>
                </td>
                <td>
                  <Link to={`/country_info.aspx?code=${r.country_code}`}>{r.country}</Link>
                </td>
                <td className="text-right">{r.p1 ?? ''}</td>
                <td className="text-right">{r.p2 ?? ''}</td>
                <td className="text-right">{r.p3 ?? ''}</td>
                <td className="text-right">{r.p4 ?? ''}</td>
                <td className="text-right">{r.p5 ?? ''}</td>
                <td className="text-right">{r.p6 ?? ''}</td>
                <td className="text-right">{r.total ?? ''}</td>
                <td className="text-right">{r.rank ?? ''}</td>
                <td>
                  <span className={`award-${r.award?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {r.award}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
