
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { Tickets } from './pages/Tickets';
import { Users } from './pages/Users';
import { Orders } from './pages/Orders';
import { Categories } from './pages/Categories';
import { Addons } from './pages/Addons';
import { Content } from './pages/Content';
import { ContentPurchases } from './pages/ContentPurchases';
import { AdminLayout } from './components/AdminLayout';
import { PaymentSettings } from './pages/PaymentSettings';
import { Appearance } from './pages/Appearance';
import { ThemeBootstrap } from './theme/ThemeBootstrap';


function App() {
  return (
    <BrowserRouter>
      <ThemeBootstrap />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/addons" element={<Addons />} />
          <Route path="/content" element={<Content />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/content-purchases" element={<ContentPurchases />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/users" element={<Users />} />
          <Route path="/payment-settings" element={<PaymentSettings />} />
          <Route path="/appearance" element={<Appearance />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
