import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { isLiveMode } from '../config/appMode';
import { useGetInvoiceQuery } from '../store/apiSlice';
import { formatCurrency } from '../utils/formatCurrency';
import { formatMonthYear } from '../utils/formatDate';
import { generateInvoiceNumber } from '../utils/generateInvoiceNumber';
import societyConfig from '../config/society';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ArrowLeft, Download, Printer } from 'lucide-react';

export default function InvoiceView() {
  const { flatNumber, month } = useParams();
  const navigate = useNavigate();
  const { members, payments } = useData();

  // Live: fetch the server-built invoice via RTK Query. Demo: fall back to DataContext.
  const { data: invoiceData } = useGetInvoiceQuery({ flatNumber, month }, { skip: !isLiveMode });
  const member = invoiceData?.member || members.find((m) => m.flatNumber === flatNumber);
  const payment = invoiceData?.payment || payments.find((p) => p.flatNumber === flatNumber && p.month === month);

  const invoiceNumber = generateInvoiceNumber(flatNumber, month);
  const [year, mon] = month.split('-');
  const invoiceDate = `${year}-${mon}-01`;
  const dueDate = `${year}-${mon}-${String(societyConfig.maintenanceDueDay).padStart(2, '0')}`;
  const monthYear = formatMonthYear(month);

  const amount = payment?.amount || societyConfig.monthlyMaintenance;
  // Payments carry totalDue (base + late fee) but no separate lateFee field; derive it so the
  // invoice itemizes correctly and the total matches what the resident actually owes.
  const lateFee = payment?.lateFee ?? Math.max((payment?.totalDue ?? amount) - amount, 0);
  const total = amount + lateFee;

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const downloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Header - Society Name
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(societyConfig.name, margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(societyConfig.fullAddress, margin, y);
    y += 5;
    doc.text(`Phone: ${societyConfig.phone}  |  Email: ${societyConfig.email}`, margin, y);
    y += 5;

    // Invoice Title - right aligned
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('MAINTENANCE INVOICE', pageWidth - margin, 20, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Invoice: ${invoiceNumber}`, pageWidth - margin, 28, { align: 'right' });
    doc.text(`Date: ${formatDisplayDate(invoiceDate)}`, pageWidth - margin, 33, { align: 'right' });
    doc.text(`Due: ${formatDisplayDate(dueDate)}`, pageWidth - margin, 38, { align: 'right' });

    // Divider
    y += 3;
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Bill To
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text('BILL TO', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40);
    doc.setFontSize(10);
    doc.text(member?.name || 'Resident', margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Flat: ${flatNumber}`, margin, y);
    y += 5;
    if (member?.phone) {
      doc.text(`Phone: ${member.phone}`, margin, y);
      y += 5;
    }
    y += 5;

    // Line Items Table
    const tableBody = [
      [`Monthly Maintenance - ${monthYear}`, formatCurrency(amount)],
    ];
    if (lateFee > 0) {
      tableBody.push(['Late Fee', formatCurrency(lateFee)]);
    }

    doc.autoTable({
      startY: y,
      head: [['Description', 'Amount']],
      body: tableBody,
      foot: [['Total', formatCurrency(total)]],
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
      },
      footStyles: {
        fillColor: [245, 245, 245],
        textColor: [30, 30, 30],
        fontStyle: 'bold',
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 45, halign: 'right' },
      },
    });

    y = doc.lastAutoTable.finalY + 15;

    // Payment Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text('Payment Details', margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);

    const paymentLines = [
      ['Bank', societyConfig.bankName],
      ['Account', societyConfig.accountNumber],
      ['IFSC', societyConfig.ifscCode],
      ['UPI', societyConfig.upiId],
    ];

    paymentLines.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 25, y);
      y += 5;
    });

    // Footer
    y += 15;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      'This is a computer-generated invoice and does not require a signature.',
      pageWidth / 2,
      y,
      { align: 'center' }
    );
    y += 5;
    doc.text(
      `${societyConfig.name} | ${new Date().getFullYear()}`,
      pageWidth / 2,
      y,
      { align: 'center' }
    );

    doc.save(`Invoice-${flatNumber}-${month}.pdf`);
  };

  if (!member) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Member not found for flat {flatNumber}.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-600 hover:underline text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 no-print">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadPDF}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-white max-w-2xl mx-auto p-8 shadow-lg border border-gray-200 rounded-lg print:shadow-none print:border-none print:rounded-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{societyConfig.name}</h1>
            <p className="text-sm text-gray-600 mt-1">{societyConfig.fullAddress}</p>
            <p className="text-sm text-gray-600">Phone: {societyConfig.phone}</p>
            <p className="text-sm text-gray-600">Email: {societyConfig.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-blue-700">MAINTENANCE INVOICE</h2>
            <p className="text-sm text-gray-600 mt-1">Invoice: {invoiceNumber}</p>
            <p className="text-sm text-gray-600">Date: {formatDisplayDate(invoiceDate)}</p>
            <p className="text-sm text-gray-600">Due: {formatDisplayDate(dueDate)}</p>
          </div>
        </div>

        <hr className="border-gray-300 mb-6" />

        {/* Bill To */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
          <p className="text-sm text-gray-600">Flat: {flatNumber}</p>
          {member.phone && <p className="text-sm text-gray-600">Phone: {member.phone}</p>}
        </div>

        {/* Line Items Table */}
        <div className="mb-6">
          <table className="w-full text-sm border border-gray-300">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="text-left px-4 py-2.5 font-semibold">Description</th>
                <th className="text-right px-4 py-2.5 font-semibold w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-2.5 text-gray-800">Monthly Maintenance - {monthYear}</td>
                <td className="px-4 py-2.5 text-right text-gray-800">{formatCurrency(amount)}</td>
              </tr>
              {lateFee > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2.5 text-gray-800">Late Fee</td>
                  <td className="px-4 py-2.5 text-right text-gray-800">{formatCurrency(lateFee)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-2.5 text-gray-900">Total</td>
                <td className="px-4 py-2.5 text-right text-gray-900">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Details */}
        <div className="mb-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">Bank:</span>
            <span className="text-gray-800">{societyConfig.bankName}</span>
            <span className="text-gray-500">Account:</span>
            <span className="text-gray-800">{societyConfig.accountNumber}</span>
            <span className="text-gray-500">IFSC:</span>
            <span className="text-gray-800">{societyConfig.ifscCode}</span>
            <span className="text-gray-500">UPI:</span>
            <span className="text-gray-800">{societyConfig.upiId}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 text-center">
          <p className="text-xs text-gray-400">
            This is a computer-generated invoice and does not require a signature.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {societyConfig.name} &bull; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
