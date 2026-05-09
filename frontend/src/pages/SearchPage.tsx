import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadParticipants, type ParticipantInfo } from '../utils/data';
import Loading from '../components/Loading';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [participants, setParticipants] = useState<Record<string, ParticipantInfo>>({});
  const [loading, setLoading] = useState(true);

  const query = searchParams.get('name') || '';

  useEffect(() => {
    loadParticipants().then((data) => {
      setParticipants(data);
      setLoading(false);
    });
  }, []);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return Object.values(participants)
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 200);
  }, [query, participants]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('name') as HTMLInputElement;
    setSearchParams({ name: input.value });
  }

  if (loading) return <Loading />;

  return (
    <div className="page-content">
      <h2>Search Participants</h2>
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-input-group">
          <label htmlFor="search-name">Name</label>
          <input
            id="search-name"
            name="name"
            type="text"
            className="search-input"
            defaultValue={query}
            placeholder="Enter participant name..."
            autoFocus
          />
        </div>
        <button type="submit" className="search-btn">Search</button>
      </form>

      {query && query.length >= 2 && (
        <>
          <p className="page-subtitle">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
          {results.length > 0 && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Participations</th>
                    <th>Years</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 0 ? 'even' : 'odd'}>
                      <td>
                        <Link to={`/participant_r.aspx?id=${p.id}`}>{p.name}</Link>
                      </td>
                      <td className="text-right">{p.results.length}</td>
                      <td>
                        {p.results.map((r) => r.year).sort().join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
