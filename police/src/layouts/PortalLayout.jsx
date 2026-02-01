import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    FileText,
    Users,
    AlertTriangle,
    Settings,
    LogOut,
    Menu,
    Bell,
    FileBox
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PortalLayout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="portal-wrapper">
            <aside className="portal-sidebar">
                <div className="sidebar-header">
                    <div className="badge-logo">MPD</div>
                    <span className="platform-name">OFFICER<br />PORTAL</span>
                </div>

                <div className="user-brief">
                    <div className="avatar-circle">{user?.avatar || 'O'}</div>
                    <div>
                        <div className="user-name">{user?.name || 'Officer'}</div>
                        <div className="user-badge">Badge #{user?.badge || '0000'}</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/portal" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </NavLink>
                    <NavLink to="/portal/dispatch" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <AlertTriangle size={20} /> Dispatch / CAD
                    </NavLink>
                    <NavLink to="/portal/citations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FileBox size={20} /> e-Citations
                    </NavLink>
                    <NavLink to="/portal/evidence" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Package size={20} /> Evidence Locker
                    </NavLink>
                    <NavLink to="/portal/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FileText size={20} /> Reports & CMS
                    </NavLink>
                    <NavLink to="/portal/roster" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={20} /> Duty Roster
                    </NavLink>
                    <NavLink to="/portal/bolo" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <AlertTriangle size={20} /> Active BOLOs
                    </NavLink>

                    <div className="nav-spacer"></div>

                    <NavLink to="/portal/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Settings size={20} /> Settings
                    </NavLink>
                    <button onClick={logout} className="nav-item logout" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}>
                        <LogOut size={20} /> Sign Out
                    </button>
                </nav>
            </aside>

            <div className="portal-content-area">
                <header className="portal-header">
                    <h2 className="page-title">Metro Police Dept. secure intranet</h2>
                    <div className="header-actions">
                        <button className="icon-btn"><Bell size={20} /></button>
                        <span className="connection-status">CONNECTED SECURE - v4.2.0</span>
                    </div>
                </header>

                <main className="portal-scroll-area">
                    <Outlet />
                </main>
            </div>

            <style>{`
        .portal-wrapper { display: flex; height: 100vh; background: #f1f5f9; overflow: hidden; }
        
        .portal-sidebar {
          width: 260px;
          background: #0f172a;
          color: white;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .sidebar-header {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .badge-logo {
          width: 40px; height: 40px; background: var(--accent-blue);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          font-weight: 800; color: white;
        }
        
        .platform-name { font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; line-height: 1.2; color: #94a3b8; }

        .user-brief {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255,255,255,0.03);
          margin-bottom: 1rem;
        }

        .avatar-circle {
          width: 36px; height: 36px; background: #334155; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600;
        }
        .user-name { font-size: 0.9rem; font-weight: 600; }
        .user-badge { font-size: 0.75rem; color: #94a3b8; }

        .sidebar-nav { padding: 0 1rem; display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
        .nav-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: #94a3b8;
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
        .nav-item.active { background: var(--accent-blue); color: white; }
        .nav-spacer { flex: 1; }
        .nav-item.logout { color: #ef4444; }
        .nav-item.logout:hover { background: rgba(239, 68, 68, 0.1); }

        .portal-content-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        
        .portal-header {
          height: 64px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
        }
        .page-title { font-size: 1rem; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
        .connection-status { font-size: 0.75rem; color: #10b981; font-family: monospace; background: #ecfdf5; padding: 2px 6px; border-radius: 4px; }
        .icon-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 0.5rem; border-radius: 50%; display: flex; align-items: center;}
        .icon-btn:hover { background: #f1f5f9; color: var(--primary-blue); }
        
        .portal-scroll-area { flex: 1; overflow-y: auto; padding: 2rem; }
      `}</style>
        </div>
    );
};

export default PortalLayout;
