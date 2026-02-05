import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import People from './pages/People';
import CreateGroup from './pages/CreateGroup';
import GroupDetail from './pages/GroupDetail';
import AddExpense from './pages/AddExpense';
import Balances from './pages/Balances';
import SettleUp from './pages/SettleUp';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/people" element={<People />} />
        <Route path="/groups/new" element={<CreateGroup />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/groups/:id/expenses/new" element={<AddExpense />} />
        <Route path="/groups/:id/balances" element={<Balances />} />
        <Route path="/groups/:id/settle" element={<SettleUp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
