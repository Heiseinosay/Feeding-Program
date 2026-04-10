// PACKAGES
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from "react-router";
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { initAuth, logout } from "../api";

const formatNutriBotIntentLabel = (intent) => {
    const labelMap = {
        list_at_risk_students: "List at-risk students",
        count_at_risk_students: "Count at-risk students",
        list_students_by_bmi_category: "List students by BMI category",
        list_at_risk_recently_absent_students: "List at-risk students absent from the latest feeding session",
        find_student: "Find a student",
        summarise_section_nutrition_status: "Summarize section nutrition status",
        get_student_bmi_history: "Get student BMI history",
        get_student_latest_bmi: "Get student latest BMI",
        list_students_missing_recent_measurement: "List students missing recent measurement",
    };

    return labelMap[intent] || String(intent || "")
        .split("_")
        .filter(Boolean)
        .map((word) => (word.toLowerCase() === "bmi" ? "BMI" : `${word[0]?.toUpperCase() || ""}${word.slice(1)}`))
        .join(" ");
};

const formatNutriBotDate = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value || "-";
    }

    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const formatOrdinalLabel = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) {
        return `${value}`;
    }

    const mod100 = number % 100;
    if (mod100 >= 11 && mod100 <= 13) {
        return `${number}th`;
    }

    const mod10 = number % 10;
    if (mod10 === 1) {
        return `${number}st`;
    }
    if (mod10 === 2) {
        return `${number}nd`;
    }
    if (mod10 === 3) {
        return `${number}rd`;
    }
    return `${number}th`;
};

const NutriBotChat = React.memo(function NutriBotChat({
    isChatOpen,
    isChatExpanded,
    chatMessages,
    onOpen,
    onClose,
    onToggleExpanded,
    onExpandChat,
    onSendMessage,
}) {
    const [chatDraft, setChatDraft] = useState("");
    const [expandedTableMessageId, setExpandedTableMessageId] = useState(null);
    const chatHistoryRef = useRef(null);

    const handleExpandTable = (messageId) => {
        onExpandChat();
        setExpandedTableMessageId(messageId);
    };

    const handleSend = () => {
        const trimmedMessage = String(chatDraft || "").trim();
        if (!trimmedMessage) {
            return;
        }

        onSendMessage(trimmedMessage);
        setChatDraft("");
        window.requestAnimationFrame(() => {
            const historyElement = chatHistoryRef.current;
            if (!historyElement) {
                return;
            }
            historyElement.scrollTop = historyElement.scrollHeight;
        });
    };

    const handleNutriBotKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={`dashboard-chat-shell ${isChatOpen ? "is-open" : ""} ${isChatExpanded ? "is-expanded" : ""}`}>
            <button
                type="button"
                className={`dashboard-chat-launcher ${isChatOpen ? "is-hidden" : ""}`}
                onClick={onOpen}
                aria-label="Open NutriBot"
            >
                <span className="dashboard-chat-launcher-glow"></span>
                <span className="dashboard-chat-launcher-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M8 10h8M8 14h5m7-2c0 4.418-3.582 8-8 8a8.84 8.84 0 01-4.083-.98L4 20l1.145-3.054A7.965 7.965 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                        />
                    </svg>
                </span>
                <span className="dashboard-chat-launcher-text">
                    <strong>NutriBot</strong>
                    <small>Ask about nutrition data</small>
                </span>
            </button>

            <section
                className={`dashboard-chat-panel ${isChatOpen ? "is-open" : ""} ${isChatExpanded ? "is-expanded" : ""}`}
                aria-hidden={!isChatOpen}
            >
                <div className="dashboard-chat-header">
                    <div className="dashboard-chat-brand">
                        <div className="dashboard-chat-avatar">N</div>
                        <div>
                            <h3>NutriBot</h3>
                            <p>Nutrition assistant preview</p>
                        </div>
                    </div>

                    <div className="dashboard-chat-controls">
                        <button
                            type="button"
                            className="dashboard-chat-control"
                            onClick={onToggleExpanded}
                            aria-label={isChatExpanded ? "Exit full size chat" : "Open full size chat"}
                            title={isChatExpanded ? "Exit full size chat" : "Open full size chat"}
                        >
                            {isChatExpanded ? (
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 15H5v4m0-4l5 5M15 9h4V5m0 4l-5-5" />
                                </svg>
                            ) : (
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 3h6v6m0-6l-7 7M9 21H3v-6m0 6l7-7" />
                                </svg>
                            )}
                        </button>
                        <button
                            type="button"
                            className="dashboard-chat-control"
                            onClick={onClose}
                            aria-label="Minimize NutriBot"
                            title="Minimize"
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 12h12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div ref={chatHistoryRef} className="dashboard-chat-history">
                    <div className="dashboard-chat-day-label">Today</div>
                    {chatMessages.map((message) => (
                        <div
                            key={message.id}
                            className={`dashboard-chat-message ${message.role === "user" ? "is-user" : "is-bot"}`}
                        >
                            <div className="dashboard-chat-bubble">
                                {message.contentType === "capabilities" ? (
                                    <>
                                        <p>{message.text}</p>
                                        <ul>
                                            {(message.capabilities || []).map((capability, index) => (
                                                <li key={`${capability.intent || "capability"}_${index}`}>
                                                    <strong>{formatNutriBotIntentLabel(capability.intent)}:</strong>{" "}
                                                    {Array.isArray(capability.sample_questions)
                                                        ? capability.sample_questions.join("; ")
                                                        : ""}
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                ) : message.contentType === "table" ? (
                                    <>
                                        <p>{message.text}</p>
                                        <div className="dashboard-chat-table-actions">
                                            <button
                                                type="button"
                                                className="dashboard-chat-table-toggle"
                                                onClick={() => handleExpandTable(message.id)}
                                            >
                                                Expand table
                                            </button>
                                        </div>
                                        <div className="dashboard-chat-table-wrap">
                                            <table className="dashboard-chat-table">
                                                <thead>
                                                    <tr>
                                                        {(message.columns || []).map((column) => (
                                                            <th key={column}>{column}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(message.rows || []).map((row, rowIndex) => (
                                                        <tr key={`${message.id}_row_${rowIndex}`}>
                                                            {row.map((cell, cellIndex) => (
                                                                <td key={`${message.id}_cell_${rowIndex}_${cellIndex}`}>{cell}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : message.contentType === "typing" ? (
                                    <div className="dashboard-chat-typing" aria-label="NutriBot is typing">
                                        <span className="dashboard-chat-typing-dot"></span>
                                        <span className="dashboard-chat-typing-dot"></span>
                                        <span className="dashboard-chat-typing-dot"></span>
                                    </div>
                                ) : (
                                    <p>{message.text}</p>
                                )}
                                {message.contentType !== "typing" && <span>{message.timestamp}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {expandedTableMessageId && (() => {
                    const expandedMessage = chatMessages.find((message) => message.id === expandedTableMessageId);
                    if (!expandedMessage || expandedMessage.contentType !== "table") {
                        return null;
                    }

                    return (
                        <div className="dashboard-chat-table-modal" role="dialog" aria-modal="true" aria-label="Expanded NutriBot table">
                            <div className="dashboard-chat-table-modal-card">
                                <div className="dashboard-chat-table-modal-header">
                                    <div>
                                        <h4>NutriBot Table View</h4>
                                        <p>{expandedMessage.text}</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="dashboard-chat-table-modal-close"
                                        onClick={() => setExpandedTableMessageId(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                                <div className="dashboard-chat-table-modal-wrap">
                                    <table className="dashboard-chat-table">
                                        <thead>
                                            <tr>
                                                {(expandedMessage.columns || []).map((column) => (
                                                    <th key={`expanded_${column}`}>{column}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(expandedMessage.rows || []).map((row, rowIndex) => (
                                                <tr key={`${expandedMessage.id}_expanded_row_${rowIndex}`}>
                                                    {row.map((cell, cellIndex) => (
                                                        <td key={`${expandedMessage.id}_expanded_cell_${rowIndex}_${cellIndex}`}>{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="dashboard-chat-composer">
                    <div className="dashboard-chat-composer-top">
                        <span>Message NutriBot</span>
                        <span>{chatDraft.length}/500</span>
                    </div>
                    <textarea
                        className="dashboard-chat-textarea"
                        placeholder="Ask about feeding sessions, BMI trends, or at-risk students..."
                        value={chatDraft}
                        onChange={(event) => setChatDraft(event.target.value.slice(0, 500))}
                        onKeyDown={handleNutriBotKeyDown}
                        rows={isChatExpanded ? 4 : 3}
                    />
                    <div className="dashboard-chat-composer-actions">
                        <button
                            type="button"
                            className="dashboard-chat-secondary"
                            onClick={() => setChatDraft("")}
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            className="dashboard-chat-send"
                            onClick={handleSend}
                            disabled={!chatDraft.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
});

function Dashboard() {
    const initialChatMessages = [
        {
            id: "nutribot_welcome",
            role: "bot",
            text: "Hi, I'm NutriBot. I can help explain BMI trends, feeding session summaries, and student nutrition questions.",
            timestamp: "Just now",
        },
    ];

    const navigate = useNavigate()
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [studentsFetchDone, setStudentsFetchDone] = useState(false);
    const [students, setStudents] = useState([]);
    const [sections, setSections] = useState([]);
    const [statusSummaryRows, setStatusSummaryRows] = useState([]);
    const [bmiTrendRows, setBmiTrendRows] = useState([]);
    const [nearestSessionStatus, setNearestSessionStatus] = useState({
        kind: "empty",
        title: "Empty",
        description: "No upcoming feeding program",
    });
    const [totalCompletedSessions, setTotalCompletedSessions] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [chatMessages, setChatMessages] = useState(initialChatMessages);

    // * FETCH USER
    // * FOR TESTING ONLY
    /*
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
    } */

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

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        let isMounted = true;
        setStudentsFetchDone(false);

        axios
            .get("/api/get_all_students", {
                params: { userId: user.id },
            })
            .then((response) => {
                const data = response.data;
                if (!data?.status) {
                    console.warn("Dashboard get_all_students failed:", data);
                    return;
                }

                const students = Array.isArray(data.students) ? data.students : [];
                setStudents(students)
                // console.log("Dashboard students:", students);
            })
            .catch((error) => {
                console.error("Dashboard get_all_students error:", error);
            })
            .finally(() => {
                if (!isMounted) {
                    return;
                }
                setStudentsFetchDone(true);
            });

        return () => {
            isMounted = false;
        };
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        axios.get("/api/get_all_section", {
            params: {
                userId: user.id,
            }
        })
        .then((response) => {
            const data = response.data;
            // console.log(data)
            if (!data?.status) {
                setSections([]);
                return;
            }

            const fetchedSections = (data.sections || []).map((section) => ({
                ...section,
                createdAt: section.createdAt
                    ? new Date(section.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })
                    : "",
            }));

            setSections(fetchedSections);
            // console.log("Sections: ", fetchedSections)
        })
        .catch((error) => {
            console.error("Fetching sections error:", error);
        });
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        axios
            .get("/api/get_all_status_count", {
                params: { userId: user.id },
            })
            .then((response) => {
                const data = response.data;
                if (!data?.status) {
                    console.warn("Dashboard get_all_status_count failed:", data);
                    setStatusSummaryRows([]);
                    return;
                }
                const summaryRows = Array.isArray(data.Summary) ? data.Summary : [];
                setStatusSummaryRows(summaryRows);
                // console.log("Dashboard status summary:", summaryRows);
            })
            .catch((error) => {
                console.error("Dashboard get_all_status_count error:", error);
                setStatusSummaryRows([]);
            });
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) {
            setBmiTrendRows([]);
            return;
        }

        axios
            .get("/api/get_bmi_trend", {
                params: { userId: user.id },
            })
            .then((response) => {
                const data = response.data;
                if (!data?.status) {
                    console.warn("Dashboard get_bmi_trend failed:", data);
                    setBmiTrendRows([]);
                    return;
                }

                const summaryRows = Array.isArray(data.Summary) ? data.Summary : [];
                setBmiTrendRows(summaryRows);
                // console.log("Dashboard BMI trend:", summaryRows);
            })
            .catch((error) => {
                console.error("Dashboard get_bmi_trend error:", error);
                setBmiTrendRows([]);
            });
    }, [user?.id]);


    useEffect(() => {
        const emptyState = {
            kind: "empty",
            title: "Empty",
            description: "No upcoming feeding program",
        };

        if (!user?.id) {
            setNearestSessionStatus(emptyState);
            setTotalCompletedSessions(0);
            return;
        }

        const toLocalDateOnly = (value) => {
            const raw = String(value ?? "").trim();
            if (!raw) {
                return null;
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                const [year, month, day] = raw.split("-").map(Number);
                return new Date(year, month - 1, day);
            }
            const parsed = new Date(raw);
            if (Number.isNaN(parsed.getTime())) {
                return null;
            }
            return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        };

        axios
            .get("/api/get_nearest_upcoming_session", {
                params: { userId: user.id },
            })
            .then((response) => {
                const data = response.data;
                if (!data?.status) {
                    setNearestSessionStatus(emptyState);
                    setTotalCompletedSessions(0);
                    return;
                }

                const totalCompleted = Number(data.totalCompleted ?? 0);
                setTotalCompletedSessions(Number.isNaN(totalCompleted) ? 0 : totalCompleted);

                const nearestSession = data.nearestSession || (Array.isArray(data.sessions) ? data.sessions[0] : null);
                if (!nearestSession) {
                    setNearestSessionStatus(emptyState);
                    return;
                }

                const sessionDateRaw = Array.isArray(nearestSession)
                    ? nearestSession[1]
                    : nearestSession?.session_date ?? nearestSession?.sessionDate;
                const sessionDate = toLocalDateOnly(sessionDateRaw);

                if (!sessionDate) {
                    setNearestSessionStatus(emptyState);
                    return;
                }

                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const dayMs = 1000 * 60 * 60 * 24;
                const daysUntil = Math.round((sessionDate.getTime() - today.getTime()) / dayMs);

                if (daysUntil <= 0) {
                    setNearestSessionStatus({
                        kind: "today",
                        title: "Today",
                        description: "Feeding program is scheduled today",
                    });
                    return;
                }

                setNearestSessionStatus({
                    kind: "upcoming",
                    title: "Upcoming",
                    description: `${daysUntil} day${daysUntil === 1 ? "" : "s"} before nearest feeding program`,
                });
            })
            .catch((error) => {
                console.error("Dashboard get_nearest_upcoming_session error:", error);
                setNearestSessionStatus(emptyState);
                setTotalCompletedSessions(0);
            });
    }, [user?.id]);




    const [selectedSection, setSelectedSection] = useState("all");
    const teacherName = user?.first_name
        ? `${user.first_name} ${user.last_name}`
        : "Teacher";
    const selectedSectionLabel =
        selectedSection === "all"
            ? "All Sections"
            : (sections.find((section) => section.id === selectedSection)?.name || "All Sections");

    const getLatestBmiStatus = (value) => {
        let parsed = value;

        if (typeof parsed === "string") {
            const raw = parsed.trim();
            if (!raw) {
                return "";
            }
            try {
                parsed = JSON.parse(raw);
            } catch (error) {
                parsed = raw;
            }
        }

        let latest = parsed;
        if (Array.isArray(parsed)) {
            latest = parsed.length ? parsed[parsed.length - 1] : "";
        }

        const normalized = String(latest ?? "")
            .trim()
            .replace(/^"+|"+$/g, "")
            .toLowerCase();

        return normalized;
    };

    const studentsInScope = selectedSection === "all"
        ? students
        : students.filter((student) => {
            const sectionId = Array.isArray(student)
                ? student[6]
                : student?.section_id ?? student?.sectionId ?? "";
            return String(sectionId) === String(selectedSection);
        });

    const atRiskStudentsCount = studentsInScope.reduce((count, student) => {
        const bmiStatusRaw = Array.isArray(student)
            ? student[11]
            : student?.bmi_measurement ?? student?.bmiStatus ?? student?.bmi_status ?? "";
        const latestStatus = getLatestBmiStatus(bmiStatusRaw);
        if (latestStatus === "underweight" || latestStatus === "overweight") {
            return count + 1;
        }
        return count;
    }, 0);

    const bmiData = useMemo(() => {
        const parseCount = (value) => {
            const parsed = Number(value);
            return Number.isNaN(parsed) ? 0 : parsed;
        };

        const formatMonthLabel = (rawMonth) => {
            const parsedDate = new Date(rawMonth);
            if (Number.isNaN(parsedDate.getTime())) {
                return String(rawMonth || "");
            }
            return parsedDate.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
                timeZone: "UTC",
            });
        };

        const normalizedRows = statusSummaryRows
            .map((row) => {
                if (!Array.isArray(row) || row.length < 5) {
                    return null;
                }

                return {
                    sectionId: String(row[0] ?? ""),
                    month: String(row[1] ?? ""),
                    overweight: parseCount(row[2]),
                    normal: parseCount(row[3]),
                    underweight: parseCount(row[4]),
                };
            })
            .filter(Boolean)
            .filter((row) => row.month);

        const filteredRows = selectedSection === "all"
            ? normalizedRows
            : normalizedRows.filter((row) => row.sectionId === String(selectedSection));

        const monthlyTotalsMap = new Map();
        filteredRows.forEach((row) => {
            if (!monthlyTotalsMap.has(row.month)) {
                monthlyTotalsMap.set(row.month, {
                    month: row.month,
                    overweight: 0,
                    normal: 0,
                    underweight: 0,
                });
            }

            const aggregate = monthlyTotalsMap.get(row.month);
            aggregate.overweight += row.overweight;
            aggregate.normal += row.normal;
            aggregate.underweight += row.underweight;
        });

        const chartRows = Array.from(monthlyTotalsMap.values())
            .sort((left, right) => {
                const leftTime = Date.parse(left.month);
                const rightTime = Date.parse(right.month);
                const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
                const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
                return safeLeft - safeRight;
            })
            .slice(-4)
            .map((row) => ({
                month: formatMonthLabel(row.month),
                underweight: row.underweight,
                normal: row.normal,
                overweight: row.overweight,
            }));

        return chartRows;
    }, [statusSummaryRows, selectedSection]);

    const bmiLineData = useMemo(() => {
        const toMonthLabel = (rawMonth) => {
            const raw = String(rawMonth ?? "").trim();
            if (!raw) {
                return "";
            }
            const [yearStr, monthStr] = raw.split("-");
            const year = Number(yearStr);
            const month = Number(monthStr);
            if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
                return raw;
            }
            return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
                timeZone: "UTC",
            });
        };

        const normalizedRows = bmiTrendRows
            .map((row) => {
                if (!Array.isArray(row) || row.length < 3) {
                    return null;
                }

                const sectionId = String(row[0] ?? "");
                const measurementMonth = String(row[1] ?? "").trim();
                const averageBmi = Number(row[2]);

                if (!measurementMonth || Number.isNaN(averageBmi)) {
                    return null;
                }

                return {
                    sectionId,
                    measurementMonth,
                    averageBmi: Number(averageBmi.toFixed(2)),
                };
            })
            .filter(Boolean);

        const filteredRows = selectedSection === "all"
            ? normalizedRows
            : normalizedRows.filter((row) => row.sectionId === String(selectedSection));

        const monthlyMap = new Map();
        filteredRows.forEach((row) => {
            if (!monthlyMap.has(row.measurementMonth)) {
                monthlyMap.set(row.measurementMonth, {
                    measurementMonth: row.measurementMonth,
                    totalAverageBmi: 0,
                    rowCount: 0,
                });
            }

            const aggregate = monthlyMap.get(row.measurementMonth);
            aggregate.totalAverageBmi += row.averageBmi;
            aggregate.rowCount += 1;
        });

        return Array.from(monthlyMap.values())
            .sort((left, right) => left.measurementMonth.localeCompare(right.measurementMonth))
            .slice(-6)
            .map((row) => ({
                month: toMonthLabel(row.measurementMonth),
                averageBmi: Number((row.totalAverageBmi / Math.max(row.rowCount, 1)).toFixed(2)),
            }));
    }, [bmiTrendRows, selectedSection]);

    const parseHistoryArray = (value) => {
        if (Array.isArray(value)) {
            return value;
        }
        if (value == null) {
            return [];
        }
        const raw = String(value).trim();
        if (!raw) {
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            return [raw];
        }
    };

    const normalizeBmiStatus = (value) => {
        const status = String(value ?? "")
            .trim()
            .replace(/^"+|"+$/g, "")
            .toLowerCase();
        if (status === "normal" || status === "underweight" || status === "overweight") {
            return status;
        }
        return "";
    };

    const getUpdateStatus = (previousStatus, currentStatus) => {
        if (!previousStatus || !currentStatus || previousStatus === currentStatus) {
            return "stable";
        }
        const prevRisk = previousStatus === "underweight" || previousStatus === "overweight";
        const currentRisk = currentStatus === "underweight" || currentStatus === "overweight";
        if (prevRisk && currentStatus === "normal") {
            return "improved";
        }
        if (previousStatus === "normal" && currentRisk) {
            return "declined";
        }
        return "declined";
    };

    const getDaysAgoLabel = (value) => {
        if (!value) {
            return "-";
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return "-";
        }
        const diffMs = Math.max(0, Date.now() - parsed.getTime());
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (days <= 0) {
            return "Today";
        }
        if (days === 1) {
            return "1 day ago";
        }
        return `${days} days ago`;
    };

    const recentUpdates = useMemo(() => {
        const toNumber = (value) => {
            const parsed = Number(value);
            return Number.isNaN(parsed) ? null : Number(parsed.toFixed(1));
        };

        const updates = students
            .map((student, index) => {
                const isArrayRow = Array.isArray(student);
                const studentId = isArrayRow ? student[0] : student?.student_id ?? student?.id ?? index;
                const firstName = isArrayRow ? student[1] : student?.first_name ?? student?.firstName ?? "";
                const lastName = isArrayRow ? student[2] : student?.last_name ?? student?.lastName ?? "";
                const bmiHistoryRaw = isArrayRow ? student[10] : student?.bmi;
                const statusHistoryRaw = isArrayRow
                    ? student[11]
                    : student?.bmi_measurement ?? student?.bmiStatus ?? student?.bmi_status;
                const updatedAtRaw = isArrayRow ? student[17] : student?.updated_at ?? student?.updatedAt ?? "";

                const statusHistory = parseHistoryArray(statusHistoryRaw)
                    .map(normalizeBmiStatus)
                    .filter(Boolean);

                // Only include students that already have at least one update.
                if (statusHistory.length < 2) {
                    return null;
                }

                const bmiHistory = parseHistoryArray(bmiHistoryRaw);
                const previousStatus = statusHistory[statusHistory.length - 2];
                const currentStatus = statusHistory[statusHistory.length - 1];
                const previousBmi = toNumber(bmiHistory[bmiHistory.length - 2]);
                const currentBmi = toNumber(bmiHistory[bmiHistory.length - 1]);
                const updatedAtDate = new Date(updatedAtRaw);
                const updatedAtMs = Number.isNaN(updatedAtDate.getTime())
                    ? 0
                    : updatedAtDate.getTime();

                return {
                    id: `${studentId}_${updatedAtRaw}_${index}`,
                    name: `${firstName} ${lastName}`.trim() || "Unknown Student",
                    oldBMI: previousBmi != null ? previousBmi.toFixed(1) : "-",
                    newBMI: currentBmi != null ? currentBmi.toFixed(1) : "-",
                    status: getUpdateStatus(previousStatus, currentStatus),
                    date: getDaysAgoLabel(updatedAtRaw),
                    updatedAtMs,
                };
            })
            .filter(Boolean)
            .sort((left, right) => right.updatedAtMs - left.updatedAtMs)
            .slice(0, 20);

        return updates;
    }, [students]);

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

    // Quick Actions
    const handleQuickAddFeedingSession = () => {
        navigate("/FeedingProgram", {
            state: { openCreateSession: true },
        });
    };

    const handleQuickUpdateMeasurement = () => {
        navigate("/Students", {
            state: { openMeasurementModal: true },
        });
    };
    
    // *Nutribot Chat
    const openNutriBot = () => {
        setIsChatOpen(true);
    };

    const closeNutriBot = () => {
        setIsChatExpanded(false);
        setIsChatOpen(false);
    };

    const toggleNutriBotExpanded = () => {
        if (!isChatOpen) {
            setIsChatOpen(true);
        }
        setIsChatExpanded((prev) => !prev);
    };

    const expandNutriBot = () => {
        if (!isChatOpen) {
            setIsChatOpen(true);
        }
        setIsChatExpanded(true);
    };

    const sendNutriBotMessage = (messageText) => {
        const trimmedMessage = String(messageText || "").trim();
        if (!trimmedMessage) {
            return;
        }

        const requestStartedAt = Date.now();
        const typingMessageId = `bot_typing_${requestStartedAt}`;

        const userMessage = {
            id: `user_${requestStartedAt}`,
            role: "user",
            text: trimmedMessage,
            timestamp: "Now",
        };

        const typingMessage = {
            id: typingMessageId,
            role: "bot",
            contentType: "typing",
        };

        const replaceTypingMessage = (nextMessage) => {
            const elapsedTime = Date.now() - requestStartedAt;
            const remainingDelay = Math.max(0, 1000 - elapsedTime);

            window.setTimeout(() => {
                setChatMessages((prev) => prev.map((message) => (
                    message.id === typingMessageId ? nextMessage : message
                )));
            }, remainingDelay);
        };

        setChatMessages((prev) => [...prev, userMessage, typingMessage]);
        setIsChatOpen(true);

        axios
            .get("/api/nutribot_send", {
                params: {
                    message: trimmedMessage,
                    teacherId: user?.id,
                },
            })
            .then((response) => {
                // console.log("NutriBot send response:", response.data);
                const res = response.data ?? {};

                if (res.status === false || res?.res?.status === false) {
                    const fallbackReply = {
                        id: typingMessageId,
                        role: "bot",
                        text: res.message || "Sorry, I did not understand that request. Try asking in a different way or type 'What can you do?'",
                        timestamp: "Now",
                    };

                    replaceTypingMessage(fallbackReply);
                    return;
                }

                if (res.intent === "show_nutribot_capabilities") {
                    const capabilityReply = {
                        id: typingMessageId,
                        role: "bot",
                        contentType: "capabilities",
                        text: "Here are the kinds of nutrition questions I can help with. You can try any of these sample prompts:",
                        capabilities: Array.isArray(res.message) ? res.message : [],
                        timestamp: "Now",
                    };

                    replaceTypingMessage(capabilityReply);
                    return;
                }

                if (res.intent === "list_at_risk_students") {
                    const summaryRows = Array.isArray(res?.res?.Summary) ? res.res.Summary : [];
                    const tableReply = {
                        id: typingMessageId,
                        role: "bot",
                        contentType: "table",
                        text: `Here ${summaryRows.length === 1 ? "is the at-risk student" : "are the at-risk students"} I found${summaryRows.length ? ` (${summaryRows.length} total)` : ""}.`,
                        columns: [
                            "Student ID",
                            "Full Name",
                            "Sex",
                            "Grade Level",
                            "Section",
                            "BMI Status",
                            "Measurement Date",
                        ],
                        rows: summaryRows.map((row) => ([
                            row?.[0] ?? "-",
                            row?.[1] ?? "-",
                            row?.[2] ?? "-",
                            row?.[3] ?? "-",
                            row?.[4] ?? "-",
                            row?.[5] ?? "-",
                            formatNutriBotDate(row?.[6]),
                        ])),
                        timestamp: "Now",
                    };

                    replaceTypingMessage(tableReply);
                    return;
                }

                if (res.intent === "list_students_by_bmi_category") {
                    const summaryRows = Array.isArray(res?.res?.Summary) ? res.res.Summary : [];
                    const bmiCategory = String(summaryRows?.[0]?.[5] ?? "selected BMI category")
                        .replace(/^./, (letter) => letter.toUpperCase());

                    const tableReply = {
                        id: typingMessageId,
                        role: "bot",
                        contentType: "table",
                        text: `Here ${summaryRows.length === 1 ? "is the student" : "are the students"} I found for the ${bmiCategory} BMI category${summaryRows.length ? ` (${summaryRows.length} total)` : ""}.`,
                        columns: [
                            "Student ID",
                            "Full Name",
                            "Sex",
                            "Grade Level",
                            "Section",
                            "BMI Status",
                            "Measurement Date",
                        ],
                        rows: summaryRows.map((row) => ([
                            row?.[0] ?? "-",
                            row?.[1] ?? "-",
                            row?.[2] ?? "-",
                            row?.[3] ?? "-",
                            row?.[4] ?? "-",
                            row?.[5] ?? "-",
                            formatNutriBotDate(row?.[6]),
                        ])),
                        timestamp: "Now",
                    };

                    replaceTypingMessage(tableReply);
                    return;
                }

                if (res.intent === "list_at_risk_recently_absent_students") {
                    const summaryRows = Array.isArray(res?.res?.Summary) ? res.res.Summary : [];
                    const tableReply = {
                        id: typingMessageId,
                        role: "bot",
                        contentType: "table",
                        text: `Here ${summaryRows.length === 1 ? "is the at-risk student" : "are the at-risk students"} I found who were absent in the latest feeding session${summaryRows.length ? ` (${summaryRows.length} total)` : ""}.`,
                        columns: [
                            "Student ID",
                            "Full Name",
                            "Sex",
                            "Grade Level",
                            "Section",
                            "BMI Status",
                            "Latest Session ID",
                            "Remarks",
                        ],
                        rows: summaryRows.map((row) => ([
                            row?.[0] ?? "-",
                            row?.[1] ?? "-",
                            row?.[2] ?? "-",
                            row?.[3] ?? "-",
                            row?.[4] ?? "-",
                            row?.[5] ?? "-",
                            row?.[6] ?? "-",
                            row?.[7] || "-",
                        ])),
                        timestamp: "Now",
                    };

                    replaceTypingMessage(tableReply);
                    return;
                }

                if (res.intent === "find_student") {
                    const summaryRows = Array.isArray(res?.res?.Summary) ? res.res.Summary : [];
                    const tableReply = {
                        id: typingMessageId,
                        role: "bot",
                        contentType: "table",
                        text: `Here ${summaryRows.length === 1 ? "is the student" : "are the students"} I found for your search${summaryRows.length ? ` (${summaryRows.length} match${summaryRows.length === 1 ? "" : "es"})` : ""}.`,
                        columns: [
                            "Student ID",
                            "Full Name",
                            "Sex",
                            "Age",
                            "Grade Level",
                            "Section",
                            "School",
                        ],
                        rows: summaryRows.map((row) => ([
                            row?.[0] ?? "-",
                            row?.[1] ?? "-",
                            row?.[2] ?? "-",
                            row?.[3] ?? "-",
                            row?.[4] ?? "-",
                            row?.[5] ?? "-",
                            row?.[6] ?? "-",
                        ])),
                        timestamp: "Now",
                    };

                    replaceTypingMessage(tableReply);
                    return;
                }

                if (res.intent === "summarise_section_nutrition_status") {
                    const summaryRow = Array.isArray(res?.res?.Summary) ? res.res.Summary[0] : null;
                    const sectionName = summaryRow?.[0] ?? "This section";
                    const totalStudents = Number(summaryRow?.[1] ?? 0);
                    const underweightCount = Number(summaryRow?.[2] ?? 0);
                    const normalCount = Number(summaryRow?.[3] ?? 0);
                    const overweightCount = Number(summaryRow?.[4] ?? 0);

                    const summaryReply = {
                        id: typingMessageId,
                        role: "bot",
                        text: `${sectionName} has ${totalStudents} ${totalStudents === 1 ? "student" : "students"} in total. ${underweightCount} ${underweightCount === 1 ? "student is" : "students are"} underweight, ${normalCount} ${normalCount === 1 ? "student is" : "students are"} normal, and ${overweightCount} ${overweightCount === 1 ? "student is" : "students are"} overweight.`,
                        timestamp: "Now",
                    };

                    replaceTypingMessage(summaryReply);
                    return;
                }

                if (res.intent === "get_student_latest_bmi") {
                    const summaryRows = Array.isArray(res?.res?.Summary) ? res.res.Summary : [];
                    const latestBmiText = summaryRows
                        .map((row) => {
                            const fullName = row?.[1] ?? "This student";
                            const section = row?.[2] ?? "Unknown section";
                            const bmiValue = row?.[3] ?? "-";
                            const bmiStatus = row?.[4] ?? "-";
                            const measurementDate = formatNutriBotDate(row?.[5]);

                            return `${fullName} from ${section} has a latest BMI of ${bmiValue}, classified as ${bmiStatus}, measured on ${measurementDate}.`;
                        })
                        .join(" ");

                    const latestBmiReply = {
                        id: typingMessageId,
                        role: "bot",
                        text: latestBmiText || "I could not find a latest BMI record for that student.",
                        timestamp: "Now",
                    };

                    replaceTypingMessage(latestBmiReply);
                    return;
                }

                if (res.intent === "get_student_bmi_history") {
                    const summaryRows = Array.isArray(res?.res?.Summary) ? res.res.Summary : [];
                    const groupedHistory = new Map();

                    summaryRows.forEach((row) => {
                        const studentId = row?.[0] ?? "-";
                        const fullName = row?.[1] ?? "-";
                        const section = row?.[2] ?? "-";
                        const bmiValue = row?.[3] ?? "-";
                        const bmiStatus = row?.[4] ?? "-";
                        const measurementDate = row?.[5] ?? "";
                        const groupKey = `${studentId}__${fullName}__${section}`;

                        if (!groupedHistory.has(groupKey)) {
                            groupedHistory.set(groupKey, {
                                studentId,
                                fullName,
                                section,
                                history: [],
                            });
                        }

                        groupedHistory.get(groupKey).history.push({
                            bmiValue,
                            bmiStatus,
                            measurementDate,
                        });
                    });

                    const normalizedRows = Array.from(groupedHistory.values()).map((student) => {
                        const sortedHistory = [...student.history].sort((left, right) => {
                            const leftTime = Date.parse(left.measurementDate);
                            const rightTime = Date.parse(right.measurementDate);
                            const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
                            const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
                            return safeLeft - safeRight;
                        });

                        return {
                            ...student,
                            history: sortedHistory,
                        };
                    });

                    const maxProgressCount = normalizedRows.reduce(
                        (maxCount, student) => Math.max(maxCount, student.history.length),
                        0,
                    );

                    const progressColumns = Array.from({ length: maxProgressCount }, (_, index) => `${formatOrdinalLabel(index + 1)} Progress`);
                    const tableReply = {
                        id: typingMessageId,
                        role: "bot",
                        contentType: "table",
                        text: `Here ${normalizedRows.length === 1 ? "is the student BMI history" : "are the student BMI histories"} I found${normalizedRows.length ? ` (${normalizedRows.length} student${normalizedRows.length === 1 ? "" : "s"})` : ""}.`,
                        columns: [
                            "Student ID",
                            "Full Name",
                            "Section",
                            ...progressColumns,
                        ],
                        rows: normalizedRows.map((student) => {
                            const progressCells = Array.from({ length: maxProgressCount }, (_, index) => {
                                const progress = student.history[index];
                                if (!progress) {
                                    return "-";
                                }
                                return `${progress.bmiStatus} (${progress.bmiValue})`;
                            });

                            return [
                                student.studentId,
                                student.fullName,
                                student.section,
                                ...progressCells,
                            ];
                        }),
                        timestamp: "Now",
                    };

                    replaceTypingMessage(tableReply);
                    return;
                }

                if (res.intent === "list_students_missing_recent_measurement") {
                    const summaryRows = Array.isArray(res?.res?.Summary) ? res.res.Summary : [];
                    const tableReply = {
                        id: typingMessageId,
                        role: "bot",
                        contentType: "table",
                        text: summaryRows.length > 0
                            ? `Here ${summaryRows.length === 1 ? "is the student" : "are the students"} I found with missing recent measurements (${summaryRows.length} total).`
                            : "I did not find any students with missing recent measurements.",
                        columns: [
                            "Student ID",
                            "Full Name",
                            "Sex",
                            "Grade Level",
                            "Section",
                            "Latest BMI",
                            "Latest Measurement Date",
                        ],
                        rows: summaryRows.map((row) => ([
                            row?.[0] ?? "-",
                            row?.[1] ?? "-",
                            row?.[2] ?? "-",
                            row?.[3] ?? "-",
                            row?.[4] ?? "-",
                            row?.[5] ?? "-",
                            formatNutriBotDate(row?.[6]),
                        ])),
                        timestamp: "Now",
                    };

                    replaceTypingMessage(tableReply);
                    return;
                }

                if (res.intent === "count_at_risk_students") {
                    const summaryRows = Array.isArray(res?.res?.Summary) ? res.res.Summary : [];
                    const normalizedRows = summaryRows.map((row) => ({
                        category: String(row?.[0] ?? "").toLowerCase(),
                        count: Number(row?.[1] ?? 0),
                    }));

                    const totalCount = normalizedRows.reduce((sum, row) => sum + (Number.isNaN(row.count) ? 0 : row.count), 0);
                    const categorySummary = normalizedRows
                        .filter((row) => row.category)
                        .map((row) => `${row.count} ${row.category}`)
                        .join(" and ");

                    const countReply = {
                        id: typingMessageId,
                        role: "bot",
                        text: totalCount > 0
                            ? `I found ${totalCount} at-risk ${totalCount === 1 ? "student" : "students"} in total: ${categorySummary}.`
                            : "I did not find any at-risk students in the current result.",
                        timestamp: "Now",
                    };

                    replaceTypingMessage(countReply);
                    return;
                }

                const botReply = {
                    id: typingMessageId,
                    role: "bot",
                    text: "NutriBot request received. The response display is still being connected, but the backend is processing your message.",
                    timestamp: "Now",
                };

                replaceTypingMessage(botReply);
            })
            .catch((error) => {
                console.error("NutriBot send error:", error);
                const errorReply = {
                    id: typingMessageId,
                    role: "bot",
                    text: "NutriBot could not process your request right now. Please try again.",
                    timestamp: "Now",
                };

                replaceTypingMessage(errorReply);
            });
    };

    // *CHECK IF THERE IS A USER LOGGED
    if (checkingAuth || (user?.id && !studentsFetchDone)) {
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

                <nav className="dashboard-nav">
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
                    <option value="all">All</option>
                    {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                            {section.name}
                        </option>
                    ))}
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
                    <div className="dashboard-teacher-avatar">{user.first_name.slice(0, 1) + user.last_name.slice(0, 1)}</div>
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
                        <h3>{studentsInScope.length}</h3>
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
                        <h3>{atRiskStudentsCount}</h3>
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        </div>
                    </div>
                    <div className="dashboard-card-content">
                        <h3>
                        <span className={`dashboard-card-status ${nearestSessionStatus.kind}`}>
                            {nearestSessionStatus.kind === "today" && (
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
                            )}
                            {nearestSessionStatus.kind === "upcoming" && (
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
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            )}
                            {nearestSessionStatus.kind === "empty" && (
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
                                        d="M8 12h8m8 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            )}
                            {nearestSessionStatus.title}
                        </span>
                        </h3>
                        <p>{nearestSessionStatus.description}</p>
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
                        <h3>{totalCompletedSessions}</h3>
                        <p>Total Completed Sessions</p>
                    </div>
                    </div>
                </div>

                {/* Chart and Updates Section */}
                <div className="dashboard-chart-section">
                    {/* BMI Distribution Chart */}
                    <div className="dashboard-chart-card">
                    <div className="dashboard-chart-header">
                        <h3>BMI Distribution Trend</h3>
                        <p>Monthly progress for {selectedSectionLabel}</p>
                    </div>
                    {bmiData.length === 0 ? (
                        <div className="dashboard-chart-empty">No chart data yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={bmiData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
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
                    )}
                    </div>

                    {/* Recent Updates */}
                    <div className="dashboard-updates-card">
                    <div className="dashboard-updates-header">
                        <h3>Recent BMI Updates</h3>
                        <p>Latest measurements accross <strong>all sections</strong></p>
                    </div>
                    <div className="dashboard-updates-list">
                        {recentUpdates.length === 0 ? (
                            <div className="dashboard-updates-empty">No updates yet.</div>
                        ) : (
                            recentUpdates.map((update) => (
                        <div key={update.id} className="dashboard-update-item">
                            <div className="dashboard-update-student">
                            {update.name}
                            </div>
                            <div className="dashboard-update-bmi">
                            {update.oldBMI} -&gt; {update.newBMI}
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
                        ))
                        )}
                    </div>
                    </div>
                </div>

                <div className="dashboard-line-chart-card">
                    <div className="dashboard-chart-header">
                        <h3>BMI Average Trend</h3>
                        <p>Monthly average BMI for {selectedSectionLabel}</p>
                    </div>
                    {bmiLineData.length === 0 ? (
                        <div className="dashboard-chart-empty">No trend data yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={bmiLineData}
                                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "0.5rem",
                                    }}
                                    formatter={(value) => {
                                        const numericValue = Number(value);
                                        return [
                                            Number.isNaN(numericValue) ? "-" : numericValue.toFixed(2),
                                            "Average BMI",
                                        ];
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="averageBmi"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="dashboard-actions">
                    <div className="dashboard-actions-header">
                    <h3>Quick Actions</h3>
                    </div>
                    <div className="dashboard-actions-buttons">
                    <button className="dashboard-action-button" onClick={handleQuickAddFeedingSession}>
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

                    <button className="dashboard-action-button" onClick={() => linkNavigate(3)}>
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

                                        <button className="dashboard-action-button" onClick={handleQuickUpdateMeasurement}>

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
            <NutriBotChat
                isChatOpen={isChatOpen}
                isChatExpanded={isChatExpanded}
                chatMessages={chatMessages}
                onOpen={openNutriBot}
                onClose={closeNutriBot}
                onToggleExpanded={toggleNutriBotExpanded}
                onExpandChat={expandNutriBot}
                onSendMessage={sendNutriBotMessage}
            />
    </div>
    )
}

export default Dashboard
