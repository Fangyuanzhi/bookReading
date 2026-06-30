import { useState } from 'react';
import { Crown, X } from 'lucide-react';
import api from '../api/config';
import { APP_CLASSES, APP_TYPE } from '../styles/theme';
import { formatPrice } from '../utils/price';

export default function PaymentModal({
  type,
  amount,
  subject,
  description,
  bookId,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        type,
        amount,
        subject,
        description: description || '',
        provider: 'mock',
      };
      if (bookId) payload.book_id = bookId;

      const res = await api.payments.create(payload);
      const paymentId = res.data.payment_id;
      await api.payments.confirm(paymentId);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || '支付失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className={`${APP_CLASSES.card} w-full max-w-md p-6 relative`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-700"
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Crown size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{subject}</h2>
            <p className={APP_TYPE.caption}>{description}</p>
          </div>
        </div>

        <p className="text-3xl font-bold text-gray-900 mb-6">{formatPrice(amount)}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <p className={`${APP_TYPE.caption} mb-4`}>
          演示环境使用模拟支付，点击确认即可完成购买。
        </p>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={`${APP_CLASSES.btnGhost} flex-1`}>
            取消
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className={`${APP_CLASSES.btnPrimary} flex-1`}
          >
            {loading ? '处理中…' : '确认支付'}
          </button>
        </div>
      </div>
    </div>
  );
}
