import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      header: {
        title: 'TWA App'
      },
      nav: {
        referral: 'Referral',
        events: 'Events',
        home: 'Home',
        market: 'Market',
        profile: 'Profile',
        payment: 'Top up'
      },
      payment: {
        subtitle: 'Manage your UZS balance and payments.',
        openStars: 'Buy Stars & Premium'
      },
      referral: {
        title: 'Invite Friends',
        link: 'Your referral link',
        invite: 'Invite Friends',
        copy: 'Copy Link',
        stats: 'Statistics',
        invited: 'Invited Users',
        earned: 'Earned Rewards'
      },
      events: {
        title: 'Events',
        active: 'Active',
        finished: 'Finished',
        reward: 'Reward',
        deadline: 'Deadline'
      },
      home: {
        title: 'Home',
        stars: 'Stars',
        premium: 'Premium',
        username: 'Telegram Username',
        buy: 'Buy',
        success: 'Purchase successful!',
        starsSubtitle: 'Send balance & reactions to anyone',
        premiumSubtitle: 'HD media, faster downloads, unique badges',
        popular: 'Best value',
        perMonth: 'per month avg',
        months: 'months',
        more: 'More',
        customAmount: 'Custom amount',
        customHint: 'Type any number of Stars (price at checkout)',
        premiumCustomMonths: 'Custom period (months)',
        premiumCustomHint: 'Enter months — price shown at checkout'
      },
      market: {
        title: 'Market',
        gifts: 'Gifts',
        nftGifts: 'NFT Gifts',
        recipient: 'Recipient Username',
        send: 'Send',
        rarity: 'Rarity'
      },
      profile: {
        title: 'Profile',
        balance: 'Balance',
        balanceCurrency: 'UZS',
        topup: 'Top up',
        history: 'Transaction History',
        id: 'Telegram ID',
        starsPurchase: 'Stars purchase',
        noStarOrders: 'No orders yet',
        starsOrdersHeader: 'Stars orders',
        starsOrdersSubtitle: '{{count}} purchase(s) — tap to expand',
        starsRowSubtitle: '{{count}} order(s)',
        premiumOrdersHeader: 'Premium',
        premiumRowSubtitle: '{{count}} subscription(s)',
        noPremiumOrders: 'No Premium orders yet',
        giftOrdersHeader: 'Gifts',
        giftRowSubtitle: '{{count}} gift order(s)',
        noGiftOrders: 'No gift orders yet'
      },
      settings: {
        title: 'Settings',
        payments: 'Payments',
        topupHint: 'Top up balance via card (UZS)',
        appearance: 'Appearance',
        darkMode: 'Dark Mode',
        nightMode: 'Night Mode',
        textSize: 'Text Size',
        small: 'Small',
        medium: 'Medium',
        large: 'Large'
      },
      money: {
        title: 'Top up balance',
        close: 'Close',
        method: 'Payment method',
        methodHint:
          'Ignore the payment type field — you can transfer money from any card.',
        cardPayment: 'By card',
        amountLabel: 'Amount (UZS)',
        placeholder: 'e.g. 50 000',
        limits: 'Min: 1 000 UZS · Max: 10 000 000 UZS',
        amountError: 'Amount must be between 1 000 and 10 000 000 UZS',
        submit: 'Continue to payment',
        submitting: 'Sending…',
        waitingTitle: 'Complete the transfer',
        waitingHint: 'Pay from your card to the details below',
        exactHint: 'Send exactly the shown amount — not one som more or less',
        amountDisplay: 'Amount to pay',
        copy: 'Copy',
        copied: '{{label}} copied',
        copyFailed: 'Could not copy',
        cardNumber: 'Card number',
        cardOwner: 'Cardholder',
        timeLeft: 'Time left:',
        autoCheck: 'We check payment status automatically (every 5 seconds)',
        success: 'Payment successful!',
        failed: 'Payment cancelled or failed',
        errorTimeout: 'Time is up ⏰',
        errorFailed: 'Payment cancelled or failed',
        createError: 'Could not create payment',
        requestError: 'Request error',
        paymentOff: 'Payments temporarily disabled',
        paymentOffHint: 'Top-up via the web app is not available right now.',
        payViaBot: 'Use the bot to complete payment.'
      },
      history: {
        openTitle: 'Payments',
        openSubtitle: 'Top-ups & card transfers',
        paymentsTitle: 'Payments',
        paymentsCount: '{{count}} total',
        starsModalTitle: 'Stars orders',
        starsModalCount: '{{count}} orders',
        premiumModalTitle: 'Premium orders',
        premiumModalCount: '{{count}} orders',
        emptyPremiumOrders: 'No Premium orders yet',
        giftModalTitle: 'Gift orders',
        giftModalCount: '{{count}} orders',
        emptyGiftOrders: 'No gift orders yet',
        title: 'History',
        tabOrders: 'Orders ({{count}})',
        tabPayments: 'Payments ({{count}})',
        loading: 'Loading…',
        emptyOrders: 'No orders yet',
        emptyPayments: 'No payments yet',
        orderRow: 'Order',
        paymentRow: 'Payment',
        cardMethod: 'Card',
        unknown: 'Unknown',
        noUsername: 'No username',
        orderSum: 'Paid',
        recipient: 'Recipient',
        orderType: 'Type',
        method: 'Method',
        amount: 'Amount',
        cardNumber: 'Card number',
        timeLeft: 'Time left:',
        pendingHint:
          'Transfer the exact amount to this card; status updates automatically.',
        copied: 'Copied ✓'
      }
    }
  },
  ru: {
    translation: {
      header: {
        title: 'TWA Приложение'
      },
      nav: {
        referral: 'Рефералы',
        events: 'События',
        home: 'Главная',
        market: 'Маркет',
        profile: 'Профиль',
        payment: 'Пополнение'
      },
      payment: {
        subtitle: 'Баланс в UZS и способы оплаты.',
        openStars: 'Купить Stars и Premium'
      },
      referral: {
        title: 'Пригласить друзей',
        link: 'Ваша реферальная ссылка',
        invite: 'Пригласить друзей',
        copy: 'Копировать',
        stats: 'Статистика',
        invited: 'Приглашенные',
        earned: 'Награды'
      },
      events: {
        title: 'События',
        active: 'Активно',
        finished: 'Завершено',
        reward: 'Награда',
        deadline: 'Дедлайн'
      },
      home: {
        title: 'Главная',
        stars: 'Звезды',
        premium: 'Премиум',
        username: 'Имя пользователя Telegram',
        buy: 'Купить',
        success: 'Покупка прошла успешно!',
        starsSubtitle: 'Баланс и реакции любому пользователю',
        premiumSubtitle: 'HD, быстрая загрузка и уникальные значки',
        popular: 'Выгодно',
        perMonth: 'в среднем в месяц',
        months: 'мес.',
        more: 'Ещё',
        customAmount: 'Своя сумма',
        customHint: 'Любое количество Stars (цена при оплате)',
        premiumCustomMonths: 'Свой срок (месяцев)',
        premiumCustomHint: 'Укажите месяцы — цена при оплате'
      },
      market: {
        title: 'Маркет',
        gifts: 'Подарки',
        nftGifts: 'NFT Подарки',
        recipient: 'Имя получателя',
        send: 'Отправить',
        rarity: 'Редкость'
      },
      profile: {
        title: 'Профиль',
        balance: 'Баланс',
        balanceCurrency: 'UZS',
        topup: 'Пополнить',
        history: 'История транзакций',
        id: 'Telegram ID',
        starsPurchase: 'Покупка Stars',
        noStarOrders: 'Заказов пока нет',
        starsOrdersHeader: 'Заказы Stars',
        starsOrdersSubtitle: '{{count}} шт. — нажмите, чтобы открыть',
        starsRowSubtitle: '{{count}} заказ(ов)',
        premiumOrdersHeader: 'Premium',
        premiumRowSubtitle: '{{count}} подписок',
        noPremiumOrders: 'Пока нет заказов Premium',
        giftOrdersHeader: 'Подарки',
        giftRowSubtitle: '{{count}} заказ(ов) подарков',
        noGiftOrders: 'Пока нет заказов подарков'
      },
      settings: {
        title: 'Настройки',
        payments: 'Платежи',
        topupHint: 'Пополнение картой (UZS)',
        appearance: 'Внешний вид',
        darkMode: 'Темный режим',
        nightMode: 'Ночной режим',
        textSize: 'Размер текста',
        small: 'Маленький',
        medium: 'Средний',
        large: 'Большой'
      },
      money: {
        title: 'Пополнение счёта',
        close: 'Закрыть',
        method: 'Способ оплаты',
        methodHint:
          'Не обращайте внимания на поле способа оплаты — перевести можно с любой карты.',
        cardPayment: 'Картой',
        amountLabel: 'Сумма (UZS)',
        placeholder: 'напр. 50 000',
        limits: 'Мин: 1 000 UZS · Макс: 10 000 000 UZS',
        amountError: 'Сумма от 1 000 до 10 000 000 UZS',
        submit: 'Перейти к оплате',
        submitting: 'Отправка…',
        waitingTitle: 'Завершите перевод',
        waitingHint: 'Оплатите с карты по реквизитам ниже',
        exactHint: 'Переведите ровно указанную сумму — ни на сом больше или меньше',
        amountDisplay: 'Сумма платежа',
        copy: 'Копировать',
        copied: '{{label}} скопировано',
        copyFailed: 'Не удалось скопировать',
        cardNumber: 'Номер карты',
        cardOwner: 'Владелец',
        timeLeft: 'Осталось:',
        autoCheck: 'Статус проверяется автоматически (каждые 5 секунд)',
        success: 'Оплата прошла успешно!',
        failed: 'Оплата отменена или не прошла',
        errorTimeout: 'Время вышло ⏰',
        errorFailed: 'Оплата отменена или не прошла',
        createError: 'Не удалось создать платёж',
        requestError: 'Ошибка запроса',
        paymentOff: 'Оплата временно отключена',
        paymentOffHint: 'Сейчас пополнение через веб-приложение недоступно.',
        payViaBot: 'Оформите оплату через бота.'
      },
      history: {
        openTitle: 'Платежи',
        openSubtitle: 'Пополнения и переводы',
        paymentsTitle: 'Платежи',
        paymentsCount: 'Всего: {{count}}',
        starsModalTitle: 'Заказы Stars',
        starsModalCount: '{{count}} заказ(ов)',
        premiumModalTitle: 'Заказы Premium',
        premiumModalCount: '{{count}} заказ(ов)',
        emptyPremiumOrders: 'Пока нет заказов Premium',
        giftModalTitle: 'Заказы подарков',
        giftModalCount: '{{count}} заказ(ов)',
        emptyGiftOrders: 'Пока нет заказов подарков',
        title: 'История',
        tabOrders: 'Заказы ({{count}})',
        tabPayments: 'Платежи ({{count}})',
        loading: 'Загрузка…',
        emptyOrders: 'Заказов пока нет',
        emptyPayments: 'Платежей пока нет',
        orderRow: 'Заказ',
        paymentRow: 'Платёж',
        cardMethod: 'Карта',
        unknown: 'Неизвестно',
        noUsername: 'Нет username',
        orderSum: 'Оплата',
        recipient: 'Получатель',
        orderType: 'Тип',
        method: 'Способ',
        amount: 'Сумма',
        cardNumber: 'Номер карты',
        timeLeft: 'Осталось:',
        pendingHint:
          'Переведите точную сумму на карту; статус обновится автоматически.',
        copied: 'Скопировано ✓'
      }
    }
  },
  uz: {
    translation: {
      header: {
        title: 'TWA Ilovasi'
      },
      nav: {
        referral: 'Referal',
        events: 'Tadbirlar',
        home: 'Asosiy',
        market: 'Market',
        profile: 'Profil',
        payment: 'To\'ldirish'
      },
      payment: {
        subtitle: 'UZS balansi va to\'lovlar.',
        openStars: 'Yulduzlar va Premium'
      },
      referral: {
        title: 'Do\'stlarni taklif qilish',
        link: 'Sizning referal havola',
        invite: 'Do\'stlarni taklif qilish',
        copy: 'Nusxa olish',
        stats: 'Statistika',
        invited: 'Taklif qilinganlar',
        earned: 'Mukofotlar'
      },
      events: {
        title: 'Tadbirlar',
        active: 'Faol',
        finished: 'Tugallangan',
        reward: 'Mukofot',
        deadline: 'Muddati'
      },
      home: {
        title: 'Asosiy',
        stars: 'Yulduzlar',
        premium: 'Premium',
        username: 'Telegram foydalanuvchi nomi',
        buy: 'Sotib olish',
        success: 'Xarid muvaffaqiyatli yakunlandi!',
        starsSubtitle: 'Balans va reaksiyalarni istalgan odamga',
        premiumSubtitle: 'HD media, tez yuklash, noyob nishonlar',
        popular: 'Eng foydali',
        perMonth: 'oyiga o‘rtacha',
        months: 'oy',
        more: 'Ko‘proq',
        customAmount: 'O‘zingiz yozing',
        customHint: 'Istalgan miqdor (narx to‘lovda)',
        premiumCustomMonths: 'Oylar (o‘zingiz yozing)',
        premiumCustomHint: 'Oy sonini kiriting — narx to‘lovda'
      },
      market: {
        title: 'Market',
        gifts: 'Sovg\'alar',
        nftGifts: 'NFT Sovg\'alar',
        recipient: 'Qabul qiluvchi nomi',
        send: 'Yuborish',
        rarity: 'Noyoblik'
      },
      profile: {
        title: 'Profil',
        balance: 'Balans',
        balanceCurrency: 'UZS',
        topup: 'To\'ldirish',
        history: 'Tranzaksiyalar tarixi',
        id: 'Telegram ID',
        starsPurchase: 'Yulduz sotib olish',
        noStarOrders: 'Hozircha buyurtma yo\'q',
        starsOrdersHeader: 'Yulduz buyurtmalari',
        starsOrdersSubtitle: '{{count}} ta — bosib oching',
        starsRowSubtitle: '{{count}} ta buyurtma',
        premiumOrdersHeader: 'Premium',
        premiumRowSubtitle: '{{count}} ta obuna',
        noPremiumOrders: 'Premium buyurtma yo\'q',
        giftOrdersHeader: 'Sovg\'alar',
        giftRowSubtitle: '{{count}} ta sovg\'a buyurtmasi',
        noGiftOrders: 'Sovg\'a buyurtmasi yo\'q'
      },
      settings: {
        title: 'Sozlamalar',
        payments: 'To\'lovlar',
        topupHint: 'Karta orqali balansni to\'ldirish (UZS)',
        appearance: 'Ko\'rinish',
        darkMode: 'Tungi rejim',
        nightMode: 'Night Mode',
        textSize: 'Matn hajmi',
        small: 'Kichik',
        medium: 'O\'rta',
        large: 'Katta'
      },
      money: {
        title: 'Hisobni to\'ldirish',
        close: 'Yopish',
        method: 'To\'lov turi',
        methodHint:
          'To\'lov turi degan joyga e\'tibor bermang! Har qanday kartadan pul otkazishingiz mumkn',
        cardPayment: 'Karta orqali',
        amountLabel: 'To\'lov summasi (UZS)',
        placeholder: 'masalan: 50 000',
        limits: 'Min: 1 000 UZS · Maks: 10 000 000 UZS',
        amountError: 'Summa 1 000 — 10 000 000 UZS oralig\'ida bo\'lishi kerak',
        submit: 'To\'lovga o\'tish',
        submitting: 'Yuborilmoqda…',
        waitingTitle: 'To\'lovni yakunlang',
        waitingHint: 'Kartangizdan quyidagi rekvizitlarga o\'tkazing',
        exactHint: 'Ko\'rsatilgan summadan 1 so\'m ham oshiq yoki kam bo\'lmasin',
        amountDisplay: 'To\'lov summasi',
        copy: 'Nusxa olish',
        copied: '{{label}} nusxalandi',
        copyFailed: 'Nusxalashda xatolik',
        cardNumber: 'Karta raqami',
        cardOwner: 'Karta egasi',
        timeLeft: 'Qolgan vaqt:',
        autoCheck: 'To\'lov holati avtomatik tekshiriladi (har 5 sekundda)',
        success: 'To\'lov muvaffaqiyatli!',
        failed: 'To\'lov bekor qilindi yoki muvaffaqiyatsiz',
        errorTimeout: 'Vaqt tugadi ⏰',
        errorFailed: 'To\'lov bekor qilindi yoki muvaffaqiyatsiz',
        createError: 'To\'lov yaratishda xatolik',
        requestError: 'So\'rovda xatolik',
        paymentOff: 'To\'lov vaqtincha o\'chirilgan',
        paymentOffHint: 'Hozir web appdan to\'lov qilish imkoni yo\'q.',
        payViaBot: 'To\'lovni bot orqali amalga oshiring.'
      },
      history: {
        openTitle: 'To\'lovlar',
        openSubtitle: 'Hisob to\'ldirish va karta',
        paymentsTitle: 'To\'lovlar',
        paymentsCount: 'Jami: {{count}}',
        starsModalTitle: 'Yulduz buyurtmalari',
        starsModalCount: '{{count}} ta buyurtma',
        premiumModalTitle: 'Premium buyurtmalar',
        premiumModalCount: '{{count}} ta buyurtma',
        emptyPremiumOrders: 'Premium buyurtma yo\'q',
        giftModalTitle: 'Sovg\'a buyurtmalari',
        giftModalCount: '{{count}} ta buyurtma',
        emptyGiftOrders: 'Sovg\'a buyurtmasi yo\'q',
        title: 'Tarix',
        tabOrders: 'Buyurtmalar ({{count}})',
        tabPayments: 'To\'lovlar ({{count}})',
        loading: 'Yuklanmoqda…',
        emptyOrders: 'Buyurtmalar yo\'q',
        emptyPayments: 'To\'lovlar yo\'q',
        orderRow: 'Buyurtma',
        paymentRow: 'To\'lov',
        cardMethod: 'Karta orqali',
        unknown: 'Noma\'lum',
        noUsername: 'Username yo\'q',
        orderSum: 'To\'lov',
        recipient: 'Qabul qiluvchi',
        orderType: 'Tur',
        method: 'Usul',
        amount: 'Summa',
        cardNumber: 'Karta raqami',
        timeLeft: 'Qolgan vaqt:',
        pendingHint:
          'Aniq summani shu kartaga o\'tkazing; holat avtomatik yangilanadi.',
        copied: 'Nusxa olindi ✓'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
