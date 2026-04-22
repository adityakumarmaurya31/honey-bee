import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { API_BASE } from '../admin/api.js';

const UPIPayment = ({ amount, orderId, orderDetails, onPaymentVerified }) => {
  const [upiLink, setUpiLink] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [showManualVerification, setShowManualVerification] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const canvasRef = useRef(null);

  const UPI_ID = 'adikumau@oksbi';
  const BUSINESS_NAME = 'Honey Bee Store';

  useEffect(() => {
    // Generate UPI link
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${Math.round(amount)}&tn=Order%23${orderId}`;
    setUpiLink(upiUrl);

    // Generate QR Code
    QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 300,
    }).then((url) => {
      setQrCode(url);
    }).catch((err) => {
      console.error('Error generating QR code:', err);
    });
  }, [amount, orderId]);

  const handleVerifyPayment = async () => {
    if (!transactionId.trim()) {
      alert('Please enter transaction ID');
      return;
    }

    setVerifying(true);
    try {
      // Call backend to verify payment
      const response = await fetch(`${API_BASE}/api/orders/verify-upi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          orderId,
          amount: Math.round(amount),
          upiId: UPI_ID,
          ...orderDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Payment verified successfully
      onPaymentVerified(data);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${UPI_ID}`);
    alert('UPI ID copied! Payment: ₹' + Math.round(amount));
  };

  return (
    <div className="space-y-6">
      {/* QR Code Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">📱 Scan to Pay</h3>
        
        {qrCode ? (
          <div className="flex flex-col items-center gap-4">
            <img src={qrCode} alt="UPI QR Code" className="w-64 h-64 border-4 border-white rounded-xl shadow-lg" />
            
            <div className="w-full bg-white rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-slate-600 text-center mb-2">UPI ID:</p>
              <div className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg">
                <p className="font-mono text-lg font-bold text-slate-900">{UPI_ID}</p>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="w-full bg-amber-100 border-2 border-amber-300 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-900">₹{Math.round(amount)}</p>
              <p className="text-sm text-amber-700">Order Amount</p>
            </div>

            {/* Payment Instructions */}
            <div className="w-full bg-slate-100 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-slate-900 text-sm">📋 Steps to Pay:</p>
              <ol className="text-sm text-slate-700 space-y-1">
                <li>1. Open any UPI app (Google Pay, PhonePe, etc)</li>
                <li>2. Scan QR code above</li>
                <li>3. Verify amount: ₹{Math.round(amount)}</li>
                <li>4. Complete payment</li>
                <li>5. Enter Transaction ID below</li>
              </ol>
            </div>

            {/* Manual Verification */}
            <button
              onClick={() => setShowManualVerification(!showManualVerification)}
              className="w-full px-4 py-2 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300"
            >
              {showManualVerification ? '✓ Hide Verification' : '+ Enter Transaction ID'}
            </button>

            {showManualVerification && (
              <div className="w-full space-y-3 bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <label className="block">
                  <p className="text-sm font-semibold text-green-900 mb-2">Transaction ID / Reference No:</p>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    placeholder="e.g., UPI123456789ABC or TXN_ID"
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500 font-mono"
                  />
                </label>
                <p className="text-xs text-green-800">
                  💡 Find this in your UPI app's transaction details or confirmation message
                </p>
                <button
                  onClick={handleVerifyPayment}
                  disabled={verifying || !transactionId.trim()}
                  className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying...' : 'Verify Payment'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-64 h-64 mx-auto bg-slate-200 rounded-xl animate-pulse flex items-center justify-center">
            <p className="text-slate-600">Generating QR...</p>
          </div>
        )}
      </div>

      {/* Alternative: Direct UPI Link Button */}
      {upiLink && (
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-indigo-700 mb-3 font-semibold">📲 Or tap to pay directly:</p>
          <a
            href={upiLink}
            className="block w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-center"
          >
            Pay ₹{Math.round(amount)} via UPI
          </a>
        </div>
      )}
    </div>
  );
};

export default UPIPayment;
