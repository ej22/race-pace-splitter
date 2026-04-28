import React, { forwardRef, useImperativeHandle } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

const ElevationChart = forwardRef(function ElevationChart({ elevationProfile, unit }, ref) {
  useImperativeHandle(ref, () => ({
    getChartImage() {
      if (!elevationProfile || elevationProfile.length === 0) return null;

      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');

      const distUnit = unit === 'mile' ? 1.60934 : 1;
      const pts = [];
      let cumDist = 0;
      for (const seg of elevationProfile) {
        pts.push({ x: cumDist, y: seg.startElevation });
        cumDist += distUnit;
      }
      pts.push({ x: cumDist, y: elevationProfile[elevationProfile.length - 1].endElevation });

      const minEle = Math.min(...pts.map((p) => p.y));
      const maxEle = Math.max(...pts.map((p) => p.y));
      const maxDist = pts[pts.length - 1].x;
      const eleRange = maxEle - minEle || 1;

      const pad = 5;
      const w = canvas.width - pad * 2;
      const h = canvas.height - pad * 2;

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      pts.forEach((pt, i) => {
        const x = pad + (pt.x / maxDist) * w;
        const y = pad + h - ((pt.y - minEle) / eleRange) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(pad + w, pad + h);
      ctx.lineTo(pad, pad + h);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, pad, 0, pad + h);
      grad.addColorStop(0, 'rgba(242,126,0,0.7)');
      grad.addColorStop(1, 'rgba(242,126,0,0.1)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      pts.forEach((pt, i) => {
        const x = pad + (pt.x / maxDist) * w;
        const y = pad + h - ((pt.y - minEle) / eleRange) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#F27E00';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      return canvas.toDataURL('image/png');
    },
  }));

  if (!elevationProfile || elevationProfile.length === 0) return null;

  const distUnit = unit === 'mile' ? 1.60934 : 1;
  const unitLabel = unit === 'mile' ? 'mi' : 'km';

  const chartData = [];
  let cumDist = 0;
  for (const seg of elevationProfile) {
    chartData.push({ dist: parseFloat(cumDist.toFixed(2)), ele: seg.startElevation });
    cumDist += distUnit;
  }
  const last = elevationProfile[elevationProfile.length - 1];
  chartData.push({ dist: parseFloat(cumDist.toFixed(2)), ele: last.endElevation });

  const segBoundaries = chartData.slice(1, -1).map((d) => d.dist);

  return (
    <div style={{ height: 200 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F27E00" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#F27E00" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis
            dataKey="dist"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
            tickFormatter={(v) => `${v}${unitLabel}`}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
            tickFormatter={(v) => `${v}m`}
            width={48}
          />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid #333', color: '#e5e5e5', fontSize: 12 }}
            formatter={(val) => [`${val}m`, 'Elevation']}
            labelFormatter={(v) => `${v} ${unitLabel}`}
          />
          {segBoundaries.map((dist, i) => (
            <ReferenceLine key={i} x={dist} stroke="#2a2a2a" strokeWidth={1} />
          ))}
          <Area
            type="monotone"
            dataKey="ele"
            stroke="#F27E00"
            strokeWidth={2}
            fill="url(#elevGrad)"
            dot={false}
            activeDot={{ r: 3, fill: '#F27E00' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export default ElevationChart;
