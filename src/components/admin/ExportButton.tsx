'use client';

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnalyticsData } from '@/utils/analytics';

interface ExportButtonProps {
    data: AnalyticsData;
    timeRange: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, timeRange }) => {
    const [isExporting, setIsExporting] = React.useState(false);

    const exportToPDF = () => {
        setIsExporting(true);
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text('MedLud Analytics Report', 14, 20);

        doc.setFontSize(12);
        doc.text(`Time Period: ${timeRange}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37);

        // Summary Stats
        doc.setFontSize(14);
        doc.text('Summary Statistics', 14, 50);

        autoTable(doc, {
            startY: 55,
            head: [['Metric', 'Value']],
            body: [
                ['Total Users', data.totalUsers.toString()],
                ['Total Appointments', data.totalAppointments.toString()],
                ['Pending Appointments', data.pendingAppointments.toString()],
                ['Active Staff', data.activeStaff.toString()]
            ]
        });

        // Appointments by Category
        const categoryY = (doc as any).lastAutoTable.finalY + 10;
        doc.text('Appointments by Category', 14, categoryY);

        autoTable(doc, {
            startY: categoryY + 5,
            head: [['Category', 'Count']],
            body: data.appointmentsByCategory.map(item => [item.category, item.count.toString()])
        });

        doc.save(`medlud-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
        setIsExporting(false);
    };

    const exportToCSV = () => {
        setIsExporting(true);

        // Prepare data for CSV
        const csvData = [
            ['MedLud Analytics Report'],
            [`Time Period: ${timeRange}`],
            [`Generated: ${new Date().toLocaleDateString()}`],
            [],
            ['Summary Statistics'],
            ['Metric', 'Value'],
            ['Total Users', data.totalUsers],
            ['Total Appointments', data.totalAppointments],
            ['Pending Appointments', data.pendingAppointments],
            ['Active Staff', data.activeStaff],
            [],
            ['Appointments by Category'],
            ['Category', 'Count'],
            ...data.appointmentsByCategory.map(item => [item.category, item.count]),
            [],
            ['User Registrations'],
            ['Date', 'Count'],
            ...data.userRegistrations.map(item => [item.date, item.count])
        ];

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `medlud-analytics-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExporting(false);
    };

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                onClick={exportToPDF}
                disabled={isExporting}
                className="flex items-center gap-2"
            >
                <FileText size={18} />
                Export PDF
            </Button>
            <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={isExporting}
                className="flex items-center gap-2"
            >
                <Download size={18} />
                Export CSV
            </Button>
        </div>
    );
};
