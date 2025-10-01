import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const progressData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
  datasets: [
    {
      label: 'Average Score',
      data: [65, 68, 72, 75, 79, 83],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    },
  ],
};

const practiceTimeData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Practice Time (minutes)',
      data: [30, 45, 60, 35, 50, 20, 25],
      backgroundColor: 'rgba(20, 184, 166, 0.6)',
      borderRadius: 6,
    },
  ],
};

// Training scenarios data
const scenariosData = {
  labels: ['Customer Service', 'Sales Training', 'Product Knowledge', 'Compliance'],
  datasets: [
    {
      label: 'Scenarios',
      data: [35, 25, 22, 18],
      backgroundColor: [
        'rgb(59, 130, 246)', // Blue for Customer Service
        'rgb(16, 185, 129)', // Green for Sales Training
        'rgb(20, 184, 166)', // Teal for Product Knowledge
        'rgb(249, 115, 22)'  // Orange for Compliance
      ],
      borderWidth: 0,
      hoverOffset: 4,
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: 'currentColor',
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(156, 163, 175, 0.1)',
      },
      ticks: {
        color: 'currentColor',
      },
    },
    x: {
      grid: {
        color: 'rgba(156, 163, 175, 0.1)',
      },
      ticks: {
        color: 'currentColor',
      },
    },
  },
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `${context.label}: ${context.raw}%`;
        }
      }
    }
  },
  cutout: '40%',
};

export const AnalyticsCharts = () => {
  return (
    <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
          <CardDescription>Your performance score trend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={progressData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Practice Time</CardTitle>
          <CardDescription>Minutes spent practicing per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar data={practiceTimeData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Training Scenarios</CardTitle>
          <CardDescription>Distribution by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 h-64 flex items-center justify-center">
              <div className="w-full h-full max-w-xs mx-auto relative">
                <Pie data={scenariosData} options={pieOptions} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 flex items-center justify-center">
              <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                {scenariosData.labels?.map((label, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: scenariosData.datasets[0].backgroundColor[index] as string }}></div>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="text-sm font-medium">{scenariosData.datasets[0].data[index]}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};