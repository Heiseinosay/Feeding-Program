import './output.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'



// PAGES
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import Students from './pages/Students';
import FeedingProgram from './pages/FeedingProgram';
import Profile from './pages/Profile';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />}></Route>
          <Route path="/profile" element={<Profile />}></Route>
          <Route path="/dashboard" element={<Dashboard />}></Route>
          <Route path="/ChangePassword/:userMail/:uid" element={<ChangePassword />}></Route>
          <Route path="/Students" element={<Students />}></Route>
          <Route path="/FeedingProgram" element={<FeedingProgram />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
