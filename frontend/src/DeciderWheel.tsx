import { useState } from 'react';
import { Wheel } from 'react-custom-roulette';

// Tell TypeScript what an Activity looks like here too
interface Activity {
  id: number;
  name: string;
}

interface DeciderWheelProps {
  activities: Activity[];
}

export default function DeciderWheel({ activities }: DeciderWheelProps) {
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
    <div className="flex flex-col items-center my-8">
      <Wheel
        mustStartSpinning={mustSpin}
        prizeNumber={prizeNumber}
        data={wheelData}
        onStopSpinning={() => {
          setMustSpin(false);
          alert(`Winner: ${wheelData[prizeNumber].option}!`);
        }}
      />
      <button 
        onClick={handleSpinClick}
        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-colors"
      >
        SPIN THE WHEEL
      </button>
    </div>
  );
}