import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Line, Bar } from "react-chartjs-2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

const [isTomorrow, setIsTomorrow] = useState(false);
const [isTomorrowGraph, setIsTomorrowGraph] = useState(false);
const [showTomorrow, setShowTomorrow] = useState(false);

const generatePDF = async () => {
  const pdf = new jsPDF("p", "mm", "a4");
  const margin = 10;
  let yPosition = margin;

  // Draw black background for entire page
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(0, 0, 0); // black
  pdf.rect(0, 0, pageWidth, pageHeight, "F"); // fill

  // Title - set font size and white color for contrast on black
  pdf.setFontSize(20);
  pdf.setTextColor("#FFFFFF"); // white color
  pdf.text(
    "Weekly Power Generation Summary",
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 15;

  // Add AC Power Chart image
  const acChart = document.getElementById("ac-chart");
  if (acChart) {
    const canvas = await html2canvas(acChart, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - margin * 2;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", margin, yPosition, pdfWidth, pdfHeight);
    yPosition += pdfHeight + 10;
  }

  // Add DC Current Chart image
  const dcChart = document.getElementById("dc-chart");
  if (dcChart) {
    const canvas = await html2canvas(dcChart, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - margin * 2;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    if (yPosition + pdfHeight + 10 > pageHeight) {
      pdf.addPage();
      yPosition = margin;

      // Draw black background on new page too
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      pdf.setTextColor("#FFFFFF"); // reset text color after page break
    }

    pdf.addImage(imgData, "PNG", margin, yPosition, pdfWidth, pdfHeight);
    yPosition += pdfHeight + 10;
  }

  // Summary text - white color
  pdf.setFontSize(14);
  pdf.setTextColor("#FFFFFF");
  pdf.text(
    `Total Weekly AC Power: ${(acHourly.reduce((sum, val) => sum + val, 0) / 1000).toFixed(2)} kWh`,
    margin,
    yPosition
  );
  yPosition += 8;
  pdf.text(
    `Total Weekly DC Current: ${(dcHourly.reduce((sum, val) => sum + val, 0)).toFixed(2)} A`,
    margin,
    yPosition
  );

  // Save PDF
  pdf.save("weekly_power_summary.pdf");
};



const tomorrowACkW = acHourly.slice(24, 48).map(val => (val / 1000).toFixed(2));

const todayDCAmp = dcHourly.slice(0, 24).map(val => +val.toFixed(2));
const tomorrowDCAmp = dcHourly.slice(24, 48).map(val => +val.toFixed(2));

const downloadCSV = (acData: number[], dcData: number[]) => {
  const header = ["Day", "Hour", "AC Power (kWh)", "DC Current (A)"];
  const rows = [];

  for (let i = 0; i < 168; i++) {
    const dayNumber = Math.floor(i / 24) + 1;
    const hourOfDay = i % 24;
    const dayLabel = `Day ${dayNumber}`;
    const hourLabel = `${hourOfDay}:00`;
    const acPower = (acData[i] / 1000).toFixed(2);
    const dcCurrent = dcData[i].toFixed(2);
    rows.push([dayLabel, hourLabel, acPower, dcCurrent]);
  }

  const csvContent =
    [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `weekly_power_summary.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};





const tomorrowData = acHourly.slice(24, 48);

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

// for the dc 
const WeeklyDCCurrentChart = ({ dcData }: { dcData: number[] }) => {
  // Calculate daily average DC current (amps) for each of 7 days, then convert to kA
  const dailyTotalAmp = [];
  for (let i = 0; i < 7; i++) {
    const dayData = dcData.slice(i * 24, (i + 1) * 24);
    const totalAmp = dayData.reduce((sum, val) => sum + val, 0);
    dailyTotalAmp.push(+totalAmp.toFixed(2)); // convert to kA, 3 decimals
  }

  const chartData = {
    labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
    datasets: [
      {
        label: "Daily DC Current (A)",
        data: dailyTotalAmp,
        backgroundColor: "rgba(34,197,94,0.6)",
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
        labels: { color: "#ffffff", font: { size: 16 } },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#ffffff",
        bodyColor: "#d1fae5",
        borderColor: "#4ade80",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.y} A`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Day of the Week", color: "#ffffff", font: { size: 18, weight: "bold" } },
        ticks: { color: "#d1fae5", font: { size: 14 } },
        grid: { color: "#374151" },
      },
      y: {
        title: { display: true, text: "DC Current (A)", color: "#ffffff", font: { size: 18, weight: "bold" } },
        ticks: {
          color: "#d1fae5",
          font: { size: 14 },
          // Optionally format ticks to show fewer decimals if you want:
          callback: (value: any) => `${value} A`,
        },
        grid: { color: "#374151" },
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={chartOptions} />;
};





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
  <h2 className="text-4xl font-semibold text-white text-center">
    Weekly Power Summary
  </h2>

  <div className="flex flex-col gap-6">
    {/* First Box - Power per Hour */}
    <div className="bg-black/30 border border-white/10 rounded-xl p-6 shadow-inner h-[400px] relative">
      {/* Toggle Button Top Right */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setIsTomorrow(false)}
          className={`px-3 py-1 rounded-lg text-sm ${
            !isTomorrow ? "bg-green-500 text-white" : "bg-gray-600 text-gray-200"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setIsTomorrow(true)}
          className={`px-3 py-1 rounded-lg text-sm ${
            isTomorrow ? "bg-green-500 text-white" : "bg-gray-600 text-gray-200"
          }`}
        >
          Tomorrow
        </button>
      </div>

      <h3 className="text-white text-2xl font-semibold mb-2">
        Power per Hour ({isTomorrow ? "Tomorrow" : "Today"})
      </h3>
      <p className="text-gray-300 text-lg">
        AC power for each hour of {isTomorrow ? "tomorrow" : "today"}:
      </p>
      <div className="relative mt-4 h-[300px] overflow-hidden rounded-xl">
        <ul className="text-white absolute inset-0 grid grid-cols-3 gap-y-6 gap-x-2 text-xl overflow-y-auto custom-scrollbar p-1">
          {(isTomorrow ? acHourly.slice(24, 48) : acHourly.slice(0, 24)).map(
            (val, i) => (
              <li key={i}>
                <span className="text-green-400 font-bold">
                  Hour {i + 1}:
                </span>{" "}
                {(val / 1000).toFixed(2)} kWh
              </li>
            )
          )}
        </ul>
      </div>
    </div>

    {/* Second Box - Total AC Power & DC Current */}
    <div className="flex-1 bg-black/30 border border-white/10 rounded-xl p-6 shadow-inner relative flex justify-between items-center">
      <div>
        <h3 className="text-white text-2xl font-medium mb-2">
          {isTomorrow ? "Tomorrow's Total AC Power" : "Today's Total AC Power"}
        </h3>
        <p className="text-3xl font-bold text-green-400">
          {(
            (isTomorrow
              ? acHourly.slice(24, 48)
              : acHourly.slice(0, 24)
          ).reduce((sum, val) => sum + val, 0) / 1000
          ).toFixed(2)}{" "}
          kWh
        </p>
      </div>

      <div className="text-right">
        <h3 className="text-white text-2xl font-medium mb-2">
          {isTomorrow ? "Tomorrow's Total DC Current" : "Today's Total DC Current"}
        </h3>
        <p className="text-3xl font-bold text-green-400">
          {(
            (isTomorrow
              ? dcHourly.slice(24, 48)
              : dcHourly.slice(0, 24)
          ).reduce((sum, val) => sum + val, 0)
          ).toFixed(2)}{" "}
          A
        </p>
      </div>
    </div>

    {/* Third Box - Weekly Power & Weekly DC Current */}
    <div className="flex-1 bg-black/30 border border-white/10 rounded-xl p-6 shadow-inner flex justify-between items-center">
      <div>
        <h3 className="text-white text-2xl font-medium mb-2">
          This Week's Estimated Power
        </h3>
        <p className="text-3xl font-bold text-green-400">
          {(acHourly.reduce((sum, val) => sum + val, 0) / 1000).toFixed(2)} kWh
        </p>
      </div>

      <div className="text-right">
        <h3 className="text-white text-2xl font-medium mb-2">
          This Week's Estimated DC Current
        </h3>
        <p className="text-3xl font-bold text-green-400">
          {(dcHourly.reduce((sum, val) => sum + val, 0)).toFixed(2)} A
        </p>
      </div>
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
    {/* make this container relative so the absolute buttons sit correctly */}
    <div className="w-full max-w-5xl bg-black/30 rounded-2xl shadow-2xl p-8 relative">
      
      {/* **Exact button group from first div** (top-right) */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setIsTomorrow(false)}
          className={`px-3 py-1 rounded-lg text-sm ${
            !isTomorrow ? "bg-green-500 text-white" : "bg-gray-600 text-gray-200"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setIsTomorrow(true)}
          className={`px-3 py-1 rounded-lg text-sm ${
            isTomorrow ? "bg-green-500 text-white" : "bg-gray-600 text-gray-200"
          }`}
        >
          Tomorrow
        </button>
      </div>

      {/* Heading (keeps centered like before) */}
      <h2 className="text-3xl font-bold mb-6 text-center text-green-400">
        {isTomorrow ? "Tomorrow's AC Power" : "Today's AC Power"}
      </h2>

      {/* Chart (unchanged except it now uses isTomorrow) */}
      <Line
        data={{
          labels: hourLabels,
          datasets: [
            {
              label: "AC Power (kW)",
              data: isTomorrow ? tomorrowACkW : todayACkW,
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
                font: { size: 16 },
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
                font: { size: 18, weight: "bold" },
              },
              ticks: { color: "#d1fae5", font: { size: 14 } },
              grid: { color: "#374151" },
            },
            y: {
              title: {
                display: true,
                text: "AC Power (kW)",
                color: "#ffffff",
                font: { size: 18, weight: "bold" },
              },
              ticks: { color: "#d1fae5", font: { size: 14 } },
              grid: { color: "#374151" },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>  {/*till now the toggle are impmelt and swith btew today and tom v */}
  </div>
</motion.div>
        {/*Dc current hourly  */}
<motion.div
  className="w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 space-y-6 mt-8"
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, ease: "easeOut" }}
>
  <div className="text-white p-4 flex flex-col items-center">
    {/* make this container relative so the absolute buttons sit correctly */}
    <div className="w-full max-w-5xl bg-black/30 rounded-2xl shadow-2xl p-8 relative">
      
      {/* **Exact button group from first div** (top-right) */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setIsTomorrow(false)}
          className={`px-3 py-1 rounded-lg text-sm ${
            !isTomorrow ? "bg-green-500 text-white" : "bg-gray-600 text-gray-200"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setIsTomorrow(true)}
          className={`px-3 py-1 rounded-lg text-sm ${
            isTomorrow ? "bg-green-500 text-white" : "bg-gray-600 text-gray-200"
          }`}
        >
          Tomorrow
        </button>
      </div>

      {/* Heading (keeps centered like before) */}
      <h2 className="text-3xl font-bold mb-6 text-center text-green-400">
        {isTomorrow ? "Tomorrow's DC Current" : "Today's DC Current"}
      </h2>

      {/* Chart (unchanged except it now uses isTomorrow) */}
     <Line
  data={{
    labels: hourLabels,
    datasets: [
      {
        label: "DC Current (A)",
        data: isTomorrow ? tomorrowDCAmp : todayDCAmp,
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
          font: { size: 16 },
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
          label: (ctx) => `${ctx.parsed.y} A`,  // Changed to Amps
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Hour of the Day",
          color: "#ffffff",
          font: { size: 18, weight: "bold" },
        },
        ticks: { color: "#d1fae5", font: { size: 14 } },
        grid: { color: "#374151" },
      },
      y: {
        title: {
          display: true,
          text: "DC Current (A)",   // Changed to DC Current
          color: "#ffffff",
          font: { size: 18, weight: "bold" },
        },
        ticks: { color: "#d1fae5", font: { size: 14 } },
        grid: { color: "#374151" },
        beginAtZero: true,
      },
    },
  }}
/>

    </div>  {/*till now the toggle are impmelt and swith btew today and tom v */}
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
          <div id="ac-chart" className="w-full max-w-5xl bg-black/30 rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-green-400">
               Week's AC Power Overview
            </h2>
           <WeeklyACPowerChart acData={acHourly} />

          </div>
        </div>

        
      </motion.div>
      {/* div for the dc weekly overview */}
      <motion.div
  className="w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 space-y-6 mt-8"
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, ease: "easeOut" }}
>
  <div className="text-white p-4 flex flex-col items-center">
    <div id="dc-chart"className="w-full max-w-5xl bg-black/30 rounded-2xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-green-400">
        Week's DC Current Overview
      </h2>
      <WeeklyDCCurrentChart dcData={dcHourly} />
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

              
              

              <div className="flex justify-center gap-4 pt-4">
                <Button onClick={() => navigate("/location")}>Go Back</Button>           
    <button
      className="mt-0.4 px-5 py-1 bg-green-600 rounded-lg text-white text-xl hover:bg-green-700 transition"
      onClick={() => downloadCSV(acHourly, dcHourly)}
    >
      Download Weekly Summary CSV
    </button>
    <button
  className="mt-0.4 px-5 py-1 bg-green-600 rounded-lg text-white  text-xl hover:bg-green-700 transition"
  onClick={generatePDF}
>
  Download Weekly Summary PDF
</button>
                
               
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
