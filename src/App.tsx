import { useEffect, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

import type { Player } from './models/players.ts'

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<Array<Player>>([]);
  const [datesReady, setDatesReady] = useState(false);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const playersDataRef = useRef<Array<Player>>([]);
  const playersLoadPromiseRef = useRef<Promise<void> | null>(null);
  const playerNameRef = useRef('');

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  useEffect(() => {
    const getDates = async () => {
      const seasonsQuery = "/api-web-nhl/v1/standings-season";
      try {
        const response = await fetch(seasonsQuery);
        if (!response.ok) {
          throw new Error('Could not fetch seasons');
        }

        const data = await response.json();
        const seasons = data.seasons;

        console.log(seasons);
        console.log(seasons[seasons.length - 1]);

        setStartDate(new Date(seasons[seasons.length - 1].standingsStart));
        setEndDate(new Date(seasons[seasons.length - 1].standingsEnd));
        setDatesReady(true);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
      }
    };

    getDates();
  }, []);

  useEffect(() => {
    if (!datesReady) {
      return;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const searchParams = new URLSearchParams({
      isAggregate: 'true',
      isGame: 'true',
      sort: JSON.stringify([{ property: 'skaterFullName', direction: 'ASC' }]),
      start: '0',
      limit: '-1',
      cayenneExp: `gameDate<="${endDateStr}" and gameDate>="${startDateStr}" and (gameTypeId=2 or gameTypeId=3)`,
    });
    const playersQuery = `/api-e-nhl/stats/rest/en/skater/summary?${searchParams.toString()}`;

    const loadPlayers = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(playersQuery);
        console.log('response:', response);

        if (!response.ok) {
          throw new Error('Error loading players.');
        }

        const data = await response.json();
        console.log('Players found:', data);
        const mappedPlayers: Array<Player> = (data?.data ?? []).map((player: { playerId: string | number; skaterFullName: string }) => ({
          playerId: String(player.playerId),
          name: player.skaterFullName,
        }));

        playersDataRef.current = mappedPlayers;

        const activeSearch = playerNameRef.current.trim();
        if (activeSearch.length > 0) {
          const fuse = new Fuse(mappedPlayers, {
            keys: ['name'],
            threshold: 0.3,
            ignoreLocation: true,
          });
          const fuzzyMatches = fuse.search(activeSearch).map((result) => result.item);
          setPlayers(fuzzyMatches);
        } else {
          setPlayers(mappedPlayers);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
      } finally {
        setIsLoading(false);
      }
    };

    const loadPromise = loadPlayers().finally(() => {
      playersLoadPromiseRef.current = null;
    });

    playersLoadPromiseRef.current = loadPromise;
  }, [datesReady, startDate, endDate]);

  const searchPlayers = async (name: string) => {
    setPlayerName(name);

    if (playersLoadPromiseRef.current) {
      await playersLoadPromiseRef.current;
    }

    const sourcePlayers = playersDataRef.current;
    if (name.trim().length > 0) {
      const fuse = new Fuse(sourcePlayers, {
        keys: ['name'],
        threshold: 0.3,
        ignoreLocation: true,
      });
      const fuzzyMatches = fuse.search(name).map((result) => result.item);
      setPlayers(fuzzyMatches);
      return;
    }

    setPlayers(sourcePlayers);
  };

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <form>
          <label htmlFor="startDate">Start Date: </label>
          <input type="date" id="startDate" name="startDate" value={startDate.toISOString().split('T')[0]} onChange={(e) => setStartDate(new Date(e.target.value))} />
        </form>
        <form>
          <label htmlFor="endDate">End Date: </label>
          <input type="date" id="endDate" name="endDate" value={endDate.toISOString().split('T')[0]} onChange={(e) => setEndDate(new Date(e.target.value))} />
        </form>
        <input
          type="text"
          value={playerName}
          onChange={(e) => searchPlayers(e.target.value)}
          placeholder="Enter player name"
          aria-disabled={isLoading ? 'true' : 'false'}
        />

        {isLoading && <p role="status" aria-live="polite">Loading players for selected dates...</p>}
        <ul>
          {players.map((player) => (
            <li key={player.playerId}>{player.playerId}: {player.name}</li>
          ))}
        </ul>
        {error && <p role="alert">{error}</p>}
      </section>
    </>
  )
}

export default App
