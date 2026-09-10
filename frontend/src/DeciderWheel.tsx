import { useState } from 'react';
import { Wheel } from 'react-custom-roulette';

// Tell TypeScript what an Activity looks like here too
interface Activity {
  id: number;
  name: string;
}

interface DeciderWheelProps {
  activities: Activity[];
  onSpinFinished: (id: number) => void;
}

export default function DeciderWheel({ activities, onSpinFinished }: DeciderWheelProps) {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);

  const wheelData = activities.map(act => ({ option: act.name }));

  const handleSpinClick = () => {
    if (wheelData.length === 0) return;
    const newPrizeNumber = Math.floor(Math.random() * wheelData.length);
    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);
  };

  if (wheelData.length === 0) return <p className="text-center text-slate-400 my-4">Add some activities to spin!</p>;

  return (
    <div className="flex flex-col items-center my-8 w-full">
      <div className="w-[400px] h-[400px] flex justify-center items-center">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={wheelData}
          backgroundColors={['#1e293b', '#334155', '#4f46e5', '#312e81']}
          textColors={['#ffffff']}
          outerBorderColor="#0f172a"
          outerBorderWidth={5}
          innerBorderColor="#0f172a"
          innerBorderWidth={2}
          radiusLineColor="#0f172a"
          radiusLineWidth={2}
          fontSize={14}
          onStopSpinning={() => {
            setMustSpin(false);
            onSpinFinished(activities[prizeNumber].id);
          }}
        />
      </div>
      <button 
        onClick={handleSpinClick}
        className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors tracking-wide"
      >
        SPIN THE WHEEL
      </button>
    </div>
  );
}