import { motion } from 'motion/react';

export const Card = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled }) => {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700',
    outline: 'border border-blue-500 text-blue-500 hover:bg-blue-50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 px-4 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({ value, onChange, placeholder, label, className = '' }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
      />
    </div>
  );
};

export const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === tab
              ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
