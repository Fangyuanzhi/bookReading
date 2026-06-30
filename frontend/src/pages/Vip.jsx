import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Check, Receipt } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import PaymentModal from '../components/PaymentModal';
import api from '../api/config';
import { APP_CLASSES, APP_NAME, APP_TYPE } from '../styles/theme';
import { formatPrice } from '../utils/price';

const PERKS = [
  '畅读全部 VIP 专区作品',
  '专属 VIP 标识',
  '支持原创作者持续创作',
  '优先体验新功能',
];

function VipContent() {
  const [pricing, setPricing] = useState(null);
  const [vipStatus, setVipStatus] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pricingRes, vipRes, paymentsRes] = await Promise.all([
        api.payments.pricing(),
        api.vip.status(),
        api.payments.list({ page: 1, page_size: 10 }),
      ]);
      setPricing(pricingRes.data);
      setVipStatus(vipRes.data);
      setPayments(paymentsRes.data?.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  const plan = pricing?.vip_monthly;
  const isVip = vipStatus?.is_vip;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <header className={`${APP_CLASSES.card} p-6 text-center`}>
        <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4">
          <Crown size={28} className="text-white" />
        </div>
        <h1 className={`${APP_TYPE.title} text-gray-900`}>{APP_NAME} VIP</h1>
        <p className={`${APP_TYPE.caption} mt-2`}>
          让阅读更有陪伴感，支持创作者与社区
        </p>

        {isVip ? (
          <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="font-medium text-amber-900">你已是 VIP 会员</p>
            <p className={`${APP_TYPE.caption} mt-1 text-amber-800`}>
              有效期至 {new Date(vipStatus.end_at).toLocaleDateString('zh-CN')}
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(plan?.amount || 1990)}
              <span className="text-base font-normal text-gray-500">/月</span>
            </p>
            <button
              type="button"
              onClick={() => setShowPay(true)}
              className={`${APP_CLASSES.btnPrimary} mt-4 w-full`}
            >
              开通 VIP
            </button>
          </div>
        )}

        {isVip && plan && (
          <button
            type="button"
            onClick={() => setShowPay(true)}
            className={`${APP_CLASSES.btnGhost} mt-4 w-full`}
          >
            续费一个月
          </button>
        )}
      </header>

      <section className={`${APP_CLASSES.card} p-6`}>
        <h2 className="font-medium text-gray-900 mb-4">会员权益</h2>
        <ul className="space-y-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-3 text-gray-700">
              <Check size={18} className="text-emerald-500 shrink-0" />
              {perk}
            </li>
          ))}
        </ul>
      </section>

      {payments.length > 0 && (
        <section className={`${APP_CLASSES.card} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={18} className="text-gray-500" />
            <h2 className="font-medium text-gray-900">支付记录</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {payments.map((p) => (
              <li key={p.id} className="py-3 flex justify-between gap-4 text-sm">
                <div>
                  <p className="text-gray-900">{p.subject}</p>
                  <p className={APP_TYPE.caption}>
                    {new Date(p.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium">{formatPrice(p.amount)}</p>
                  <p className={APP_TYPE.caption}>
                    {p.status === 'paid' ? '已支付' : p.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className={`${APP_TYPE.caption} text-center`}>
        <Link to="/legal" className="hover:text-gray-600">付费服务说明</Link>
      </p>

      {showPay && plan && (
        <PaymentModal
          type="vip"
          amount={plan.amount}
          subject={plan.label}
          description={plan.description}
          onClose={() => setShowPay(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

export default function Vip() {
  return (
    <ProtectedRoute>
      <VipContent />
    </ProtectedRoute>
  );
}
