import { useState } from "react";
import { Plus } from "lucide-react";
import { BurnButton } from "./components/BurnButton";
import { CapacityMeter } from "./components/CapacityMeter";
import { DiscStatusBar } from "./components/DiscStatusBar";
import { DiscTitle } from "./components/DiscTitle";
import { Header } from "./components/Header";
import { TrackList } from "./components/TrackList";
import { useTracks } from "./hooks/useTracks";
import { chooseAudioFiles } from "./services/audioFiles";
import { demoTracks, simulatedDisc } from "./services/simulation";

const isTauri = "__TAURI_INTERNALS__" in window;

export default function App() {
  const [title, setTitle] = useState("");
  const [burning, setBurning] = useState(false);
  const { tracks, totalSeconds, addTracks, removeTrack, moveTrack, reorderTrack } = useTracks(
    isTauri ? [] : demoTracks(),
  );

  async function addMusic() {
    if (!isTauri) {
      addTracks(demoTracks().slice(0, 1));
      return;
    }
    addTracks(await chooseAudioFiles());
  }

  function simulateBurn() {
    setBurning(true);
    window.setTimeout(() => setBurning(false), 2200);
  }

  const overCapacity = totalSeconds > 80 * 60;

  return (
    <main className="app-shell">
      <Header />
      <section className="workspace">
        <DiscTitle value={title} onChange={setTitle} />
        <div className="tracks-heading">
          <div><span className="eyebrow">Tracks</span><strong>{tracks.length} {tracks.length === 1 ? "song" : "songs"}</strong></div>
          <button className="add-button" onClick={addMusic}><Plus size={18} /> Add music</button>
        </div>
        <TrackList tracks={tracks} onRemove={removeTrack} onMove={moveTrack} onReorder={reorderTrack} />
        <CapacityMeter usedSeconds={totalSeconds} />
        <DiscStatusBar status={simulatedDisc} />
        <BurnButton disabled={!tracks.length || overCapacity || burning} burning={burning} onClick={simulateBurn} />
        {!isTauri && <p className="simulation-note">Browser preview uses sample tracks and simulated disc status.</p>}
      </section>
    </main>
  );
}
