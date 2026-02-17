// PACKAGES
import React, { useEffect, useState } from 'react'
import { useNavigate } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Helmet } from 'react-helmet'


// STYLES
import "../styles/DashboardStyle.css";

// COMPONENTS
import Loading from '../components/Loading';

// Images
import Logo from '../images/logo.png'
import { apiFetch, initAuth, logout } from "../api";

function Dashboard() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // ** FETCH USER
    const handleMe = () => {
        apiFetch({ method: "get", url: "/me" })
            .then(response => {
                console.log(response)
                if (response.data?.status) {
                    setUser(response.data);
                }
            }).catch(err => {
                console.log(err)
            })
    }

    // *CHECK IF THERE IS A USER LOGGED
    useEffect(() => {
        let isMounted = true;
        const loadUser = async () => {
            const data = await initAuth();
            if (!isMounted) {
                return;
            }
            if (data?.status) {
                setUser(data);
            } else {
                navigate("/");
            }
            setCheckingAuth(false);
        };
        loadUser();
        return () => {
            isMounted = false;
        };
    }, [navigate]);




    const [selectedSection, setSelectedSection] = useState("Section A");
    const teacherName = user?.first_name
        ? `${user.first_name} ${user.last_name}`
        : "Teacher";

    // Mock data for BMI distribution trend
    const bmiData = [
        {
        week: "Week 1",
        underweight: 8,
        normal: 35,
        overweight: 5,
        },
        {
        week: "Week 2",
        underweight: 7,
        normal: 36,
        overweight: 5,
        },
        {
        week: "Week 3",
        underweight: 6,
        normal: 38,
        overweight: 4,
        },
        {
        week: "Week 4",
        underweight: 5,
        normal: 40,
        overweight: 3,
        },
    ];

    // Mock data for recent updates
    const recentUpdates = [
        {
        id: 1,
        name: "Maria Santos",
        oldBMI: 15.2,
        newBMI: 16.1,
        status: "improved",
        date: "2 hours ago",
        },
        {
        id: 2,
        name: "Juan Dela Cruz",
        oldBMI: 18.5,
        newBMI: 18.8,
        status: "improved",
        date: "5 hours ago",
        },
        {
        id: 3,
        name: "Ana Reyes",
        oldBMI: 17.2,
        newBMI: 17.2,
        status: "stable",
        date: "1 day ago",
        },
        {
        id: 4,
        name: "Carlos Mendoza",
        oldBMI: 19.1,
        newBMI: 18.5,
        status: "declined",
        date: "1 day ago",
        },
        {
        id: 5,
        name: "Sofia Garcia",
        oldBMI: 16.8,
        newBMI: 17.4,
        status: "improved",
        date: "2 days ago",
        },
    ];

    const getCurrentDate = () => {
        const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        };
        return new Date().toLocaleDateString("en-US", options);
    };

    // Navigation Links
    const linkNavigate = (num) => {
        // ? Note 1 = Dashboard, 2 = Profile, 3 = students, 4 = Feeding program
        let myLink = null
        if (num === 1) {
            return
        } else if (num === 2) {
            myLink = "Profile"
        } else if (num === 3) {
            myLink = "Students"
        } else if (num === 4) {
            myLink = "FeedingProgram"
        } else {
            myLink = "404"
        }

        navigate(`/${myLink}`)
    }

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    // *Note: Teacher initials
    const getFirstLetters = (str) => {
        const words = str.split(' ');

        const firstLetters = words.map(word => {
            if (word.length > 0) {
            return word[0]; // Get the first character
            }
            return '';
        });
        return firstLetters.join(''); 
    }
    // *CHECK IF THERE IS A USER LOGGED
    if (checkingAuth) {
        return (
            <div className='comp-loading'>
                <Loading />
            </div>
        )
    }
    if (user == null) {
        return null;
    }

    return (
        <div className="dashboard-container">
            <Helmet>
                <title>Feeding Program | Dashboard</title>
            </Helmet>
            {/* Left Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="dashboard-logo">
                <div className="dashboard-logo-icon">
                    <div className="dashboard-logo-circle">
                        <img src={Logo} alt="logo" />
                    </div>
                    <div className="dashboard-logo-text">
                    <h3>Feeding Program</h3>
                    <p>Teacher Portal</p>
                    </div>
                </div>
                </div>

                <nav className="dashboard-nav" onClick={() => linkNavigate(1)}>
                <button className="dashboard-nav-item active">
                    <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                    </svg>
                    <span>Dashboard</span>
                </button>

                <button className="dashboard-nav-item" onClick={() => linkNavigate(2)}>
                    <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                    </svg>
                    <span>Profile</span>
                </button>

                <button className="dashboard-nav-item" onClick={() => linkNavigate(3)}>
                    <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                    </svg>
                    <span>Students</span>
                </button>

                <button className="dashboard-nav-item" onClick={() => linkNavigate(4)}>
                    <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                    </svg>
                    <span>Feeding Program</span>
                </button>


                <button className="dashboard-nav-item dashboard-nav-logout" onClick={handleLogout}>
                    <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                    />
                    </svg>
                    <span>Logout</span>
                </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Top Header */}
                <header className="dashboard-header">
                <div className="dashboard-header-left">
                    <select
                    className="dashboard-section-select"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                    <option value="Section D">Section D</option>
                    </select>
                </div>

                <div className="dashboard-header-right">
                    <div className="dashboard-date">
                    <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <span>{getCurrentDate()}</span>
                    </div>
                    <div className="dashboard-teacher-info">
                    <div className="dashboard-teacher-avatar">{getFirstLetters(user.first_name)}</div>
                    <span className="dashboard-teacher-name">{teacherName}</span>
                    </div>
                </div>
                </header>

                {/* Dashboard Content */}
                <div className="dashboard-content">
                {/* Dashboard title */}
                <div className="dashboard-title">
                    <h1>Dashboard</h1>
                    <h5>Welcome {teacherName}!</h5>
                </div>
                {/* Summary Cards */}
                <div className="dashboard-summary">
                    <div className="dashboard-card">
                    <div className="dashboard-card-header">
                        <div className="dashboard-card-icon blue">
                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                        </div>
                    </div>
                    <div className="dashboard-card-content">
                        <h3>48</h3>
                        <p>Enrolled Students</p>
                    </div>
                    </div>

                    <div className="dashboard-card">
                    <div className="dashboard-card-header">
                        <div className="dashboard-card-icon orange">
                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        </div>
                    </div>
                    <div className="dashboard-card-content">
                        <h3>5</h3>
                        <p>At-Risk Students</p>
                    </div>
                    </div>

                    <div className="dashboard-card">
                    <div className="dashboard-card-header">
                        <div className="dashboard-card-icon green">
                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        </div>
                    </div>
                    <div className="dashboard-card-content">
                        <h3>
                        <span className="dashboard-card-status completed">
                            <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ width: "1rem", height: "1rem" }}
                            >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                            </svg>
                            Completed
                        </span>
                        </h3>
                        <p>Today's Feeding Status</p>
                    </div>
                    </div>

                    <div className="dashboard-card">
                    <div className="dashboard-card-header">
                        <div className="dashboard-card-icon purple">
                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        </div>
                    </div>
                    <div className="dashboard-card-content">
                        <h3>3</h3>
                        <p>Requiring Attention</p>
                    </div>
                    </div>
                </div>

                {/* Chart and Updates Section */}
                <div className="dashboard-chart-section">
                    {/* BMI Distribution Chart */}
                    <div className="dashboard-chart-card">
                    <div className="dashboard-chart-header">
                        <h3>BMI Distribution Trend</h3>
                        <p>Weekly progress for {selectedSection}</p>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={bmiData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.5rem",
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: "14px" }} />
                        <Bar
                            dataKey="underweight"
                            fill="#fb923c"
                            name="Underweight"
                            radius={[8, 8, 0, 0]}
                        />
                        <Bar
                            dataKey="normal"
                            fill="#22c55e"
                            name="Normal"
                            radius={[8, 8, 0, 0]}
                        />
                        <Bar
                            dataKey="overweight"
                            fill="#3b82f6"
                            name="Overweight"
                            radius={[8, 8, 0, 0]}
                        />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>

                    {/* Recent Updates */}
                    <div className="dashboard-updates-card">
                    <div className="dashboard-updates-header">
                        <h3>Recent BMI Updates</h3>
                        <p>Latest measurements</p>
                    </div>
                    <div className="dashboard-updates-list">
                        {recentUpdates.map((update) => (
                        <div key={update.id} className="dashboard-update-item">
                            <div className="dashboard-update-student">
                            {update.name}
                            </div>
                            <div className="dashboard-update-bmi">
                            {update.oldBMI} → {update.newBMI}
                            <span className={`dashboard-update-arrow ${update.status}`}>
                                {update.status === "improved" && (
                                <>
                                    <svg
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ width: "1rem", height: "1rem" }}
                                    >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                                    />
                                    </svg>
                                    Improved
                                </>
                                )}
                                {update.status === "declined" && (
                                <>
                                    <svg
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ width: "1rem", height: "1rem" }}
                                    >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                    />
                                    </svg>
                                    Needs Attention
                                </>
                                )}
                                {update.status === "stable" && (
                                <>
                                    <svg
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ width: "1rem", height: "1rem" }}
                                    >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 12h14"
                                    />
                                    </svg>
                                    Stable
                                </>
                                )}
                            </span>
                            </div>
                            <div className="dashboard-update-date">{update.date}</div>
                        </div>
                        ))}
                    </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-actions">
                    <div className="dashboard-actions-header">
                    <h3>Quick Actions</h3>
                    </div>
                    <div className="dashboard-actions-buttons">
                    <button className="dashboard-action-button">
                        <div className="dashboard-action-button-icon">
                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                            />
                        </svg>
                        </div>
                        <span>Add Feeding Session</span>
                    </button>

                    <button className="dashboard-action-button">
                        <div className="dashboard-action-button-icon">
                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                        </div>
                        <span>View Students</span>
                    </button>

                    <button className="dashboard-action-button">
                        <div className="dashboard-action-button-icon">
                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        </div>
                        <span>Update Measurement</span>
                    </button>
                    </div>
                </div>
                </div>
            </main>
            <button onClick={handleMe}>click me</button>
    </div>
    )
}

export default Dashboard
