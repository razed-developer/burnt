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
import { cleanupPreparedTracks, prepareAudioTracks } from "./services/audioPreparation";
import { demoTracks, simulatedDisc } from "./services/simulation";

const isTauri = "__TAURI_INTERNALS__" in window;

export default function App() {
  const [title, setTitle] = useState("");
  const [burning, setBurning] = useState(false);
  const [preparationMessage, setPreparationMessage] = useState<string | null>(null);
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

  async function prepareBurn() {
    if (!isTauri) {
      setBurning(true);
      window.setTimeout(() => setBurning(false), 2200);
      return;
    }

    setBurning(true);
    setPreparationMessage("Preparing audio…");
    try {
      const prepared = await prepareAudioTracks(tracks.map((track) => track.path));
      setPreparationMessage(`${prepared.length} ${prepared.length === 1 ? "track" : "tracks"} prepared for Audio CD.`);
      await cleanupPreparedTracks(prepared.map((track) => track.pcmPath));
    } catch (error) {
      setPreparationMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBurning(false);
    }
  }

  const overCapacity = totalSeconds > 80 * 60;
  const hasAudioError = tracks.some((track) => track.metadataState === "error");

  return (
    <main className="app-shell">
      <Header />
      <section className="workspace">
        <DiscTitle value={title} onChange={setTitle} />
        <div className="tracks-heading">
          <div><span className="eyebrow">Tracks</span><strong>{tracks.length} {tracks.length === 1 ? "song" : "songs"}</strong></div>
          <button className="add-button" onClick={addMusic} disabled={burning}><Plus size={18} /> Add music</button>
        </div>
        <TrackList tracks={tracks} onRemove={removeTrack} onMove={moveTrack} onReorder={reorderTrack} />
        <CapacityMeter usedSeconds={totalSeconds} />
        <DiscStatusBar status={simulatedDisc} />
        <BurnButton disabled={!tracks.length || overCapacity || hasAudioError || burning} burning={burning} onClick={prepareBurn} />
        {preparationMessage && <p className="preparation-note">{preparationMessage}</p>}
        {!isTauri && <p className="simulation-note">Browser preview uses sample tracks and simulated disc status.</p>}
      </section>
    </main>
  );
}
