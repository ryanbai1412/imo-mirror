import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TimelinePage from './pages/TimelinePage';
import CountriesPage from './pages/CountriesPage';
import CountryInfoPage from './pages/CountryInfoPage';
import YearInfoPage from './pages/YearInfoPage';
import YearCountryResultsPage from './pages/YearCountryResultsPage';
import YearIndividualResultsPage from './pages/YearIndividualResultsPage';
import YearStatisticsPage from './pages/YearStatisticsPage';
import ParticipantPage from './pages/ParticipantPage';
import HallOfFamePage from './pages/HallOfFamePage';
import ProblemsPage from './pages/ProblemsPage';
import ResultsPage from './pages/ResultsPage';
import ResultsMatrixPage from './pages/ResultsMatrixPage';
import ResultsCountryPage from './pages/ResultsCountryPage';
import ResultsYearPage from './pages/ResultsYearPage';
import SearchPage from './pages/SearchPage';
import CountryHallPage from './pages/CountryHallPage';
import CountryIndividualResultsPage from './pages/CountryIndividualResultsPage';
import CountryTeamResultsPage from './pages/CountryTeamResultsPage';
import StaticPage from './pages/StaticPage';

import './styles.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="site-wrapper">
        <Header />
        <main className="site-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/default.aspx" element={<HomePage />} />

            {/* Timeline - original uses organizers.aspx */}
            <Route path="/organizers.aspx" element={<TimelinePage />} />
            <Route path="/timeline.aspx" element={<TimelinePage />} />

            {/* Countries - original uses countries.aspx */}
            <Route path="/countries.aspx" element={<CountriesPage />} />
            <Route path="/country_team.aspx" element={<CountriesPage />} />

            <Route path="/country_info.aspx" element={<CountryInfoPage />} />
            <Route path="/year_info.aspx" element={<YearInfoPage />} />
            <Route path="/year_country_r.aspx" element={<YearCountryResultsPage />} />
            <Route path="/year_individual_r.aspx" element={<YearIndividualResultsPage />} />
            <Route path="/year_statistics.aspx" element={<YearStatisticsPage />} />
            <Route path="/participant_r.aspx" element={<ParticipantPage />} />

            {/* Hall of Fame - original uses hall.aspx */}
            <Route path="/hall.aspx" element={<HallOfFamePage />} />
            <Route path="/hall_of_fame.aspx" element={<HallOfFamePage />} />

            <Route path="/problems.aspx" element={<ProblemsPage />} />
            <Route path="/results.aspx" element={<ResultsPage />} />
            <Route path="/results_matrix.aspx" element={<ResultsMatrixPage />} />
            <Route path="/results_country.aspx" element={<ResultsCountryPage />} />
            <Route path="/results_year.aspx" element={<ResultsYearPage />} />

            {/* New pages */}
            <Route path="/search.aspx" element={<SearchPage />} />
            <Route path="/country_hall.aspx" element={<CountryHallPage />} />
            <Route path="/country_individual_r.aspx" element={<CountryIndividualResultsPage />} />
            <Route path="/country_team_r.aspx" element={<CountryTeamResultsPage />} />
            <Route path="/team_r.aspx" element={<YearCountryResultsPage />} />

            {/* Static content pages */}
            <Route path="/general.aspx" element={<StaticPage pageKey="general" />} />
            <Route path="/links.aspx" element={<StaticPage pageKey="links" />} />
            <Route path="/advisory.aspx" element={<StaticPage pageKey="advisory" />} />
            <Route path="/ethics.aspx" element={<StaticPage pageKey="ethics" />} />
            <Route path="/documents.aspx" element={<StaticPage pageKey="documents" />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="page-content">
      <h2>Page Not Found</h2>
      <p>The requested page does not exist.</p>
    </div>
  );
}
