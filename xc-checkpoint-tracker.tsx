import React, { useState, useEffect, useRef } from 'react';
import { Play, Users, Clock, Trophy, Plus } from 'lucide-react';

export default function CheckpointTracker() {
  const [race, setRace] = useState('men'); // 'men' or 'women'
  const [athletes, setAthletes] = useState([]);
  const [checkpoints, setCheckpoints] = useState({});
  const [bibInput, setBibInput] = useState('');
  const [currentCheckpoint, setCurrentCheckpoint] = useState(1);
  const [setupMode, setSetupMode] = useState(true);
  const [athleteInput, setAthleteInput] = useState('');
  const inputRef = useRef(null);

  const numCheckpoints = race === 'men' ? 4 : 3;

  useEffect(() => {
    if (!setupMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [setupMode, currentCheckpoint]);

  const parseAthleteData = (text) => {
    const lines = text.trim().split('\n');
    const parsed = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.toLowerCase().includes('bib')) continue;
      
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        parsed.push({
          bib: parts[0],
          name: parts[1],
          startTime: parts[2]
        });
      }
    }
    return parsed;
  };

  const loadAthletes = () => {
    const parsed = parseAthleteData(athleteInput);
    if (parsed.length > 0) {
      setAthletes(parsed);
      setSetupMode(false);
    }
  };

  const parseTime = (timeStr) => {
    const parts = timeStr.split(':').map(p => parseInt(p));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatGap = (seconds) => {
    if (seconds === 0) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `+${m}:${s.toString().padStart(2, '0')}`;
  };

  const recordCheckpoint = () => {
    const bib = bibInput.trim();
    if (!bib) return;

    const athlete = athletes.find(a => a.bib === bib);
    if (!athlete) {
      alert(`Bib ${bib} not found`);
      setBibInput('');
      return;
    }

    const now = new Date();
    const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    setCheckpoints(prev => ({
      ...prev,
      [bib]: {
        ...prev[bib],
        [currentCheckpoint]: currentTime
      }
    }));

    setBibInput('');
  };

  const calculateResults = () => {
    const results = athletes.map(athlete => {
      const cpTime = checkpoints[athlete.bib]?.[currentCheckpoint];
      if (!cpTime) return null;

      const startSeconds = parseTime(athlete.startTime);
      const raceTime = cpTime - startSeconds;

      return {
        ...athlete,
        raceTime,
        cpTime
      };
    }).filter(Boolean);

    results.sort((a, b) => a.raceTime - b.raceTime);

    return results.map((result, index) => {
      const gapToFirst = index === 0 ? 0 : result.raceTime - results[0].raceTime;
      const gapToAhead = index === 0 ? 0 : result.raceTime - results[index - 1].raceTime;
      const gapToBehind = index === results.length - 1 ? 0 : results[index + 1].raceTime - result.raceTime;

      return {
        ...result,
        position: index + 1,
        gapToFirst,
        gapToAhead,
        gapToBehind
      };
    });
  };

  const results = calculateResults();

  if (setupMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Trophy className="text-yellow-500" />
              Cross-Country Checkpoint Tracker
            </h1>
            <p className="text-gray-600 mb-6">Set up your race before tracking starts</p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Race</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setRace('men')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                    race === 'men'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Men's Race (4 Checkpoints)
                </button>
                <button
                  onClick={() => setRace('women')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                    race === 'women'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Women's Race (3 Checkpoints)
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Athlete Data (Bib, Name, Start Time)
              </label>
              <textarea
                value={athleteInput}
                onChange={(e) => setAthleteInput(e.target.value)}
                placeholder="101, John Smith, 09:00:00&#10;102, Jane Doe, 09:00:30&#10;103, Bob Johnson, 09:01:00"
                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Format: Bib, Name, Start Time (HH:MM:SS). One athlete per line.
              </p>
            </div>

            <button
              onClick={loadAthletes}
              disabled={!athleteInput.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Start Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Trophy className={race === 'men' ? 'text-blue-600' : 'text-pink-600'} />
              {race === 'men' ? "Men's Race" : "Women's Race"}
            </h1>
            <button
              onClick={() => setSetupMode(true)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to Setup
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            {[...Array(numCheckpoints)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentCheckpoint(i + 1)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  currentCheckpoint === i + 1
                    ? race === 'men'
                      ? 'bg-blue-600 text-white'
                      : 'bg-pink-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                CP {i + 1}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter Bib Number (Checkpoint {currentCheckpoint})
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={bibInput}
                onChange={(e) => setBibInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && recordCheckpoint()}
                placeholder="Type bib and press Enter"
                className="flex-1 p-3 border-2 border-gray-300 rounded-lg text-lg font-mono focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={recordCheckpoint}
                className={`px-6 py-3 rounded-lg font-bold text-white transition ${
                  race === 'men'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-pink-600 hover:bg-pink-700'
                }`}
              >
                <Plus size={24} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {results.length} of {athletes.length} athletes recorded at this checkpoint
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={race === 'men' ? 'bg-blue-600' : 'bg-pink-600'}>
                <tr className="text-white text-sm">
                  <th className="py-3 px-4 text-left">Pos</th>
                  <th className="py-3 px-4 text-left">Bib</th>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-right">Time</th>
                  <th className="py-3 px-4 text-right">Gap to 1st</th>
                  <th className="py-3 px-4 text-right">Gap Ahead</th>
                  <th className="py-3 px-4 text-right">Gap Behind</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, i) => (
                  <tr
                    key={result.bib}
                    className={`border-b ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${
                      i < 3 ? 'font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      {result.position === 1 && '🥇'}
                      {result.position === 2 && '🥈'}
                      {result.position === 3 && '🥉'}
                      {result.position > 3 && result.position}
                    </td>
                    <td className="py-3 px-4 font-mono">{result.bib}</td>
                    <td className="py-3 px-4">{result.name}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatTime(result.raceTime)}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">
                      {formatGap(result.gapToFirst)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">
                      {formatGap(result.gapToAhead)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">
                      {formatGap(result.gapToBehind)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}