import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register ini WAJIB agar Chart.js tahu fitur apa saja yang dipakai
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const SalesChart = () => {
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Agar mengikuti tinggi wrapper CSS kita
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const data = {
    labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    datasets: [
      {
        label: "Penjualan",
        data: [120000, 190000, 150000, 250000, 220000, 300000, 280000],
        fill: true,
        backgroundColor: "rgba(214, 178, 47, 0.2)",
        borderColor: "#d6b22f",
        tension: 0.4,
      },
    ],
  };

  return <Line options={options} data={data} />;
};

export default SalesChart;
