// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { Toaster } from 'react-hot-toast';

// Auth Components
import { RegisterPage } from '@/pages/auth/Register';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPassword';
import { ResetPasswordPage } from '@/pages/auth/ResetPassword';
import { EmailVerificationPage } from '@/pages/auth/EmailVerification';
import { GoogleCallbackPage } from '@/pages/auth/OauthCallback';
import { Login } from '@/components/Loginz';

// Payment Pages
import PlansPage from '@/pages/payment/PlansPage';
import CheckoutPage from '@/pages/payment/CheckoutPage';
import PayoutDashboardPage from '@/pages/payment/PayoutDashboardPage';
import SubscriptionsPage from '@/pages/payment/SubscriptionsPage';
import StripeConnectPage from '@/pages/payment/StripeConnectPage';
import PaymentResultPage from '@/pages/payment/PaymentResultPage';

// Brokers Pages
import { BrokerConnectionsPage } from '@/pages/brokers/BrokerConnectionPage';
import { EditBrokerConnectionPage } from '@/pages/brokers/EditBrokerConnectionPage';
import { NewBrokerConnectionPage } from '@/pages/brokers/NewBrokerConnectionPage';
import { OAuthCallbackPage } from '@/pages/brokers/OauthCallBackPage';

// Trading Components
import { TradingDashboard } from '@/pages/trading/TradingDashboard';
import { BrokerSelection } from '@/pages/trading/BrokerSelection';
import Settings from './pages/settings/SettingsPage';
import PortfolioManager from './pages/portfolio/PortfolioManager';
import { PortfolioSubscriptionPage } from './components/portfolio/PortfolioSubscriptionPage';

// Backtest Components
import { BacktestResults } from '@/components/portfolio/BacktestResults';
import { BacktestList } from '@/components/portfolio/BacktestList'; 

// Other Pages
import Home from './pages/Home';
import Dashboard from '@/pages/Dashboard';
import { ReferralDashboard } from '@/pages/referral/ReferralDashboard';
import { UserProfile } from '@/pages/UserProfile';
import Navbar from '@/components/Navbar';
import { AuthRequired } from '@/components/AuthRequired';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  
  return (
    <AppErrorBoundary>
    <Router>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <Toaster position="top-right" />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <Routes>
           
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/oauth-callback" element={<GoogleCallbackPage />} />
            <Route path="/" element={<Home />} />

            
            
            {/* Protected routes */}
            <Route element={<AuthRequired />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/referrals" element={<ReferralDashboard />} />
              <Route path="/profile" element={<UserProfile />} />
              
              {/* Payment routes */}
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/checkout/:planId" element={<CheckoutPage />} />
              <Route path="/payouts" element={<PayoutDashboardPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/stripe-connect" element={<StripeConnectPage />} />
              <Route path="/payment-result" element={<PaymentResultPage />} />

              {/* Trading routes */}
              <Route path="/trading" element={<BrokerSelection />} />
              <Route path="/trading/:accountId" element={<TradingDashboard />} />
              
              {/* Portfolio routes */}
              <Route path="/portfolio" element={<PortfolioManager />} />
              <Route path="/portfolio/subscriptions" element={<PortfolioSubscriptionPage />} />

              
              {/* Backtest routes */}
              <Route path="/portfolios/backtests" element={<BacktestList />} />
              <Route path="/portfolios/backtests/:backtestId" element={<BacktestResults />} />

              {/* Broker routes */}
              <Route path="/brokers" element={<BrokerConnectionsPage />} />
              <Route path="/brokers/new" element={<NewBrokerConnectionPage />} />
              <Route path="/brokers/edit/:id" element={<EditBrokerConnectionPage />} />
              <Route path="/brokers/oauth-callback" element={<OAuthCallbackPage />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        
        <footer className="bg-gray-100 dark:bg-gray-800 py-6 mt-auto">
          <div className="container mx-auto text-center text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Matrix Trading. All rights reserved.
          </div>
        </footer>
      </div>
    </Router>
  </AppErrorBoundary>
  );
}

export default App;

