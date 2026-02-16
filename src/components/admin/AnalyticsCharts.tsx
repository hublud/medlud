'use client';

import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartProps {
    data: any[];
    height?: number;
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const UserRegistrationChart: React.FC<ChartProps> = ({ data, height = 300 }) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} name="Registrations" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export const AppointmentCategoryChart: React.FC<ChartProps> = ({ data, height = 300 }) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                        const entry = data.find((d) => d.count === props.value);
                        return entry ? `${entry.category}: ${entry.count}` : '';
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    );
};

export const AppointmentHourChart: React.FC<ChartProps> = ({ data, height = 300 }) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Appointments', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Appointments" />
            </BarChart>
        </ResponsiveContainer>
    );
};
