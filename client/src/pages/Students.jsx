import React, { useEffect, useMemo, useState } from 'react'
import '../styles/StudentsStyle.css'
import { useLocation, useNavigate } from "react-router";
import axios from 'axios';
import { Helmet } from 'react-helmet'
import { apiFetch, initAuth, logout } from "../api";

// COMPONENTS
import Loading from '../components/Loading';


// Images
import Logo from '../images/logo.png'


function Students() {
    const navigate = useNavigate()
    const location = useLocation()
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

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

    // SECTIONS
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [addSectionForm, setAddSectionForm] = useState({
        name: "",
        grade: "",
    });
    // Section data with default active section
    const [sections, setSections] = useState([]);

    const [activeSection, setActiveSection] = useState(null);
    const [editingSection, setEditingSection] = useState(null);
    const [editForm, setEditForm] = useState({
        name: "",
        grade: "",
    });



    // Cleans a name-like text input: trims, collapses internal whitespace,
    // blocks symbols (allows letters, digits, spaces, and dashes), and
    // title-cases each word (first letter of every word).
    // Returns { ok: true, value: cleaned } on success, or
    // { ok: false, reason: "symbols" } when invalid characters are present.
    const cleanName = (raw) => {
        const trimmed = String(raw ?? "").trim().replace(/\s+/g, " ");
        if (!trimmed) return { ok: true, value: "" };
        if (/[^a-zA-Z0-9 -]/.test(trimmed)) {
            return { ok: false, reason: "symbols" };
        }
        return {
            ok: true,
            value: trimmed.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        };
    };

    // Add Section handlers
    const handleAddSectionFormChange = (e) => {
        const { name, value } = e.target;
        setAddSectionForm(prev => ({
        ...prev,
        [name]: value
        }));
    };

    const handleAddSection = () => {
        const cleanedSection = cleanName(addSectionForm.name);
        if (!cleanedSection.ok) {
            alert("Section name cannot contain symbols. Please use letters and numbers only.");
            return;
        }
        const sectionName = cleanedSection.value;
        const sectionGrade = addSectionForm.grade.trim();
        // console.log(sectionGrade)

        if (!sectionName || !sectionGrade) {
            return;
        }

        const normalizedSection = sectionName.toLowerCase();
        const normalizedGrade = sectionGrade.toLowerCase();
        const sectionExists = sections.some(
            (section) =>
                section.name.trim().toLowerCase() === normalizedSection &&
                section.grade.trim().toLowerCase() === normalizedGrade
        );

        if (sectionExists) {
            alert(`A section ${sectionName} for ${sectionGrade} already exists.`);
            return;
        }

        // Get current date for "Created At"
        const currentDate = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const payload = {
            sectionName,
            grade: sectionGrade,
            userId: user?.id,
            lastName: user?.last_name
        };

        axios.post(`/api/add_section`, payload)
        .then((res) => {
            const status = res.data.status
            const createdSectionId = String(res.data.sectionId || "").trim();
            if (!status || !createdSectionId) {
                alert("Something went wrong. Try again later!")
                return
            }

            const newSection = {
                id: createdSectionId,
                name: sectionName,
                grade: sectionGrade,
                createdAt: currentDate,
            };

            setSections(prev => [...prev, newSection]);
            setShowAddSectionModal(false);
            setAddSectionForm({ name: "", grade: "" });

            if (!activeSection) {
            setActiveSection(newSection);
            }

            if (!selectedSection) {
            setSelectedSection(newSection.id);
            setFormData((prev) => ({
                ...prev,
                section: newSection.name
            }));
            }
            
            setToastMessage(`${newSection.name} has been created successfully!`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        })
        .catch(error => {
            console.error("Adding section error:", error);
            alert("An error occurred during adding new section. Please check if the section is already exist.");
        });
    };

    const handleCancelAddSection = () => {
        setShowAddSectionModal(false);
        setAddSectionForm({ name: "", grade: "" });
    };

    // Section management handlers
    const handleSectionCardClick = (section) => {
        setActiveSection(section);
        setSelectedSection(section.id);
        setFormData(prev => ({
        ...prev,
        section: section.name,
        grade: section.grade || prev.grade
        }));
    };

    const handleEditIconClick = (e, section) => {
        e.stopPropagation();
        setEditingSection(section);
        setEditForm({
            name: section.name,
            grade: section.grade,
        });
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
        ...prev,
        [name]: value
        }));
    };

    const handleSaveSection = () => {
        if (isSavingSection) {
        return;
        }

        if (!editingSection) {
        return;
        }

        const cleanedSection = cleanName(editForm.name);
        if (!cleanedSection.ok) {
            alert("Section name cannot contain symbols. Please use letters and numbers only.");
            return;
        }
        const trimmedName = cleanedSection.value;
        const trimmedGrade = editForm.grade.trim();

        if (!trimmedName || !trimmedGrade) {
        return;
        }

        const normalizedName = trimmedName.toLowerCase();
        const normalizedGrade = trimmedGrade.toLowerCase();
        const hasDuplicateSection = sections.some((section) => {
            if (section.id === editingSection.id) {
                return false;
            }

            return (
                String(section.name ?? "").trim().toLowerCase() === normalizedName &&
                String(section.grade ?? "").trim().toLowerCase() === normalizedGrade
            );
        });

        if (hasDuplicateSection) {
            alert(`A section ${trimmedName} for ${trimmedGrade} already exists.`);
            return;
        }

        const currentName = editingSection.name?.trim() || "";
        const currentGrade = editingSection.grade?.trim() || "";
        const hasChanges =
        trimmedName !== currentName || trimmedGrade !== currentGrade;

        if (!hasChanges) {
        return;
        }

        if (!user?.id) {
        alert("Missing user info. Please try again.");
        return;
        }

        const payload = {
        userId: user.id,
        lastName: user?.last_name,
        sectionId: editingSection.id,
        newSectionName: trimmedName,
        newGradeLevel: trimmedGrade,
        };

        setIsSavingSection(true);
        axios.post("/api/update_section", payload)
        .then((response) => {
            const status = response.data?.status;
            if (!status) {
            alert("Something went wrong. Try again later!");
            return;
            }
        

            setSections(prevSections =>
            prevSections.map(section =>
                section.id === editingSection.id
                ? { ...section, name: trimmedName, grade: trimmedGrade }
                : section
            )
            );

            // Update active section if it was the one being edited
            if (activeSection && activeSection.id === editingSection.id) {
            setActiveSection({
                ...editingSection,
                name: trimmedName,
                grade: trimmedGrade,
            });
            }

            if (selectedSection === editingSection.id) {
            setSelectedSection(editingSection.id);
            setFormData((prev) => ({
                ...prev,
                section: trimmedName
            }));
            }

            setEditingSection(null);
            setToastMessage("Section updated successfully!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        })
        .catch((error) => {
            console.error("Updating section error:", error);
            alert("An error occurred during updating section.");
        })
        .finally(() => {
            setIsSavingSection(false);
        });
    };

    const handleCancelEdit = () => {
        setEditingSection(null);
        setEditForm({ name: "", grade: "" });
    };

    const handleDeleteSection = () => {
        if (!editingSection) {
            return;
        }

        if (!user?.id) {
            alert("Missing user info. Please try again.");
            return;
        }

        const confirmDelete = window.confirm(
        `Delete ${editingSection.name} and students in it? This cannot be undone.`
        );

        if (!confirmDelete) {
            return;
        }

        const payload = {
            userId: user.id,
            sectionId: editingSection.id
        };

        console.log(editingSection)
        axios.delete("/api/delete_section", { data: payload })
        .then((response) => {
            const data = response.data;
            if (!data?.status) {
            alert("Something went wrong. Try again later!");
            return;
            }

            const nextSections = sections.filter(
            (section) => section.id !== editingSection.id
            );

            setSections(nextSections);

            const deletedSectionId = String(editingSection.id || "").trim();
            const deletedSectionName = String(editingSection.name || "").trim().toLowerCase();

            setStudents((prev) =>
            prev.filter((student) => {
                const sectionId = String(student?.sectionId ?? "").trim();
                const sectionName = String(student?.section ?? "").trim().toLowerCase();
                const isDeletedSection =
                (deletedSectionId && sectionId === deletedSectionId) ||
                (deletedSectionName && sectionName === deletedSectionName);
                return !isDeletedSection;
            })
            );

            setRawStudents((prev) =>
            prev.filter((student) => {
                if (Array.isArray(student)) {
                const sectionId = String(student[6] ?? "").trim();
                const sectionName = String(student[7] ?? "").trim().toLowerCase();
                const isDeletedSection =
                    (deletedSectionId && sectionId === deletedSectionId) ||
                    (deletedSectionName && sectionName === deletedSectionName);
                return !isDeletedSection;
                }

                const sectionId = String(student?.section_id ?? student?.sectionId ?? "").trim();
                const sectionName = String(
                student?.section_name ?? student?.sectionName ?? student?.section ?? ""
                )
                .trim()
                .toLowerCase();
                const isDeletedSection =
                (deletedSectionId && sectionId === deletedSectionId) ||
                (deletedSectionName && sectionName === deletedSectionName);
                return !isDeletedSection;
            })
            );

            if (activeSection && activeSection.id === editingSection.id) {
            setActiveSection(nextSections[0] || null);
            }

            if (selectedSection === editingSection.id) {
            const fallbackSectionName = nextSections[0]?.name || "";
            const fallbackSectionId = nextSections[0]?.id || "";
            setSelectedSection(fallbackSectionId);
            setFormData((prev) => ({
                ...prev,
                section: fallbackSectionName
            }));
            }

            setEditingSection(null);
            setToastMessage("Section deleted successfully!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        })
        .catch((error) => {
            console.error("Delete section error:", error);
            alert("An error occurred during deleting section.");
        });
    };



    // STUDENTS
    const teacherName = user?.first_name
        ? `${user.first_name} ${user.last_name}`
        : "Teacher";
    const [selectedSection, setSelectedSection] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentAttendanceCache, setStudentAttendanceCache] = useState({});
    const [studentAttendanceLoadingIds, setStudentAttendanceLoadingIds] = useState({});
    const [measurementOpen, setMeasurementOpen] = useState(false);
    const [measurementActiveSectionId, setMeasurementActiveSectionId] = useState(null);
    const [measurementDrafts, setMeasurementDrafts] = useState({});
    const [targetedMeasurementOpen, setTargetedMeasurementOpen] = useState(false);
    const [targetedMeasurementForm, setTargetedMeasurementForm] = useState({
        studentId: null,
        fullName: "",
        weight: "",
        height: "",
        fallbackStatus: "normal",
    });
    const [isSavingTargetedMeasurement, setIsSavingTargetedMeasurement] = useState(false);
    const [sortColumn, setSortColumn] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");

    const [students, setStudents] = useState([]);
    const [rawStudents, setRawStudents] = useState([])
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        sex: "",
        age: "",
        grade: "",
        section: "",
        height: "",
        weight: "",
    });
    const [formErrors, setFormErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [loadingAddStudent, setLoadingAddStudent] = useState(false);
    const [isAddPanelOpen, setIsAddPanelOpen] = useState(true);
    const [isSavingSection, setIsSavingSection] = useState(false);
    const [isSavingMeasurements, setIsSavingMeasurements] = useState(false);
    const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
    const [editingStudentMeta, setEditingStudentMeta] = useState(null);
    const selectedStudentAttendance = selectedStudent
        ? (studentAttendanceCache[selectedStudent.id] || [])
        : [];
    const isSelectedStudentAttendanceLoading = selectedStudent
        ? Boolean(studentAttendanceLoadingIds[selectedStudent.id])
        : false;

    const formatGradeLabel = (value) => {
        const text = String(value ?? "").trim();
        if (!text) {
            return "";
        }
        const lower = text.toLowerCase();
        if (lower.startsWith("grade")) {
            return text;
        }
        if (["pre-elementary", "pre elementary", "preelementary", "0", "kinder"].includes(lower)) {
            return "Kinder";
        }
        return `Grade ${text}`;
    };

    const formatSexLabel = (value) => {
        if (value === "M") {
            return "Male";
        }
        if (value === "F") {
            return "Female";
        }
        return value || "";
    };

    const buildStudentFullName = (lastName, firstName, middleName) => {
        const normalizedLast = String(lastName ?? "").trim();
        const normalizedFirst = String(firstName ?? "").trim();
        const normalizedMiddle = String(middleName ?? "").trim();
        const firstAndMiddle = [normalizedFirst, normalizedMiddle].filter(Boolean).join(" ");

        if (normalizedLast && firstAndMiddle) {
            return `${normalizedLast}, ${firstAndMiddle}`;
        }

        return normalizedLast || firstAndMiddle;
    };

    const getLatestMeasurement = (value) => {
        if (!value) {
            return "";
        }

        let parsed = value;
        if (typeof value === "string") {
            try {
                parsed = JSON.parse(value);
            } catch (error) {
                return value;
            }
        }

        if (Array.isArray(parsed)) {
            return parsed[parsed.length - 1] || "";
        }

        return parsed;
    };

    const getLatestBMIStatus = (value) => {
        const latest = getLatestMeasurement(value);
        if (!latest) {
            return "normal";
        }

        let parsed = latest;
        if (typeof parsed === "string") {
            const text = parsed.trim();
            if (!text) {
                return "normal";
            }
            if (text.startsWith('"') && text.endsWith('"')) {
                try {
                    parsed = JSON.parse(text);
                } catch (error) {
                    parsed = text.slice(1, -1);
                }
            } else {
                parsed = text;
            }
        }

        return String(parsed).trim().toLowerCase() || "normal";
    };



    const normalizeStudent = (student, index) => {
        // console.log(student)
        if (Array.isArray(student)) {
            const [
                studentId,
                firstName,
                lastName,
                sex,
                age,
                gradeLevel,
                sectionId,
                sectionName,
                heightM,
                weightKg,
                bmi,
                bmiMeasurement,
                measurementDate,
                programAttendance,
                teacher_id,
                school_name,
                created_at,
                updated_at,
                middle_name
            ] = student;

            const name = buildStudentFullName(lastName, firstName, middle_name);
            return {
                id: studentId ?? index + 1,
                name,
                firstName: firstName ?? "",
                middleName: middle_name ?? "",
                lastName: lastName ?? "",
                age: age ?? "",
                sex: formatSexLabel(sex),
                height: heightM ?? "",
                weight: weightKg ?? "",
                bmi: getLatestMeasurement(bmi) ?? "",
                bmiStatus: getLatestBMIStatus(bmiMeasurement),
                lastMeasurement: getLatestMeasurement(measurementDate) || "No data",
                participation: programAttendance ?? "participated",
                grade: formatGradeLabel(gradeLevel ?? ""),
                section: sectionName ?? "",
                sectionId: sectionId ?? "",
            };
        }

        if (!student || typeof student !== "object") {
            return {
                id: index + 1,
                name: "",
                age: "",
                sex: "",
                height: "",
                weight: "",
                bmi: "",
                bmiStatus: "",
                lastMeasurement: "No data",
                participation: "",
                grade: "",
                section: "",
            };
        }

        const firstName = student.firstName ?? student.first_name ?? "";
        const middleName = student.middleName ?? student.middle_name ?? "";
        const lastName = student.lastName ?? student.last_name ?? "";
        const name = student.name ?? buildStudentFullName(lastName, firstName, middleName);

        return {
            id: student.id ?? student.student_id ?? student.section_id ?? index + 1,
            name,
            firstName,
            middleName,
            lastName,
            age: student.age ?? "",
            sex: formatSexLabel(student.sex),
            height: student.height ?? "",
            weight: student.weight ?? "",
            bmi: getLatestMeasurement(student.bmi) ?? "",
            bmiStatus: getLatestBMIStatus(student.bmiStatus ?? student.bmi_measurement ?? student.bmi_status ?? "normal"),
            lastMeasurement: student.lastMeasurement ?? student.last_measurement ?? getLatestMeasurement(student.measurement_date) ?? "No data",
            participation: student.participation ?? "participated",
            grade: formatGradeLabel(student.grade ?? student.grader_level ?? student.grade_level ?? ""),
            section: student.section ?? student.section_name ?? student.sectionName ?? "",
            sectionId: student.sectionId ?? student.section_id ?? "",
        };
    };



    const isSameGrade = (left, right) => {
        const leftValue = String(left ?? "").trim().toLowerCase();
        const rightValue = String(right ?? "").trim().toLowerCase();
        return leftValue !== "" && leftValue === rightValue;
    };

    const gradeOptions = sections.reduce((acc, section) => {
        const grade = section?.grade?.trim();
        if (!grade) {
            return acc;
        }
        const key = grade.toLowerCase();
        if (!acc.map.has(key)) {
            acc.map.set(key, grade);
            acc.list.push(grade);
        }
        return acc;
    }, { list: [], map: new Map() }).list;

    const filteredSections = formData.grade
        ? sections.filter((section) => isSameGrade(section.grade, formData.grade))
        : [];

    const sectionStudentCountMap = useMemo(() => {
        const byId = new Map();
        const byName = new Map();

        students.forEach((student) => {
            const sectionId = String(student?.sectionId ?? "").trim();
            const sectionName = String(student?.section ?? "").trim().toLowerCase();

            if (sectionId) {
                byId.set(sectionId, (byId.get(sectionId) || 0) + 1);
            }

            if (sectionName) {
                byName.set(sectionName, (byName.get(sectionName) || 0) + 1);
            }
        });

        return { byId, byName };
    }, [students]);

    const getSectionStudentCount = (section) => {
        const sectionId = String(section?.id ?? "").trim();
        if (sectionId && sectionStudentCountMap.byId.has(sectionId)) {
            return sectionStudentCountMap.byId.get(sectionId);
        }

        const sectionName = String(section?.name ?? "").trim().toLowerCase();
        if (sectionName && sectionStudentCountMap.byName.has(sectionName)) {
            return sectionStudentCountMap.byName.get(sectionName);
        }

        return 0;
    };

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
                setActiveSection(null);
                setSelectedSection("");
                setFormData((prev) => ({
                    ...prev,
                    section: "",
                }));
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
            const initialSection = fetchedSections[0] || null;
            const initialSectionId = initialSection?.id || "";
            const initialSectionName = initialSection?.name || "";
            const initialSectionGrade = initialSection?.grade || "";

            setActiveSection(initialSection);
            setSelectedSection(initialSectionId);
            setFormData((prev) => ({
                ...prev,
                section: initialSectionName,
                grade: initialSectionGrade,
            }));
        })
        .catch((error) => {
            console.error("Fetching sections error:", error);
        });
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        axios.get("/api/get_all_students", {
            params: {
                userId: user.id,
            }
        })
        .then((response) => {
            const data = response.data;
            // console.log(data)
            
            if (!data?.status) {
                setStudents([]);
                return;
            }
            
            const rawStudents = Array.isArray(data.students)
                ? data.students
                : Array.isArray(data.result)
                    ? data.result
                    : [];
            // console.log(rawStudents)
            setRawStudents(rawStudents)
            const normalizedStudents = Array.isArray(rawStudents)
                ? rawStudents.map(normalizeStudent)
                : [];
            // console.log(normalizedStudents)
            setStudents(normalizedStudents);
        })
        .catch((error) => {
            console.error("Fetching students error:", error);
        });
    }, [user?.id]);

    const handleSort = (column) => {
        if (sortColumn === column) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
        setSortColumn(column);
        setSortDirection("asc");
        }
    };

    const getLastNameForSort = (fullName) => {
        const str = String(fullName ?? "").trim();
        if (!str) return "";
        const commaIndex = str.indexOf(",");
        if (commaIndex >= 0) {
            return str.slice(0, commaIndex).trim();
        }
        const parts = str.split(/\s+/).filter(Boolean);
        return parts[0] ?? "";
    };

    const filteredStudents = students
        .filter((student) => {
        if (activeSection) {
            const sectionMatches =
            (student.sectionId && student.sectionId === activeSection.id) ||
            (student.section && student.section === activeSection.name);
            if (!sectionMatches) {
            return false;
            }
        }
        // Search filter
        if (searchQuery) {
            return student.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
        })
        .filter((student) => {
        // Status filter
        if (activeFilter === "at-risk") {
            return student.bmiStatus !== "normal";
        }
        if (activeFilter === "no-updates") {
            return student.lastMeasurement.includes("days");
        }
        return true;
        })
        .sort((a, b) => {
        if (sortColumn === "name") {
            const aLastName = getLastNameForSort(a.name);
            const bLastName = getLastNameForSort(b.name);
            const byLastName = aLastName.localeCompare(bLastName);
            const byFullName = String(a.name ?? "").localeCompare(String(b.name ?? ""));
            const finalValue = byLastName || byFullName;
            return sortDirection === "asc" ? finalValue : -finalValue;
        }

        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (typeof aValue === "string" && typeof bValue === "string") {
            return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === "number" && typeof bValue === "number") {
            return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
        });

    const measurementDateLabel = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const targetedMeasurementDateLabel = measurementDateLabel;

    const measurementSection = measurementActiveSectionId
        ? sections.find((section) => section.id === measurementActiveSectionId) || null
        : null;
    const measurementSectionName = measurementSection?.name || "";
    const measurementStudents = useMemo(() => {
        if (!measurementSection) {
            return [];
        }

        const sectionStudents = students.filter((student) => {
            const matchesId = student.sectionId && student.sectionId === measurementSection.id;
            const matchesName = measurementSectionName && student.section === measurementSectionName;
            return matchesId || matchesName;
        });

        const getLastNameForSort = (student) => {
            const explicitLastName = String(student?.lastName ?? "").trim();
            if (explicitLastName) {
                return explicitLastName.toLowerCase();
            }

            const fullName = String(student?.name ?? "").trim();
            const commaIndex = fullName.indexOf(",");
            if (commaIndex >= 0) {
                return fullName.slice(0, commaIndex).trim().toLowerCase();
            }

            return fullName.toLowerCase();
        };

        return sectionStudents.sort((left, right) => {
            const byLastName = getLastNameForSort(left).localeCompare(getLastNameForSort(right));
            if (byLastName !== 0) {
                return byLastName;
            }
            return String(left?.name ?? "").localeCompare(String(right?.name ?? ""));
        });
    }, [measurementSection, measurementSectionName, students]);

    useEffect(() => {
        if (!measurementOpen) {
            return;
        }
        if (!measurementActiveSectionId && sections.length) {
            const fallbackSectionId = activeSection?.id || sections[0]?.id || null;
            setMeasurementActiveSectionId(fallbackSectionId);
        }
    }, [measurementOpen, measurementActiveSectionId, sections, activeSection]);

    useEffect(() => {
        if (!measurementOpen || !measurementActiveSectionId) {
            return;
        }
        setMeasurementDrafts((prev) => {
            let hasChanges = false;
            const next = { ...prev };
            measurementStudents.forEach((student) => {
                if (!next[student.id]) {
                    next[student.id] = {
                        weight: student.weight ?? "",
                        height: student.height ?? "",
                    };
                    hasChanges = true;
                }
            });
            return hasChanges ? next : prev;
        });
    }, [measurementOpen, measurementActiveSectionId, measurementStudents]);

    const getBMIStatusLabel = (status) => {
        switch (status) {
        case "normal":
            return "Normal";
        case "underweight":
            return "Underweight";
        case "overweight":
            return "Overweight";
        default:
            return status;
        }
    };

    const parseMeasurementValue = (value) => {
        const parsed = Number(value);
        if (Number.isNaN(parsed) || parsed <= 0) {
            return null;
        }
        return parsed;
    };

    const getMeasurementBMI = (weightKg, heightM) => {
        const weight = parseMeasurementValue(weightKg);
        const height = parseMeasurementValue(heightM);
        if (!weight || !height) return null;
        return weight / (height * height);
    };

    const getBMIStatusFromValue = (bmi) => {
        if (bmi == null) {
            return null;
        }
        if (bmi < 18.5) {
            return "underweight";
        }
        if (bmi < 25) {
            return "normal";
        }
        return "overweight";
    };

    const targetedMeasurementBMI = getMeasurementBMI(
        targetedMeasurementForm.weight,
        targetedMeasurementForm.height
    );
    const targetedMeasurementStatus =
        getBMIStatusFromValue(targetedMeasurementBMI) ||
        targetedMeasurementForm.fallbackStatus ||
        "normal";

    const openTargetedMeasurementModal = () => {
        if (!selectedStudent) {
            return;
        }

        setTargetedMeasurementForm({
            studentId: selectedStudent.id,
            fullName: selectedStudent.name || "",
            weight: selectedStudent.weight ?? "",
            height: selectedStudent.height ?? "",
            fallbackStatus: selectedStudent.bmiStatus || "normal",
        });
        setTargetedMeasurementOpen(true);
        setSelectedStudent(null);
    };

    const closeTargetedMeasurementModal = () => {
        setTargetedMeasurementOpen(false);
        setTargetedMeasurementForm({
            studentId: null,
            fullName: "",
            weight: "",
            height: "",
            fallbackStatus: "normal",
        });
    };

    const handleTargetedMeasurementChange = (field, value) => {
        setTargetedMeasurementForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSaveTargetedMeasurement = () => {
        if (isSavingTargetedMeasurement) {
            return;
        }

        if (!user?.id || !targetedMeasurementForm.studentId) {
            alert("Missing user or student details. Please try again.");
            return;
        }

        const weightValue = parseMeasurementValue(targetedMeasurementForm.weight);
        const heightValue = parseMeasurementValue(targetedMeasurementForm.height);

        if (!weightValue || !heightValue) {
            alert("Please provide valid weight and height values.");
            return;
        }

        const bmiValue = getMeasurementBMI(weightValue, heightValue);
        if (bmiValue == null) {
            alert("Unable to calculate BMI. Please check the measurements.");
            return;
        }

        const payload = {
            userId: user.id,
            studentId: targetedMeasurementForm.studentId,
            weight: weightValue,
            height: heightValue,
            bmi: Number(bmiValue.toFixed(1)),
            bmiStatus: getBMIStatusFromValue(bmiValue) || "normal",
        };

        setIsSavingTargetedMeasurement(true);
        axios
            .post("/api/update_student_measurement_targeted", payload)
            .then((response) => {
                if (!response.data?.status) {
                    alert("Something went wrong. Try again later!");
                    return;
                }

                return axios
                    .get("/api/get_all_students", {
                        params: {
                            userId: user.id,
                        },
                    })
                    .then((fetchResponse) => {
                        const data = fetchResponse.data;
                        if (!data?.status) {
                            alert("Measurement updated, but list refresh failed. Please reload.");
                            return;
                        }

                        const fetchedRawStudents = Array.isArray(data.students)
                            ? data.students
                            : Array.isArray(data.result)
                                ? data.result
                                : [];

                        setRawStudents(fetchedRawStudents);
                        const normalizedStudents = fetchedRawStudents.map(normalizeStudent);
                        setStudents(normalizedStudents);

                        setToastMessage("Student measurement updated successfully!");
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);
                        closeTargetedMeasurementModal();
                    });
            })
            .catch((error) => {
                console.error("Saving targeted measurement error:", error);
                alert("An error occurred while updating student measurement.");
            })
            .finally(() => {
                setIsSavingTargetedMeasurement(false);
            });
    };

    const openMeasurementModal = () => {
        const fallbackSectionId = activeSection?.id || sections[0]?.id || null;
        setMeasurementActiveSectionId(fallbackSectionId);
        setMeasurementOpen(true);
    };

    const closeMeasurementModal = () => {
        setMeasurementOpen(false);
    };

    useEffect(() => {
        if (!location.state?.openMeasurementModal) {
            return;
        }

        const fallbackSectionId = activeSection?.id || sections[0]?.id || null;
        setMeasurementActiveSectionId(fallbackSectionId);
        setMeasurementOpen(true);

        navigate(location.pathname, { replace: true, state: {} });
    }, [location.pathname, location.state, navigate, activeSection, sections]);

    const handleMeasurementChange = (studentId, field, value) => {
        setMeasurementDrafts((prev) => ({
        ...prev,
        [studentId]: {
            weight: field === "weight" ? value : prev[studentId]?.weight ?? "",
            height: field === "height" ? value : prev[studentId]?.height ?? "",
        },
        }));
    };

    const handleSaveMeasurements = () => {
        if (isSavingMeasurements) {
            return;
        }
        
        const activeSectionId = measurementActiveSectionId;
        const activeSection = measurementSection;
        
        // console.log(activeSection?.name)
        const confirmSaveMeasurements = window.confirm(
            `Save ${activeSection?.name} new measurement? This cannot be undone.`
        );

        if (!confirmSaveMeasurements) {
            return;
        }

        const payload = {
            userId: user.id,
            sectionId: activeSectionId,
            sectionName: activeSection?.name || "",
            grade: activeSection?.grade || "",
            students: measurementStudents.map((student) => {
                const weightValue = measurementDrafts[student.id]?.weight ?? student.weight ?? "";
                const heightValue = measurementDrafts[student.id]?.height ?? student.height ?? "";
                const bmiValue = getMeasurementBMI(weightValue, heightValue);
                const bmiStatus = getBMIStatusFromValue(bmiValue) || student.bmiStatus || "normal";
                return {
                    studentId: student.id,
                    weight: weightValue,
                    height: heightValue,
                    bmi: bmiValue,
                    bmiStatus,
                };
            }),
        };

        // console.log("Measurement save payload:", payload);

        setIsSavingMeasurements(true);
        axios
            .post("/api/update_quick_bmi_measurement", payload)
            .then((response) => {
                if (!response.data?.status) {
                    alert("Something went wrong. Try again later!");
                    return;
                }

                setToastMessage("Measurements updated successfully!");
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                closeMeasurementModal();
            })
            .catch((error) => {
                console.error("Saving measurements error:", error);
                alert("An error occurred while saving measurements.");
            })
            .finally(() => {
                setIsSavingMeasurements(false);
            });
    };

    const getParticipationLabel = (status) => {
        switch (status) {
        case "participated":
            return "Participated";
        case "absent":
            return "Absent";
        default:
            return status;
        }
    };

    const formatAttendanceDateLabel = (value) => {
        if (!value) {
            return "-";
        }
        const raw = String(value).trim();
        if (!raw) {
            return "-";
        }
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
            return raw;
        }
        const hasTimezone = /(gmt|utc|z|[+-]\d{2}:?\d{2})$/i.test(raw);
        return parsed.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            ...(hasTimezone ? { timeZone: "UTC" } : {}),
        });
    };

    const truncateRemarks = (value, maxLength = 25) => {
        const text = String(value || "").trim();
        if (!text) {
            return { display: "-", full: "" };
        }
        if (text.length <= maxLength) {
            return { display: text, full: text };
        }
        return {
            display: `${text.slice(0, maxLength)}...`,
            full: text,
        };
    };

    const selectedStudentParticipationRows = selectedStudentAttendance.map((record, index) => {
        let sessionId = "";
        let present = 0;
        let remarks = "";
        let createdAt = "";

        if (Array.isArray(record)) {
            sessionId = record[1] ?? "";
            present = Number(record[3] ?? 0);
            remarks = record[4] ?? "";
            createdAt = record[5] ?? "";
        } else if (record && typeof record === "object") {
            sessionId = record.session_id ?? record.sessionId ?? "";
            present = Number(record.present ?? 0);
            remarks = record.remarks ?? "";
            createdAt = record.created_at ?? record.createdAt ?? "";
        }

        const status = present === 1 ? "participated" : "absent";
        const note = truncateRemarks(remarks, 25);

        return {
            id: `${sessionId}_${createdAt}_${index}`,
            dateLabel: formatAttendanceDateLabel(createdAt),
            sessionLabel: sessionId ? `#${sessionId}` : "-",
            status,
            notesDisplay: note.display,
            notesFull: note.full,
        };
    });

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

    const normalizeTimelineStatus = (value) => {
        const text = String(value ?? "").trim().replace(/^"+|"+$/g, "").toLowerCase();
        if (text === "normal" || text === "underweight" || text === "overweight") {
            return text;
        }
        return null;
    };

    const formatTimelineDateLabel = (value) => {
        if (!value) {
            return "-";
        }
        const raw = String(value).trim();
        if (!raw) {
            return "-";
        }
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
            return raw;
        }
        const hasTimezone = /(gmt|utc|z|[+-]\d{2}:?\d{2})$/i.test(raw);
        return parsed.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            ...(hasTimezone ? { timeZone: "UTC" } : {}),
        });
    };

    const selectedStudentTimeline = useMemo(() => {
        if (!selectedStudent) {
            return [];
        }

        const selectedId = Number(selectedStudent.id);
        const rawStudentRecord = rawStudents.find((student) => {
            if (Array.isArray(student)) {
                return Number(student[0]) === selectedId;
            }
            if (!student || typeof student !== "object") {
                return false;
            }
            return Number(student.student_id ?? student.id) === selectedId;
        });

        if (!rawStudentRecord) {
            return [];
        }

        const bmiRaw = Array.isArray(rawStudentRecord)
            ? rawStudentRecord[10]
            : (rawStudentRecord.bmi ?? []);
        const statusRaw = Array.isArray(rawStudentRecord)
            ? rawStudentRecord[11]
            : (rawStudentRecord.bmi_measurement ?? rawStudentRecord.bmiStatus ?? []);
        const dateRaw = Array.isArray(rawStudentRecord)
            ? rawStudentRecord[12]
            : (rawStudentRecord.measurement_date ?? rawStudentRecord.measurementDate ?? []);

        const bmiValues = parseHistoryArray(bmiRaw);
        const statusValues = parseHistoryArray(statusRaw);
        const dateValues = parseHistoryArray(dateRaw);
        const total = Math.max(bmiValues.length, statusValues.length, dateValues.length);

        const timeline = [];
        for (let index = 0; index < total; index += 1) {
            const bmiValue = Number(bmiValues[index]);
            if (Number.isNaN(bmiValue)) {
                continue;
            }

            const statusFromHistory = normalizeTimelineStatus(statusValues[index]);
            const status = statusFromHistory || getBMIStatusFromValue(bmiValue) || "normal";

            timeline.push({
                key: `${selectedStudent.id}_${index}`,
                bmi: Number(bmiValue.toFixed(1)),
                status,
                date: formatTimelineDateLabel(dateValues[index]),
            });
        }

        return timeline.slice(-4);
    }, [selectedStudent, rawStudents]);

    // Calculate BMI timeline bar heights (percentage of max height)
    const timelineBMIValues = selectedStudentTimeline.map((entry) => entry.bmi);
    const maxBMI = timelineBMIValues.length ? Math.max(...timelineBMIValues) : 1;
    const minBMI = timelineBMIValues.length ? Math.min(...timelineBMIValues) : 0;
    const bmiRange = maxBMI - minBMI || 1;

    const bmiTrendSummary = useMemo(() => {
        const fallbackTrend = {
            title: "No Trend Yet",
            subtext: "Add another measurement to see progress",
            delta: "—",
            icon: "dash",
            tone: "neutral",
        };

        const lastEntry = selectedStudentTimeline[selectedStudentTimeline.length - 1] || null;
        const prevEntry =
            selectedStudentTimeline.length > 1
                ? selectedStudentTimeline[selectedStudentTimeline.length - 2]
                : null;

        const toBmiNumber = (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed)) {
                return null;
            }
            return Number(parsed.toFixed(1));
        };

        const currentBmi = toBmiNumber(lastEntry?.bmi);
        const previousBmi = toBmiNumber(prevEntry?.bmi);
        const currentStatus =
            normalizeTimelineStatus(lastEntry?.status) || getBMIStatusFromValue(currentBmi);
        const previousStatus =
            normalizeTimelineStatus(prevEntry?.status) || getBMIStatusFromValue(previousBmi);

        const formatDelta = (deltaValue, isStableChange = false) => {
            if (!Number.isFinite(deltaValue)) {
                return "—";
            }
            if (isStableChange) {
                return "No change";
            }
            const rounded = Number(deltaValue.toFixed(1));
            if (rounded === 0) {
                return "No change";
            }
            const sign = rounded > 0 ? "+" : "";
            return `${sign}${rounded.toFixed(1)} BMI`;
        };

        if (currentBmi == null) {
            return {
                currentBmi: null,
                previousBmi: null,
                currentStatus: null,
                previousStatus: null,
                trend: fallbackTrend,
            };
        }

        if (previousBmi == null || !previousStatus || !currentStatus) {
            return {
                currentBmi,
                previousBmi,
                currentStatus,
                previousStatus,
                trend: fallbackTrend,
            };
        }

        const delta = currentBmi - previousBmi;
        const isCategoryChanged = currentStatus !== previousStatus;
        const isStableChange = Math.abs(delta) < 0.2 && !isCategoryChanged;

        let trend = fallbackTrend;

        if (
            previousStatus === "normal" &&
            currentStatus === "normal" &&
            currentBmi <= 19.0
        ) {
            trend = {
                title: "Monitor",
                subtext: "Approaching underweight boundary",
                delta: formatDelta(delta, isStableChange),
                icon: "warning",
                tone: "warning",
            };
        } else if (previousStatus === "underweight" && currentStatus === "underweight") {
            if (isStableChange) {
                trend = {
                    title: "Stable",
                    subtext: "No significant change",
                    delta: "No change",
                    icon: "dash",
                    tone: "neutral",
                };
            } else if (delta > 0) {
                trend = {
                    title: "Improving",
                    subtext: "Moving toward normal range",
                    delta: formatDelta(delta),
                    icon: "arrowUp",
                    tone: "positive",
                };
            } else {
                trend = {
                    title: "Declining",
                    subtext: "Moving further below normal range",
                    delta: formatDelta(delta),
                    icon: "arrowDown",
                    tone: "danger",
                };
            }
        } else if (previousStatus === "normal" && currentStatus === "normal") {
            trend = {
                title: "Stable",
                subtext: "Maintaining healthy range",
                delta: formatDelta(delta, isStableChange),
                icon: "dash",
                tone: "neutral",
            };
        } else if (previousStatus === "underweight" && currentStatus === "normal") {
            trend = {
                title: "Improved to Normal",
                subtext: "Reached healthy range",
                delta: formatDelta(delta),
                icon: "arrowUp",
                tone: "positive",
            };
        } else if (previousStatus === "normal" && currentStatus === "underweight") {
            trend = {
                title: "At Risk",
                subtext: "Dropped below healthy range",
                delta: formatDelta(delta),
                icon: "arrowDown",
                tone: "danger",
            };
        } else if (previousStatus === "overweight" && currentStatus === "normal") {
            trend = {
                title: "Improved to Normal",
                subtext: "Returned to healthy range",
                delta: formatDelta(delta),
                icon: "arrowDown",
                tone: "positive",
            };
        } else if (previousStatus === "normal" && currentStatus === "overweight") {
            trend = {
                title: "At Risk",
                subtext: "Above healthy range",
                delta: formatDelta(delta),
                icon: "arrowUp",
                tone: "danger",
            };
        } else if (previousStatus === "overweight" && currentStatus === "overweight") {
            if (isStableChange) {
                trend = {
                    title: "Stable",
                    subtext: "No significant change",
                    delta: "No change",
                    icon: "dash",
                    tone: "neutral",
                };
            } else if (delta < 0) {
                trend = {
                    title: "Improving",
                    subtext: "Moving toward healthy range",
                    delta: formatDelta(delta),
                    icon: "arrowDown",
                    tone: "positive",
                };
            } else {
                trend = {
                    title: "Declining",
                    subtext: "Moving further above healthy range",
                    delta: formatDelta(delta),
                    icon: "arrowUp",
                    tone: "danger",
                };
            }
        }

        return {
            currentBmi,
            previousBmi,
            currentStatus,
            previousStatus,
            trend,
        };
    }, [selectedStudentTimeline]);

    const selectedStudentAttentionNotes = useMemo(() => {
        const notes = [];
        const currentBmi = bmiTrendSummary.currentBmi;
        const previousBmi = bmiTrendSummary.previousBmi;
        const currentStatus = bmiTrendSummary.currentStatus;
        const previousStatus = bmiTrendSummary.previousStatus;
        const currentStatusLabel = currentStatus ? getBMIStatusLabel(currentStatus).toLowerCase() : "";
        const previousStatusLabel = previousStatus ? getBMIStatusLabel(previousStatus).toLowerCase() : "";

        if (currentBmi == null) {
            notes.push("BMI note: no measurement history is available yet, so the student's weight trend still needs a baseline.");
        } else if (previousBmi == null || !previousStatus) {
            notes.push(
                `BMI note: the latest reading is ${currentBmi.toFixed(1)}, which places the student in the ${currentStatusLabel} range. Another measurement will help confirm whether the student is moving toward or away from the healthy range.`
            );
        } else if (currentStatus === "normal" && previousStatus !== "normal") {
            notes.push(
                `BMI note: the student has moved from ${previousStatusLabel} back into the normal range, with the latest BMI recorded at ${currentBmi.toFixed(1)}. Keep tracking the next measurements to make sure the recovery holds.`
            );
        } else if (currentStatus !== "normal" && previousStatus === "normal") {
            notes.push(
                `BMI note: the latest BMI of ${currentBmi.toFixed(1)} shows a shift from normal to ${currentStatusLabel}. This student may need closer follow-up on nutrition and the next scheduled measurement.`
            );
        } else if (bmiTrendSummary.trend.tone === "positive") {
            notes.push(
                `BMI note: compared with the previous BMI of ${previousBmi.toFixed(1)}, the latest reading of ${currentBmi.toFixed(1)} is moving in a better direction while the student remains in the ${currentStatusLabel} range.`
            );
        } else if (bmiTrendSummary.trend.tone === "danger") {
            notes.push(
                `BMI note: compared with the previous BMI of ${previousBmi.toFixed(1)}, the latest reading of ${currentBmi.toFixed(1)} suggests movement farther from the healthy range while the student remains ${currentStatusLabel}.`
            );
        } else if (bmiTrendSummary.trend.tone === "warning") {
            notes.push(
                `BMI note: the student is still classified as normal, but the latest BMI of ${currentBmi.toFixed(1)} is getting close to the lower boundary. Continued observation is recommended.`
            );
        } else {
            notes.push(
                `BMI note: the student is currently ${currentStatusLabel} with a BMI of ${currentBmi.toFixed(1)}, and the change from the previous reading of ${previousBmi.toFixed(1)} is minimal.`
            );
        }

        if (isSelectedStudentAttendanceLoading) {
            notes.push("Attendance note: feeding participation records are still loading.");
            return notes;
        }

        const totalSessions = selectedStudentParticipationRows.length;
        const absenceCount = selectedStudentParticipationRows.filter((record) => record.status === "absent").length;
        const participatedCount = totalSessions - absenceCount;

        if (totalSessions === 0) {
            notes.push("Attendance note: no feeding participation records have been logged for this student yet.");
            return notes;
        }

        const participationRate = Math.round((participatedCount / totalSessions) * 100);
        const absenceLabel = absenceCount === 1 ? "absence" : "absences";
        const sessionLabel = totalSessions === 1 ? "session" : "sessions";

        if (absenceCount === 0) {
            notes.push(
                `Attendance note: the student joined all ${totalSessions} recorded feeding ${sessionLabel}, giving a ${participationRate}% participation rate.`
            );
        } else if (participationRate >= 85) {
            notes.push(
                `Attendance note: participation remains consistent at ${participationRate}% across ${totalSessions} feeding ${sessionLabel}, with ${absenceCount} ${absenceLabel} recorded so far.`
            );
        } else if (participationRate >= 60) {
            notes.push(
                `Attendance note: the student has a ${participationRate}% participation rate across ${totalSessions} feeding ${sessionLabel}, with ${absenceCount} ${absenceLabel}. Extra follow-up may help improve consistency.`
            );
        } else {
            notes.push(
                `Attendance note: the student has joined ${participatedCount} of ${totalSessions} feeding ${sessionLabel}, for a ${participationRate}% participation rate, while ${absenceCount} ${absenceLabel} have been recorded.`
            );
        }

        return notes;
    }, [bmiTrendSummary, isSelectedStudentAttendanceLoading, selectedStudentParticipationRows]);

    const renderTrendIcon = (icon) => {
        if (icon === "arrowUp") {
            return (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12l7-7m0 0l7 7m-7-7v14"
                    />
                </svg>
            );
        }
        if (icon === "arrowDown") {
            return (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 12l-7 7m0 0l-7-7m7 7V5"
                    />
                </svg>
            );
        }
        if (icon === "warning") {
            return (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v4m0 4h.01M10.29 3.86l-7.15 12.4A2 2 0 004.86 19h14.28a2 2 0 001.72-2.74l-7.15-12.4a2 2 0 00-3.44 0z"
                    />
                </svg>
            );
        }
        return (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14"
                />
            </svg>
        );
    };


    // Form validation
    const validateForm = () => {
        const errors = {};
        const isEditingStudent = Boolean(editingStudentMeta);
        
        if (!formData.firstName.trim()) {
        errors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
        errors.lastName = "Last name is required";
        }
        if (!formData.sex) {
        errors.sex = "Sex is required";
        }
        if (!formData.age || parseInt(formData.age) < 1) {
        errors.age = "Valid age is required";
        }
        if (!isEditingStudent && !formData.grade.trim()) {
        errors.grade = "Grade level is required";
        }
        if (!isEditingStudent && !formData.section.trim()) {
        errors.section = "Section is required";
        }
        if (!isEditingStudent && (!formData.height || parseFloat(formData.height) <= 0)) {
        errors.height = "Valid height is required";
        }
        if (!isEditingStudent && (!formData.weight || parseInt(formData.weight) < 1)) {
        errors.weight = "Valid weight is required";
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
        ...prev,
        [name]: value
        }));
        
        // Clear error for this field
        if (formErrors[name]) {
        setFormErrors(prev => ({
            ...prev,
            [name]: ""
        }));
        }
    };

    const handleGradeChange = (e) => {
        const newGrade = e.target.value;
        const matchingSections = sections.filter((section) =>
        isSameGrade(section.grade, newGrade)
        );
        const nextSectionName = matchingSections[0]?.name || "";

        setFormData((prev) => {
        const keepSection = matchingSections.some(
            (section) => section.name === prev.section
        );
        return {
            ...prev,
            grade: newGrade,
            section: keepSection ? prev.section : nextSectionName,
        };
        });

        if (formErrors.grade || formErrors.section) {
        setFormErrors((prev) => ({
            ...prev,
            grade: "",
            section: "",
        }));
        }
    };


    // Handle form submission
    const handleAddStudent = (e) => {
        e.preventDefault();
        
        if (loadingAddStudent) {
        return;
        }
        
        if (!validateForm()) {
        return;
        }

        setLoadingAddStudent(true);
        
        // Calculate BMI
        const heightInMeters = parseFloat(formData.height);
        const weightInKg = parseInt(formData.weight);
        const bmi = parseFloat((weightInKg / (heightInMeters * heightInMeters)).toFixed(1));
        
        // Determine BMI status
        let bmiStatus = getBMIStatusFromValue(bmi)
        // let bmiStatus = "normal";
        // if (bmi < 16) {
        // bmiStatus = "underweight";
        // } else if (bmi > 23) {
        // bmiStatus = "overweight";
        // }
        
        const studentName = buildStudentFullName(formData.lastName, formData.firstName, formData.middleName);

        const payload = {
        firstName: cleanName(formData.firstName.trim()).value,
        middleName: cleanName(formData.middleName.trim()).value,
        lastName: cleanName(formData.lastName.trim()).value,
        sex: formData.sex,
        age: parseInt(formData.age),
        grade: formData.grade.trim(),
        section: formData.section,
        height: parseFloat(formData.height),
        weight: parseInt(formData.weight),
        bmi,
        bmiStatus,
        userId: user.id
        };
        // console.log(payload)
        axios.post(`/api/add_students`, payload)
            .then((response) => {
            if (!response.data?.status) {
                alert("Something went wrong. Try again later!");
                return;
            }

            // Re-fetch so both UI list and rawStudents always contain real DB IDs
            return axios.get("/api/get_all_students", {
                params: { userId: user.id }
            }).then((fetchResponse) => {
                const fetchData = fetchResponse.data;
                if (!fetchData?.status) {
                    alert("Student was added, but list refresh failed. Please reload.");
                    return;
                }
                const fetchedRawStudents = Array.isArray(fetchData.students)
                    ? fetchData.students
                    : Array.isArray(fetchData.result)
                        ? fetchData.result
                        : [];
                setRawStudents(fetchedRawStudents);
                const normalizedStudents = fetchedRawStudents.map(normalizeStudent);
                setStudents(normalizedStudents);

                setToastMessage(`${studentName} has been added successfully!`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                handleClear();
            });
            })
            .catch(error => {
                console.error("Adding student error:", error);
                alert("An error occurred during adding new student.");
            })
            .finally(() => {
            setLoadingAddStudent(false);
            });
    };
    
    // Handle clear form
    const handleClear = () => {
        setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        sex: "",
        age: "",
        grade: "",
        section: "",
        height: "",
        weight: "",
        });
        setFormErrors({});
    };

    const handleEditStudentClick = (studentId, userId) => {
        const student = students.find((item) => item.id === studentId);
        if (!student) {
            return;
        }
        const firstName = student.firstName ?? "";
        const middleName = student.middleName ?? student.middle_name ?? "";
        const lastName = student.lastName ?? "";
        const sexValue = student.sex === "Male" ? "M" : student.sex === "Female" ? "F" : "";

        setFormData({
            firstName,
            middleName,
            lastName,
            sex: sexValue,
            age: student.age ?? "",
            grade: student.grade ?? "",
            section: student.section ?? "",
            height: student.height ?? "",
            weight: student.weight ?? "",
        });
        setFormErrors({});
        setEditingStudentMeta({ studentId, userId });
        setIsAddPanelOpen(true);

        const payload = {
            studentId,
            userId,
        };
        // console.log("Edit student payload:", payload);
    };

    const handleUpdateStudent = (e) => {
        e.preventDefault();

        if (isUpdatingStudent) {
            return;
        }

        if (!editingStudentMeta) {
            return;
        }

        if (!validateForm()) {
            return;
        }

        const payload = {
            studentId: editingStudentMeta.studentId,
            userId: editingStudentMeta.userId,
            firstName: formData.firstName.trim(),
            middleName: formData.middleName.trim(),
            lastName: formData.lastName.trim(),
            sex: formData.sex,
            age: Number(formData.age),
        };

        setIsUpdatingStudent(true);
        axios.post("/api/update_student_information", payload)
        .then((response) => {
            const status = response.data?.status;
            if (!status) {
                alert("Something went wrong. Try again later!");
                return;
            }

            const fullName = buildStudentFullName(formData.lastName, formData.firstName, formData.middleName);
            const sexLabel = formData.sex === "M" ? "Male" : formData.sex === "F" ? "Female" : "";

            setStudents((prev) =>
                prev.map((student) =>
                    student.id === editingStudentMeta.studentId
                        ? {
                            ...student,
                            name: fullName || student.name,
                            firstName: formData.firstName.trim() || student.firstName,
                            middleName: formData.middleName.trim(),
                            lastName: formData.lastName.trim() || student.lastName,
                            age: formData.age || student.age,
                            sex: sexLabel || student.sex,
                        }
                        : student
                )
            );

            // console.log("Update student payload:", payload);
            setToastMessage("Student details updated successfully!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            setEditingStudentMeta(null);
            handleClear();
            setIsAddPanelOpen(false);
        })
        .catch((error) => {
            console.error("Updating student error:", error);
            alert("An error occurred during updating student.");
        })
        .finally(() => {
            setIsUpdatingStudent(false);
        });
    };

    const handleCancelEditStudent = () => {
        setEditingStudentMeta(null);
        handleClear();
    };

    const fetchStudentAttendance = (studentId) => {
        if (!studentId) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(studentAttendanceCache, studentId)) {
            // console.log("Student attendance (cached):", studentAttendanceCache[studentId]);
            return;
        }

        if (studentAttendanceLoadingIds[studentId]) {
            return;
        }

        setStudentAttendanceLoadingIds((prev) => ({
            ...prev,
            [studentId]: true,
        }));

        axios
            .get("/api/get_student_attendance", {
                params: {
                    studentId: studentId,
                },
            })
            .then((response) => {
                const data = response.data;
                if (!data?.status) {
                    console.warn("Student attendance fetch failed:", data);
                    return;
                }

                const attendance = Array.isArray(data.studentsAttendance)
                    ? data.studentsAttendance
                    : [];

                setStudentAttendanceCache((prev) => ({
                    ...prev,
                    [studentId]: attendance,
                }));
                // console.log("Student attendance (fetched):", attendance);
            })
            .catch((error) => {
                console.error("Fetching student attendance error:", error);
            })
            .finally(() => {
                setStudentAttendanceLoadingIds((prev) => {
                    const next = { ...prev };
                    delete next[studentId];
                    return next;
                });
            });
    };

    const openStudentProfileModal = (student) => {
        setSelectedStudent(student);
        fetchStudentAttendance(student?.id);
        handleCloseAddPanel()
    };

    const handleDeleteStudent = () => {
        if (!selectedStudent) {
            return;
        }

        if (!user?.id) {
            alert("Missing user info. Please try again.");
            return;
        }

        const confirmDelete = window.confirm(
            `Delete ${selectedStudent.name}? This cannot be undone.`
        );

        if (!confirmDelete) {
            return;
        }

        const payload = {
            userId: user.id,
            studentId: selectedStudent.id
        };

        // console.log(payload)
        axios.delete("/api/delete_student", { data: payload })
        .then((response) => {
            const data = response.data;
            if (!data?.status) {
                alert("Something went wrong. Try again later!");
                return;
            }

            setStudents((prev) => prev.filter((stu) => stu.id !== selectedStudent.id));
            setStudentAttendanceCache((prev) => {
                const next = { ...prev };
                delete next[selectedStudent.id];
                return next;
            });
            setSelectedStudent(null);
            setToastMessage("Student deleted successfully!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        })
        .catch((error) => {
            console.error("Delete student error:", error);
            alert("An error occurred during deleting student.");
        });
    }



    const handleOpenAddPanel = () => {
        handleClear();
        setEditingStudentMeta(null);
        setIsAddPanelOpen(true);
    };
    const handleCloseAddPanel = () => {
        handleClear();
        setIsAddPanelOpen(false);
        setEditingStudentMeta(null);
    };
    const handleToggleAddPanel = () => {
        const next = !isAddPanelOpen;
        if (!next) {
            handleClear();
            setEditingStudentMeta(null);
            setIsAddPanelOpen(false);
            return;
        }

        handleClear();
        setEditingStudentMeta(null);
        setIsAddPanelOpen(true);
    };

    // Navigation Links
    const linkNavigate = (num) => {
        // ? Note 1 = Dashboard, 2 = Profile, 3 = students, 4 = Feeding program
        let myLink = null
        if (num === 1) {
            myLink = "Dashboard"
        } else if (num === 2) {
            myLink = "Profile"
        } else if (num === 3) {
            return
        } else if (num === 4) {
            myLink = "FeedingProgram"
        } else {
            myLink = "404"
        }

        // console.log(myLink)

        navigate(`/${myLink}`)
    }

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

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
        <div className="students-container">
            <Helmet>
                <title>Feeding Program | Students</title>
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
                <button className="dashboard-nav-item" onClick={() => linkNavigate(1)}>
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

                <button className="dashboard-nav-item active" onClick={() => linkNavigate(3)}>
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

            {/* Main content */}
            <div className="students-main">
                {/* Header */}
                <header className="students-header">
                <div className="students-header-top">
                    <div className="students-header-left">
                    <h1>Students</h1>
                    <p className="students-header-subtitle">Signed in as {teacherName}</p>
                    </div>
                    {/* <div className="students-header-right">
                        <button 
                            className="students-add-section-button"
                            onClick={() => setShowAddSectionModal(true)}
                        >
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
                            Add Section
                        </button>
                    </div> */}
                </div>

                {/* Controls */}
                <div className="students-controls">
                    <div className="students-search-wrapper">
                    <svg
                        className="students-search-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        className="students-search"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    </div>
                    <div className="students-filters">
                    <button
                        className={`students-filter-button ${
                        activeFilter === "all" ? "active" : ""
                        }`}
                        onClick={() => setActiveFilter("all")}
                    >
                        All
                    </button>
                    <button
                        className={`students-filter-button ${
                        activeFilter === "at-risk" ? "active" : ""
                        }`}
                        onClick={() => setActiveFilter("at-risk")}
                    >
                        At-Risk
                    </button>
                    <button
                        className={`students-filter-button ${
                        activeFilter === "no-updates" ? "active" : ""
                        }`}
                        onClick={() => setActiveFilter("no-updates")}
                    >
                        No Recent Updates
                    </button>
                    </div>
                </div>
                </header>

                {/* Content */}
                <div className="students-content">
                    {/* Sections Overview */}
                    <div className="sections-overview">
                        <div className="sections-cards">
                            {/* ADD SECTION BUTTON */}
                            <div className="section-card section-card-add-section" onClick={() => setShowAddSectionModal(true)}>
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
                                <h3 className="section-name">Create new section</h3>
                            </div>
                        {sections.map((section) => {
                            const studentCount = getSectionStudentCount(section);

                            return (
                                <div
                                key={section.id}
                                className={`section-card ${
                                    activeSection && activeSection.id === section.id ? "active" : ""
                                }`}
                                onClick={() => handleSectionCardClick(section)}
                                >
                                <button
                                    className="section-edit-icon"
                                    onClick={(e) => handleEditIconClick(e, section)}
                                    title="Edit section"
                                >
                                    <svg
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                    </svg>
                                </button>
                                <div className="section-card-content">
                                    <h3 className="section-name">{section.name}</h3>
                                    <p className="section-grade">{section.grade}</p>
                                    <p className="section-total">
                                        {studentCount} {studentCount === 1 ? "student" : "students"}
                                    </p>
                                    <p className="section-created">Created: {section.createdAt}</p>
                                </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>

                    {/* Add Section Modal */}
                    {showAddSectionModal && (
                        <div
                        className="section-edit-modal-overlay"
                        onClick={handleCancelAddSection}
                        >
                        <div
                            className="section-edit-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="section-edit-modal-header">
                            <h2>Add Section</h2>
                            <button
                                className="section-edit-modal-close"
                                onClick={handleCancelAddSection}
                            >
                                <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                                </svg>
                            </button>
                            </div>

                            <div className="section-edit-modal-content">
                            <div className="section-edit-form-field">
                                <label className="section-edit-label">Section Name</label>
                                <input
                                type="text"
                                name="name"
                                value={addSectionForm.name}
                                onChange={handleAddSectionFormChange}
                                className="section-edit-input"
                                placeholder="e.g., Section A"
                                />
                            </div>

                            <div className="section-edit-form-field">
                                <label className="section-edit-label">Grade Level</label>
                                <select
                                name="grade"
                                value={addSectionForm.grade}
                                onChange={handleAddSectionFormChange}
                                className="section-edit-input"
                                >
                                <option value="">Select grade</option>
                                <option value="Kinder">Kinder</option>
                                <option value="Grade 7">Grade 7</option>
                                </select>
                            </div>
                            </div>

                            <div className="section-edit-modal-actions">
                            <button
                                className="section-edit-btn secondary"
                                onClick={handleCancelAddSection}
                            >
                                Cancel
                            </button>
                            <button
                                className="section-edit-btn primary"
                                onClick={handleAddSection}
                            >
                                Add Section
                            </button>
                            </div>
                        </div>
                        </div>
                    )}

                    {/* Edit Section Modal */}
                    {editingSection && (
                        <div
                        className="section-edit-modal-overlay"
                        onClick={handleCancelEdit}
                        >
                        <div
                            className="section-edit-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="section-edit-modal-header">
                            <h2>Edit Section</h2>
                            <button
                                className="section-edit-modal-close"
                                onClick={handleCancelEdit}
                            >
                                <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                                </svg>
                            </button>
                            </div>

                            <div className="section-edit-modal-content">
                            <div className="section-edit-form-field">
                                <label className="section-edit-label">Section Name</label>
                                <input
                                type="text"
                                name="name"
                                value={editForm.name}
                                onChange={handleEditFormChange}
                                className="section-edit-input"
                                placeholder="e.g., Section A"
                                />
                            </div>

                            <div className="section-edit-form-field">
                                <label className="section-edit-label">Grade Level</label>
                                <select
                                name="grade"
                                value={editForm.grade}
                                onChange={handleEditFormChange}
                                className="section-edit-input"
                                >
                                <option value="">Select grade</option>
                                <option value="Kinder">Kinder</option>
                                <option value="Grade 7">Grade 7</option>
                                </select>
                            </div>

                            <div className="section-edit-form-field">
                                <label className="section-edit-label metadata">Created At</label>
                                <div className="section-edit-metadata">
                                {editingSection.createdAt}
                                </div>
                            </div>
                            </div>

                            <div className="section-edit-modal-actions">
                            <button
                                className="section-edit-btn danger"
                                onClick={handleDeleteSection}
                            >
                                Delete Section
                            </button>
                            <button
                                className="section-edit-btn secondary"
                                onClick={handleCancelEdit}
                            >
                                Cancel
                            </button>
                            <button
                                className="section-edit-btn primary"
                                onClick={handleSaveSection}
                            >
                                Save Changes
                            </button>
                            </div>
                        </div>
                        </div>
                    )}
                    <div className="students-table-container">
                        {filteredStudents.length > 0 ? (
                        <table className="students-table">
                            <thead>
                            <tr>
                                <th onClick={() => handleSort("name")}>
                                Student Name
                                <svg
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                    />
                                </svg>
                                </th>
                                <th onClick={() => handleSort("age")}>
                                Age
                                <svg
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                    />
                                </svg>
                                </th>
                                <th onClick={() => handleSort("sex")}>
                                Sex
                                </th>
                                <th onClick={() => handleSort("height")}>
                                Height (m)
                                </th>
                                <th onClick={() => handleSort("weight")}>
                                Weight (kg)
                                </th>
                                <th onClick={() => handleSort("bmi")}>
                                BMI
                                <svg
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                    />
                                </svg>
                                </th>
                                <th>BMI Status</th>
                                <th>Last Measurement</th>
                                <th className="students-table-head-static">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredStudents.map((student) => (
                                <tr
                                key={student.id}
                                onClick={() => openStudentProfileModal(student)}
                                >
                                <td className="students-table-name">{student.name}</td>
                                <td>{student.age}</td>
                                <td>{student.sex}</td>
                                <td>{student.height}</td>
                                <td>{student.weight}</td>
                                <td>{student.bmi}</td>
                                <td>
                                    <span
                                    className={`students-bmi-status ${student.bmiStatus}`}
                                    >
                                    {getBMIStatusLabel(student.bmiStatus)}
                                    </span>
                                </td>
                                <td>{student.lastMeasurement}</td>
                                <td>
                                    <button
                                    type="button"
                                    className="students-table-edit-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditStudentClick(student.id, user?.id);
                                    }}
                                    >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.586a2 2 0 112.828 2.828L12 14l-4 1 1-4 8.586-8.586z"
                                        />
                                    </svg>
                                    </button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        ) : (
                        <div className="students-empty-state">
                            <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                            </svg>
                            <h3>No students found</h3>
                            <p>Try adjusting your search or filters</p>
                        </div>
                        )}
                    </div>

                    <div className="students-actions">
                        <div className="students-actions-header">
                            <h3>Quick Actions</h3>
                        </div>
                            <div className="students-actions-buttons">
                            <button className="students-action-button" type="button" onClick={openMeasurementModal}>
                                <div className="students-action-button-icon">
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

                    
                    </div>

            {/* Update Measurement Modal */}
            {measurementOpen && (
                <div
                className="students-modal-overlay"
                onClick={closeMeasurementModal}
                >
                <div
                    className="students-modal students-measurement-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="students-modal-header">
                    <div className="students-modal-title">
                        <div className="students-modal-title-text">
                        <h2>Update Measurements</h2>
                        <p>Updated: {measurementDateLabel}</p>
                        </div>
                    </div>
                    <button
                        className="students-modal-close"
                        onClick={closeMeasurementModal}
                        type="button"
                        aria-label="Close update measurements"
                    >
                        <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                        </svg>
                    </button>
                    </div>

                    <div className="students-modal-content">
                    <div className="students-measurement-tabs">
                        {sections.length ? (
                        sections.map((section) => {
                            const isActive = section.id === measurementActiveSectionId;
                            const count = getSectionStudentCount(section);
                            return (
                            <button
                                key={section.id}
                                className={`students-measurement-tab ${isActive ? "active" : ""}`}
                                onClick={() => setMeasurementActiveSectionId(section.id)}
                                type="button"
                            >
                                <div className="students-measurement-tab-title">
                                {section.name}
                                </div>
                                <div className="students-measurement-tab-sub">
                                {formatGradeLabel(section.grade) || "Grade"} • {count} student{count === 1 ? "" : "s"}
                                </div>
                            </button>
                            );
                        })
                        ) : (
                        <div className="students-measurement-empty">
                            <h3>No sections available</h3>
                            <p>Create a section first to update measurements.</p>
                        </div>
                        )}
                    </div>

                    <div className="students-measurement-summary">
                        {measurementSectionName
                        ? `${measurementSectionName} • ${measurementStudents.length} student${measurementStudents.length === 1 ? "" : "s"}`
                        : "Select a section to view students"}
                    </div>

                    <div className="students-measurement-table">
                        <table>
                        <thead>
                            <tr>
                            <th>Full Name</th>
                            <th>Weight (kg)</th>
                            <th>Height (m)</th>
                            <th>BMI Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {measurementStudents.length ? (
                            measurementStudents.map((student) => {
                                const weightValue = measurementDrafts[student.id]?.weight ?? student.weight ?? "";
                                const heightValue = measurementDrafts[student.id]?.height ?? student.height ?? "";
                                const bmiValue = getMeasurementBMI(weightValue, heightValue);
                                const bmiStatus = getBMIStatusFromValue(bmiValue) || student.bmiStatus || "normal";

                                return (
                                <tr key={student.id}>
                                    <td className="students-measurement-name">{student.name}</td>
                                    <td>
                                    <input
                                        type="number"
                                        className="students-form-input students-measurement-input"
                                        value={weightValue}
                                        min="1"
                                        step="0.1"
                                        placeholder="0"
                                        onChange={(e) => handleMeasurementChange(student.id, "weight", e.target.value)}
                                    />
                                    </td>
                                    <td>
                                    <input
                                        type="number"
                                        className="students-form-input students-measurement-input"
                                        value={heightValue}
                                        min="0.1"
                                        step="0.01"
                                        placeholder="0"
                                        onChange={(e) => handleMeasurementChange(student.id, "height", e.target.value)}
                                    />
                                    </td>
                                    <td>
                                    <span className={`students-bmi-status ${bmiStatus}`}>
                                        {getBMIStatusLabel(bmiStatus)}
                                    </span>
                                    </td>
                                </tr>
                                );
                            })
                            ) : (
                            <tr>
                                <td colSpan={4}>
                                <div className="students-measurement-empty">
                                    <h3>No students</h3>
                                    <p>Add students to this section to update measurements.</p>
                                </div>
                                </td>
                            </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                    </div>

                    <div className="students-modal-actions">
                    <button
                        className="students-action-btn secondary"
                        type="button"
                        onClick={closeMeasurementModal}
                    >
                        Close
                    </button>
                    <button
                        className="students-action-btn primary"
                        type="button"
                        onClick={handleSaveMeasurements}
                        disabled={!measurementStudents.length || isSavingMeasurements}
                    >
                        {isSavingMeasurements ? "Saving..." : "Save Updates"}
                    </button>
                    </div>
                </div>
                </div>
            )}

            {/* Targeted Measurement Modal */}
            {targetedMeasurementOpen && (
                <div
                    className="students-modal-overlay"
                    onClick={closeTargetedMeasurementModal}
                >
                    <div
                        className="students-modal students-targeted-measurement-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="students-modal-header">
                            <div className="students-modal-title">
                                <div className="students-modal-title-text">
                                    <h2>Update Student Measurement</h2>
                                    <p>Updated: {targetedMeasurementDateLabel}</p>
                                </div>
                            </div>
                            <button
                                className="students-modal-close"
                                onClick={closeTargetedMeasurementModal}
                                type="button"
                                aria-label="Close targeted measurement"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="students-modal-content">
                            <div className="students-targeted-measurement-grid">
                                <div className="students-form-field">
                                    <label className="students-form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="students-form-input students-targeted-readonly"
                                        value={targetedMeasurementForm.fullName}
                                        disabled
                                    />
                                </div>

                                <div className="students-form-field">
                                    <label className="students-form-label required">Weight (kg)</label>
                                    <input
                                        type="number"
                                        className="students-form-input"
                                        value={targetedMeasurementForm.weight}
                                        min="1"
                                        step="0.1"
                                        placeholder="0"
                                        onChange={(e) => handleTargetedMeasurementChange("weight", e.target.value)}
                                    />
                                </div>

                                <div className="students-form-field">
                                    <label className="students-form-label required">Height (m)</label>
                                    <input
                                        type="number"
                                        className="students-form-input"
                                        value={targetedMeasurementForm.height}
                                        min="0.1"
                                        step="0.01"
                                        placeholder="0"
                                        onChange={(e) => handleTargetedMeasurementChange("height", e.target.value)}
                                    />
                                </div>

                                <div className="students-targeted-status-row">
                                    <span className={`students-bmi-status ${targetedMeasurementStatus}`}>
                                        {getBMIStatusLabel(targetedMeasurementStatus)}
                                    </span>
                                    <span className="students-targeted-bmi-value">
                                        BMI: {targetedMeasurementBMI != null ? targetedMeasurementBMI.toFixed(1) : "-"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="students-modal-actions">
                            <button
                                className="students-action-btn secondary"
                                type="button"
                                onClick={closeTargetedMeasurementModal}
                            >
                                Close
                            </button>
                            <button
                                className="students-action-btn primary"
                                type="button"
                                onClick={handleSaveTargetedMeasurement}
                                disabled={isSavingTargetedMeasurement}
                            >
                                {isSavingTargetedMeasurement ? "Saving..." : "Save Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Profile Modal */}
            {selectedStudent && (
                <div
                className="students-modal-overlay"
                onClick={() => setSelectedStudent(null)}
                >
                <div
                    className="students-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="students-modal-header">
                    <div className="students-modal-title">
                        <div className="students-modal-avatar">
                        {selectedStudent.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="students-modal-title-text">
                        <h2>{selectedStudent.name}</h2>
                        <p>
                            {selectedStudent.grade} - {selectedStudent.section}
                        </p>
                        </div>
                    </div>
                    <button
                        className="students-modal-close"
                        onClick={() => setSelectedStudent(null)}
                    >
                        <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                        </svg>
                    </button>
                    </div>

                    {/* Modal Content */}
                    <div className="students-modal-content">
                    {/* Basic Information */}
                    <div className="students-modal-section">
                        <h3 className="students-modal-section-title">
                        Basic Information
                        </h3>
                        <div className="students-info-grid">
                        <div className="students-info-item">
                            <label>Age</label>
                            <div className="value">{selectedStudent.age} years old</div>
                        </div>
                        <div className="students-info-item">
                            <label>Sex</label>
                            <div className="value">{selectedStudent.sex}</div>
                        </div>
                        <div className="students-info-item">
                            <label>Height</label>
                            <div className="value">{selectedStudent.height} m</div>
                        </div>
                        <div className="students-info-item">
                            <label>Weight</label>
                            <div className="value">{selectedStudent.weight} kg</div>
                        </div>
                        </div>
                    </div>

                    {/* BMI Tracking */}
                    <div className="students-modal-section">
                        <h3 className="students-modal-section-title">BMI Tracking</h3>
                        <div className="students-bmi-summary">
                        <div className="students-bmi-card">
                            <label>Current BMI</label>
                            <div className="value">
                                {bmiTrendSummary.currentBmi != null
                                    ? bmiTrendSummary.currentBmi.toFixed(1)
                                    : "—"}
                            </div>
                            <span
                            className={`students-bmi-status ${bmiTrendSummary.currentStatus || "no-data"}`}
                            >
                            {bmiTrendSummary.currentStatus
                                ? getBMIStatusLabel(bmiTrendSummary.currentStatus)
                                : "No data"}
                            </span>
                        </div>
                        <div className="students-bmi-card">
                            <label>Previous BMI</label>
                            <div className="value">
                                {bmiTrendSummary.previousBmi != null
                                    ? bmiTrendSummary.previousBmi.toFixed(1)
                                    : "—"}
                            </div>
                            <span
                                className={`students-bmi-status ${bmiTrendSummary.previousStatus || "no-data"}`}
                            >
                                {bmiTrendSummary.previousStatus
                                    ? getBMIStatusLabel(bmiTrendSummary.previousStatus)
                                    : "No previous measurement"}
                            </span>
                        </div>
                        <div
                            className={`students-bmi-card students-bmi-trend-card tone-${bmiTrendSummary.trend.tone}`}
                        >
                            <label>Trend</label>
                            <div className="value">{bmiTrendSummary.trend.title}</div>
                            <div className="students-bmi-trend-subtext">
                                {bmiTrendSummary.trend.subtext}
                            </div>
                            <div className={`students-bmi-trend-delta ${bmiTrendSummary.trend.tone}`}>
                                {renderTrendIcon(bmiTrendSummary.trend.icon)}
                                <span>{bmiTrendSummary.trend.delta}</span>
                            </div>
                        </div>
                        </div>

                        {/* BMI Timeline */}
                        <div className="students-bmi-timeline">
                        <div className="students-timeline-bars">
                            {selectedStudentTimeline.length ? (
                                selectedStudentTimeline.map((record) => {
                                    const heightPercent = ((record.bmi - minBMI) / bmiRange) * 100;
                                    return (
                                        <div
                                            key={record.key}
                                            className="students-timeline-bar-wrapper"
                                        >
                                            <div className="students-timeline-value">
                                                {record.bmi}
                                            </div>
                                            <div
                                                className={`students-timeline-bar ${record.status}`}
                                                style={{
                                                    height: `${Math.max(heightPercent, 20)}%`,
                                                }}
                                            ></div>
                                            <div className="students-timeline-label">
                                                {record.date}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="students-timeline-empty">
                                    No measurement history yet.
                                </div>
                            )}
                        </div>
                        </div>
                    </div>

                    {/* Feeding Participation */}
                    <div className="students-modal-section">
                        <h3 className="students-modal-section-title">
                        Feeding Participation History
                        </h3>
                        <table className="students-participation-table">
                        <thead>
                            <tr>
                            <th>Date</th>
                            <th>Session</th>
                            <th>Status</th>
                            <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isSelectedStudentAttendanceLoading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <tr key={`attendance-skeleton-${index}`}>
                                        <td colSpan={4}>
                                            <div className="students-participation-skeleton-line" />
                                        </td>
                                    </tr>
                                ))
                            ) : selectedStudentParticipationRows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="students-participation-empty">
                                        No attendance records found.
                                    </td>
                                </tr>
                            ) : (
                                selectedStudentParticipationRows.map((record) => (
                                    <tr key={record.id}>
                                        <td>{record.dateLabel}</td>
                                        <td>{record.sessionLabel}</td>
                                        <td>
                                            <span
                                                className={`students-participation-badge ${record.status}`}
                                            >
                                                {record.status === "participated" && (
                                                    <svg
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                )}
                                                {record.status === "absent" && (
                                                    <svg
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                )}
                                                {getParticipationLabel(record.status)}
                                            </span>
                                        </td>
                                        <td title={record.notesFull || undefined}>{record.notesDisplay}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        </table>
                    </div>

                    {/* Notes & Attention */}
                    <div className="students-modal-section">
                        <h3 className="students-modal-section-title">
                        Notes & Attention
                        </h3>
                        <div className="students-notes-area">
                        <div className="students-notes-header">
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
                            <span>Attention Items</span>
                        </div>
                        <ul className="students-notes-list">
                            {selectedStudentAttentionNotes.map((note, index) => (
                                <li key={`attention-note-${index}`}>{note}</li>
                            ))}
                        </ul>
                        </div>
                    </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="students-modal-actions">
                    <button className="students-action-btn secondary" onClick={handleDeleteStudent}>
                        Delete Student
                    </button>
                    <button
                        className="students-action-btn primary"
                        type="button"
                        onClick={openTargetedMeasurementModal}
                    >
                        Update Measurement
                    </button>
                    </div>
                </div>
                </div>
            )}

            <button
                type="button"
                className={`students-panel-toggle ${isAddPanelOpen ? "is-open" : ""}`}
                onClick={handleToggleAddPanel}
                aria-expanded={isAddPanelOpen}
                aria-controls="students-right-panel"
            >
                <span className="students-panel-toggle-text">
                    {isAddPanelOpen ? "Close Form" : "Add Student"}
                </span>
                <svg
                className="students-panel-toggle-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                />
                </svg>
            </button>
            {/* Right Panel - Add Student Form */}
            <aside id="students-right-panel" className={`students-right-panel ${isAddPanelOpen ? "" : "is-collapsed"}`} aria-hidden={!isAddPanelOpen}>
                <div className={`students-panel-content ${editingStudentMeta ? "is-editing" : ""}`}>
                <div className="students-panel-header">
                    <div className="students-panel-title-row">
                        <h2>{editingStudentMeta ? "Edit Student" : "Add Student"}</h2>
                        <button
                            type="button"
                            className="students-panel-close"
                            onClick={handleCloseAddPanel}
                            aria-label="Close add student panel"
                        >
                            <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                            </svg>
                        </button>
                    </div>
                    <p>
                        {editingStudentMeta
                            ? "Update student details. Height and weight are locked in edit mode."
                            : "Fill in the details to add a new student to the selected section."}
                    </p>
                </div>

                <form onSubmit={editingStudentMeta ? handleUpdateStudent : handleAddStudent} className="students-add-form">
                    <div className="students-form-field">
                    <label className="students-form-label required">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`students-form-input ${formErrors.firstName ? "error" : ""}`}
                        placeholder="Enter first name"
                    />
                    {formErrors.firstName && (
                        <span className="students-form-error">{formErrors.firstName}</span>
                    )}
                    </div>

                    <div className="students-form-field">
                    <label className="students-form-label">Middle Name</label>
                    <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        className="students-form-input"
                        placeholder="Enter middle name (optional)"
                    />
                    </div>

                    <div className="students-form-field">
                    <label className="students-form-label required">Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`students-form-input ${formErrors.lastName ? "error" : ""}`}
                        placeholder="Enter last name"
                    />
                    {formErrors.lastName && (
                        <span className="students-form-error">{formErrors.lastName}</span>
                    )}
                    </div>

                    <div className="students-form-field">
                    <label className="students-form-label required">Sex</label>
                    <select
                        name="sex"
                        value={formData.sex}
                        onChange={handleInputChange}
                        className={`students-form-select ${formErrors.sex ? "error" : ""}`}
                    >
                        <option value="">Select sex</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                    {formErrors.sex && (
                        <span className="students-form-error">{formErrors.sex}</span>
                    )}
                    </div>

                    <div className="students-form-field">
                    <label className="students-form-label required">Age</label>
                    <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className={`students-form-input ${formErrors.age ? "error" : ""}`}
                        placeholder="Enter age"
                        min="1"
                        max="20"
                    />
                    {formErrors.age && (
                        <span className="students-form-error">{formErrors.age}</span>
                    )}
                    </div>

                    <div className="students-form-field">
                    <label className="students-form-label required">Grade Level</label>
                    <select
                        name="grade"
                        value={formData.grade}
                        onChange={handleGradeChange}
                        className={`students-form-select ${formErrors.grade ? "error" : ""}`}
                        disabled={Boolean(editingStudentMeta) || !gradeOptions.length}
                    >
                        <option value="">Select grade level</option>
                        {gradeOptions.map((grade) => (
                        <option key={grade} value={grade}>
                            {grade}
                        </option>
                        ))}
                    </select>
                    {formErrors.grade && (
                        <span className="students-form-error">{formErrors.grade}</span>
                    )}
                    </div>

                    <div className="students-form-field">
                    <label className="students-form-label required">Section</label>
                    <select
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        className={`students-form-select ${formErrors.section ? "error" : ""}`}
                        disabled={Boolean(editingStudentMeta) || !formData.grade || !filteredSections.length}
                    >
                        {!formData.grade ? (
                        <option value="">Select grade first</option>
                        ) : filteredSections.length ? (
                        filteredSections.map((section) => (
                            <option key={section.id} value={section.name}>
                            {section.name}
                            </option>
                        ))
                        ) : (
                        <option value="">No sections available</option>
                        )}
                    </select>
                    {formErrors.section && (
                        <span className="students-form-error">{formErrors.section}</span>
                    )}
                    </div>

                    <div className="students-form-field">
                    <label className="students-form-label required">Height (m)</label>
                    <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        className={`students-form-input ${formErrors.height ? "error" : ""}`}
                        placeholder="Enter height in m"
                        min="0.1"
                        max="2.5"
                        step="0.01" 
                        disabled={Boolean(editingStudentMeta)}
                    />
                    {formErrors.height && (
                        <span className="students-form-error">{formErrors.height}</span>
                    )}
                    </div>

                    <div className="students-form-field">
                    <label className="students-form-label required">Weight (kg)</label>
                    <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        className={`students-form-input ${formErrors.weight ? "error" : ""}`}
                        placeholder="Enter weight in kg"
                        min="1"
                        max="200"
                        disabled={Boolean(editingStudentMeta)}
                    />
                    {formErrors.weight && (
                        <span className="students-form-error">{formErrors.weight}</span>
                    )}
                    </div>

                    <div className="students-form-actions">
                    <button
                        type="submit"
                        className="students-form-button primary"
                        disabled={editingStudentMeta ? isUpdatingStudent : loadingAddStudent}
                    >
                        {editingStudentMeta
                            ? (isUpdatingStudent ? "Saving..." : "Save Changes")
                            : "Save Student"}
                    </button>
                    <button
                        type="button"
                        onClick={editingStudentMeta ? handleCancelEditStudent : handleClear}
                        className="students-form-button secondary"
                    >
                        {editingStudentMeta ? "Cancel Edit" : "Clear"}
                    </button>
                    </div>
                </form>
                </div>
            </aside>

            {/* Success Toast */}
            {showToast && (
                <div className="students-toast">
                <svg
                    className="students-toast-icon"
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
                <div className="students-toast-content">
                    <h3 className="students-toast-title">Success!</h3>
                    <p className="students-toast-message">{toastMessage}</p>
                </div>
                <button
                    className="students-toast-close"
                    onClick={() => setShowToast(false)}
                >
                    <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                    </svg>
                </button>
                </div>
            )}
            </div>
    )
}

export default Students
