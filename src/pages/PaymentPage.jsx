import { useTranslation } from 'react-i18next';
import { Wallet, Sparkles } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { useTezpremium } from '../context/TezpremiumContext';
import { formatBalanceUzs } from '../utils/balanceUzs';

export const PaymentPage = ({ onOpenStars }) => {
  const { t } = useTranslation();
  const { apiUser, loading: apiLoading } = useTezpremium();
  const balanceDisplay =
    apiLoading && !apiUser
      ? '…'
      : formatBalanceUzs(apiUser?.balanceUzs ?? apiUser?.balance ?? 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center px-2">
        {t('payment.subtitle')}
      </p>

      <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-none text-white p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
              {t('profile.balance')}
            </p>
            <p className="text-3xl font-bold">
              {balanceDisplay} {t('profile.balanceCurrency')}
            </p>
          </div>
          <Wallet className="w-8 h-8 text-emerald-200 opacity-50" />
        </div>
        <Button
          variant="secondary"
          className="w-full bg-white/20 hover:bg-white/30 border-none text-white backdrop-blur-sm"
        >
          {t('profile.topup')}
        </Button>
      </Card>

      <Button
        type="button"
        onClick={onOpenStars}
        className="w-full flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {t('payment.openStars')}
      </Button>
    </div>
  );
};
