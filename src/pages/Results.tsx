import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Line, Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  Title,
  BarElement,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler, Title, BarElement);

const Results = () => {
 const [acHourly, setAcHourly] = useState<number[]>([]);
 const [dcHourly, setDcHourly] = useState<number[]>([]);

  const navigate = useNavigate();

 useEffect(() => {
  const stored = localStorage.getItem("geminiPrediction");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      setAcHourly(parsed.ac_hourly || []);
      setDcHourly(parsed.dc_hourly || []);
    } catch (err) {
      console.error("Failed to parse stored prediction data", err);
    }
  }
}, []);



  const getDayData = (data: number[], dayIndex: number) => {
    const start = dayIndex * 24;
    return data.slice(start, start + 24);
  };

 const todayData = getDayData(acHourly, 0); // or dcHourly
  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Solar Power (kWh)",
        data: todayData,
        borderColor: "#4ade80",
        backgroundColor: "rgba(74, 222, 128, 0.2)",
        fill: true,
        tension: 0.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#4ade80",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#fff",
        bodyColor: "#d1d5db",
        borderColor: "#4ade80",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => `${context.parsed.y} kWh`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#d1fae5" },
        grid: { color: "#374151" },
        title: { display: true, text: "Hour", color: "#f3f4f6" },
      },
      y: {
        ticks: { color: "#d1fae5" },
        grid: { color: "#374151" },
        beginAtZero: true,
        title: { display: true, text: "kWh", color: "#f3f4f6" },
      },
    },
  };
// 7 values: one for each day
const getDailyAverages = (data: number[]) => {
  const averages: number[] = [];
  for (let i = 0; i < 7; i++) {
    const dayData = data.slice(i * 24, (i + 1) * 24);
    const avg = dayData.reduce((sum, val) => sum + val, 0) / 24;
    averages.push(+avg.toFixed(2));
  }
  return averages;
};

// graph for the week analysis
const dailyAverages = getDailyAverages(acHourly); // or dcHourly


/// final graphh for the day wise
const todayACkW = acHourly.slice(0, 24).map(watt => +(watt / 1000).toFixed(2));
const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
// end hree






// for the weekly  graph


const WeeklyACPowerChart = ({ acData }: { acData: number[] }) => {
  // Convert to daily totals in kWh
  const dailyTotals = [];
  for (let i = 0; i < 7; i++) {
    const dayData = acData.slice(i * 24, (i + 1) * 24);
    const dailyKWh = dayData.reduce((sum, val) => sum + val / 1000, 0);
    dailyTotals.push(dailyKWh.toFixed(2)); // round to 2 decimals
  }

  const chartData = {
    labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
    datasets: [
      {
        label: "Daily AC Power (kWh)",
        data: dailyTotals,
        backgroundColor: "rgba(34,197,94,0.6)", // Tailwind green-500 with opacity
        borderColor: "rgba(34,197,94,1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: true,
      labels: {
        color: "#ffffff",
        font: {
          size: 16,
        },
      },
    },
    tooltip: {
      backgroundColor: "#1f2937",
      titleColor: "#ffffff",
      bodyColor: "#d1fae5",
      borderColor: "#4ade80",
      borderWidth: 1,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => `${ctx.parsed.y} kWh`,
      },
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "Day of the Week",
        color: "#ffffff",
        font: {
          size: 18,
          weight: "bold",
        },
      },
      ticks: {
        color: "#d1fae5",
        font: {
          size: 14,
        },
      },
      grid: {
        color: "#374151",
      },
    },
    y: {
      title: {
        display: true,
        text: "AC Power (kWh)",
        color: "#ffffff",
        font: {
          size: 18,
          weight: "bold",
        },
      },
      ticks: {
        color: "#d1fae5",
        font: {
          size: 14,
        },
      },
      grid: {
        color: "#374151",
      },
      beginAtZero: true,
    },
  },
};

    return (
    <>
      
      <Bar data={chartData} options={chartOptions} />
    </>
  );
};







// ends here weekly grapah



return (
  <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white p-6 px-4">
    <div className="w-full max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-4 text-green-400">
          ⚡  Power Generation Details
        </h1>
        <p className="text-gray-400 text-lg">
          Based on your location and solar panel configuration
        </p>
      </div>

      {/* First motion.div */}
<motion.div
  className="w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 space-y-6"
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, ease: "easeOut" }}
>
  <h2 className="text-4xl font-semibold text-white text-center"> Weekly Power Summary</h2>

  <div className="flex flex-col gap-6">
    <div className="bg-black/30 border border-white/10 rounded-xl p-6 shadow-inner h-[400px]">
      <h3 className="text-white text-2xl font-semibold mb-2"> Power per Hour (Today)</h3>
      <p className="text-gray-300 text-lg">AC power for each hour of today:</p>
      <div className="relative mt-4 h-[300px] overflow-hidden rounded-xl">
        <ul className="text-white absolute inset-0 grid grid-cols-3 gap-y-6 gap-x-2 text-xl overflow-y-auto custom-scrollbar p-1">
          {acHourly.slice(0, 24).map((val, i) => (
            <li key={i}>
              <span className="text-green-400 font-bold">Hour {i + 1}:</span> {(val / 1000).toFixed(2)} kWh
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="flex-1 bg-black/30 border border-white/10 rounded-xl p-6 shadow-inner">
      <h3 className="text-white text-2xl font-medium mb-2"> Today's Total AC Power</h3>
      <p className="text-3xl font-bold text-green-400">
        {(acHourly.slice(0, 24).reduce((sum, val) => sum + val, 0) / 1000).toFixed(2)} kWh
      </p>
    </div>

    <div className="flex-1 bg-black/30 border border-white/10 rounded-xl p-6 shadow-inner">
      <h3 className="text-white text-2xl font-medium mb-2"> This Week's Estimated Power</h3>
      <p className="text-3xl font-bold text-green-400">
        {(acHourly.reduce((sum, val) => sum + val, 0) / 1000).toFixed(2)} kWh
      </p>
    </div>
  </div>
</motion.div>



      {/* Second motion.div */}
      <motion.div
        className="w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 space-y-6 mt-8"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
       >
        <div className="text-white p-4 flex flex-col items-center">
          <div className="w-full max-w-5xl bg-black/30 rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-green-400">
              Today's AC Power
            </h2>

<Line
  data={{
    labels: hourLabels,
    datasets: [
      {
        label: "AC Power (kW)",
        data: todayACkW,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        borderColor: "rgba(34,197,94,1)", // Tailwind green-500
        backgroundColor: "rgba(34,197,94,0.3)",
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgba(34,197,94,1)",
      },
    ],
  }}
  options={{
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#ffffff",
          font: {
            size: 16,
          },
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#fff",
        bodyColor: "#d1fae5",
        borderColor: "#4ade80",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} kW`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Hour of the Day",
          color: "#ffffff",
          font: {
            size: 18,
            weight: "bold",
          },
        },
        ticks: {
          color: "#d1fae5",
          font: {
            size: 14,
          },
        },
        grid: {
          color: "#374151",
        },
      },
      y: {
        title: {
          display: true,
          text: "AC Power (kW)",
          color: "#ffffff",
          font: {
            size: 18,
            weight: "bold",
          },
        },
        ticks: {
          color: "#d1fae5",
          font: {
            size: 14,
          },
        },
        grid: {
          color: "#374151",
        },
        beginAtZero: true,
      },
    },
  }}
/>


           
          </div>
        </div>


      </motion.div>
      {/* third motion.div */}
      <motion.div
        className="w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 space-y-6 mt-8"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="text-white p-4 flex flex-col items-center">
          <div className="w-full max-w-5xl bg-black/30 rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-green-400">
               Week's AC Power Overview
            </h2>
           <WeeklyACPowerChart acData={acHourly} />

          </div>
        </div>

        
      </motion.div>


      <motion.div
        className="w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 space-y-6 mt-8"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {(() => {
          const generatedKWh = +(acHourly.slice(0, 24).reduce((sum, val) => sum + val / 1000, 0).toFixed(2));

          const co2Saved = (generatedKWh * 0.92).toFixed(2);
          const coalSaved = (generatedKWh * 0.4).toFixed(2);
          const moneySaved = (generatedKWh * 8).toFixed(2);
          const treesEquivalent = (parseFloat(co2Saved) / 21).toFixed(1);

          const shareMessage = `🌞 I generated ${generatedKWh} kWh of solar energy today! 💨 Saved ${co2Saved} kg CO₂, 🏭 ${coalSaved} kg coal, 💸 ₹${moneySaved}, and 🌳 planted ${treesEquivalent} trees (virtually)! #SolarPower #CleanEnergy #GreenWorld`;

          return (
            <>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg py-4 px-6 text-center shadow-md">
                <h2 className="text-3xl font-extrabold tracking-wide">
                  🌍 Contribution to Green World
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="bg-white/15 backdrop-blur-lg p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:bg-white/5">
                  <p className="text-3xl font-semibold text-green-300">
                    ⚡Power Generated
                  </p>
                  <p className="text-3xl font-bold text-green-200 mt-1 ml-9">
                    {generatedKWh} kWh
                  </p>
                </div>

                <div className="bg-white/15 backdrop-blur-lg p-6 rounded-xl shadow-md hover:shadow-lg transition-all  hover:bg-white/5">
                  <p className="text-3xl font-semibold text-emerald-300">
                    🌱CO₂ Saved
                  </p>
                  <p className="text-3xl font-bold text-emerald-200 mt-1 ml-9">
                    {co2Saved} kg
                  </p>
                </div>

                <div className="bg-white/15 backdrop-blur-lg p-6 rounded-xl shadow-md hover:shadow-lg transition-all  hover:bg-white/5">
                  <p className="text-3xl font-semibold text-yellow-300">
                    🏭 Coal Saved
                  </p>
                  <p className="text-3xl font-bold text-yellow-100 mt-1 ml-9">
                    {coalSaved} kg
                  </p>
                </div>

                <div className="bg-white/15 backdrop-blur-lg p-6 rounded-xl shadow-md hover:shadow-lg transition-all  hover:bg-white/5">
                  <p className="text-3xl font-semibold text-indigo-300">
                    💸 Money Saved
                  </p>
                  <p className="text-3xl font-bold text-indigo-200 mt-1 ml-9">
                    ₹{moneySaved}
                  </p>
                </div>

                <div className="col-span-1 md:col-span-2 bg-white/15 backdrop-blur-lg p-6 rounded-xl shadow-md hover:shadow-lg transition-all  hover:bg-white/5">
                  <p className="text-3xl font-semibold text-pink-300">
                    🌳 Green Impact
                  </p>
                  <p className="text-3xl font-bold text-pink-200 mt-1 ml-9">
                    Equivalent to planting {treesEquivalent} trees
                  </p>
                </div>
              </div>

              <div className="w-full mt-6 p-6 border border-dashed border-green-400 rounded-lg bg-white/15 backdrop-blur-md text-green-200 font-semibold whitespace-pre-wrap shadow-inner text-2xl  hover:bg-white/5">
                {shareMessage}
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <Button onClick={() => navigate("/location")}>Go Back</Button>
                <Button className="text-white bg-color" 
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(shareMessage)}
                >
                  Copy
                </Button>
              </div>
            </>
          );
        })()}
      </motion.div>





    
      
    
      
    </div>
  </div>
);

}

export default Results;
