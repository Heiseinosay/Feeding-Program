import React, { useEffect, useState } from 'react'
import '../styles/StudentsStyle.css'
import { useNavigate } from "react-router";
import axios from 'axios';
import { Helmet } from 'react-helmet'
import { apiFetch, initAuth, logout } from "../api";

// COMPONENTS
import Loading from '../components/Loading';


// Images
import Logo from '../images/logo.png'

function Students() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const loadUser = async () => {
            const data = await initAuth();
            if (isMounted && data?.status) {
                setUser(data);
            }
        };
        loadUser();
        return () => {
            isMounted = false;
        };
    }, []);

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

    // Add Section handlers
    const handleAddSectionFormChange = (e) => {
        const { name, value } = e.target;
        setAddSectionForm(prev => ({
        ...prev,
        [name]: value
        }));
    };

    const handleAddSection = () => {
        const sectionName = addSectionForm.name.trim();
        const sectionGrade = addSectionForm.grade.trim();
        console.log(sectionGrade)

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

        const gradeValue = sectionGrade.toLowerCase();
        let gradeLevel = sectionGrade.trim();
        if (gradeValue.startsWith("grade")) {
            gradeLevel = sectionGrade.slice(5).trim();
        } else if (["pre-elementary", "pre elementary", "preelementary"].includes(gradeValue)) {
            gradeLevel = "0";
        }

        const userId = user?.id ?? "";
        const lastName = user?.last_name ?? "";
        const sectionId = `${userId}_${lastName}_${sectionName}${gradeLevel}`.replace(/\s+/g, "");

        const newSection = {
            id: sectionId,
            name: sectionName,
            grade: sectionGrade,
            createdAt: currentDate,
        };

        const payload = {
            sectionName,
            grade: sectionGrade,
            userId: user?.id,
            lastName: user?.last_name
        };

        axios.post(`/api/add_section`, payload)
        .then((res) => {
            console.log(res)
            const status = res.data.status
            console.log(status)
            if (!status) {
                alert("Something went wrong. Try again later!")
                return
            }

            setSections(prev => [...prev, newSection]);
            setShowAddSectionModal(false);
            setAddSectionForm({ name: "", grade: "" });

            if (!activeSection) {
            setActiveSection(newSection);
            }

            if (!selectedSection) {
            setSelectedSection(newSection.name);
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
        console.log(section)
        setActiveSection(section);
        setSelectedSection(section.name);
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

        const trimmedName = editForm.name.trim();
        const trimmedGrade = editForm.grade.trim();

        if (!trimmedName || !trimmedGrade) {
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

        console.log(payload)

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

            if (selectedSection === editingSection.name) {
            setSelectedSection(trimmedName);
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
        `Delete ${editingSection.name}? This cannot be undone.`
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

            if (activeSection && activeSection.id === editingSection.id) {
            setActiveSection(nextSections[0] || null);
            }

            if (selectedSection === editingSection.name) {
            const fallbackSectionName = nextSections[0]?.name || "";
            setSelectedSection(fallbackSectionName);
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
    const [measurementOpen, setMeasurementOpen] = useState(false);
    const [measurementActiveSectionId, setMeasurementActiveSectionId] = useState(null);
    const [measurementDrafts, setMeasurementDrafts] = useState({});
    const [sortColumn, setSortColumn] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");

    // Mock BMI history
    const bmiHistory = [
        { date: "Jan", bmi: 15.2, status: "underweight" },
        { date: "Feb", bmi: 15.5, status: "underweight" },
        { date: "Mar", bmi: 16.1, status: "normal" },
        { date: "Apr", bmi: 16.8, status: "normal" },
    ];

    // Mock feeding records
    const feedingRecords = [
        {
        date: "Jan 13, 2026",
        session: 245,
        status: "participated",
        },
        {
        date: "Jan 12, 2026",
        session: 244,
        status: "participated",
        },
        {
        date: "Jan 11, 2026",
        session: 243,
        status: "absent",
        note: "Student was sick",
        },
        {
        date: "Jan 10, 2026",
        session: 242,
        status: "participated",
        },
        {
        date: "Jan 9, 2026",
        session: 241,
        status: "did-not-eat",
        note: "Not feeling well",
        },
    ];
    const [students, setStudents] = useState([]);
    const [rawStudents, setRawStudents] = useState([])
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        sex: "",
        age: "",
        grade: "",
        section: selectedSection,
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

    const formatGradeLabel = (value) => {
        const text = String(value ?? "").trim();
        if (!text) {
            return "";
        }
        const lower = text.toLowerCase();
        if (lower.startsWith("grade")) {
            return text;
        }
        if (["pre-elementary", "pre elementary", "preelementary", "0"].includes(lower)) {
            return "Pre-elementary";
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
                heightCm,
                weightCm,
                bmi,
                bmiMeasurement,
                measurementDate,
                programAttendance,
            ] = student;

            const name = `${firstName || ""} ${lastName || ""}`.trim();
            return {
                id: studentId ?? index + 1,
                name,
                age: age ?? "",
                sex: formatSexLabel(sex),
                height: heightCm ?? "",
                weight: weightCm ?? "",
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
        const lastName = student.lastName ?? student.last_name ?? "";
        const name = student.name ?? `${firstName} ${lastName}`.trim();

        return {
            id: student.id ?? student.student_id ?? student.section_id ?? index + 1,
            name,
            age: student.age ?? "",
            sex: formatSexLabel(student.sex),
            height: student.height ?? student.height_cm ?? "",
            weight: student.weight ?? student.weight_cm ?? "",
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
            console.log(data)
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
            const initialSectionName = initialSection?.name || "";
            const initialSectionGrade = initialSection?.grade || "";

            setActiveSection(initialSection);
            setSelectedSection(initialSectionName);
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
            console.log(data)
            
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
            console.log(normalizedStudents)
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
        const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
        if (!parts.length) {
            return "";
        }
        return parts[parts.length - 1];
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

    const measurementSection = measurementActiveSectionId
        ? sections.find((section) => section.id === measurementActiveSectionId) || null
        : null;
    const measurementSectionName = measurementSection?.name || "";
    const measurementStudents = measurementSection
        ? students.filter((student) => {
            const matchesId = student.sectionId && student.sectionId === measurementSection.id;
            const matchesName = measurementSectionName && student.section === measurementSectionName;
            return matchesId || matchesName;
        })
        : [];

    const getSectionStudentCount = (section) => {
        if (!section) {
            return 0;
        }
        return students.filter((student) => {
            const matchesId = student.sectionId && student.sectionId === section.id;
            const matchesName = section.name && student.section === section.name;
            return matchesId || matchesName;
        }).length;
    };

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

    const getMeasurementBMI = (weightKg, heightCm) => {
        const weight = parseMeasurementValue(weightKg);
        const height = parseMeasurementValue(heightCm);
        if (!weight || !height) {
            return null;
        }
        const heightM = height / 100;
        if (heightM <= 0) {
            return null;
        }
        return weight / (heightM * heightM);
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

    const openMeasurementModal = () => {
        const fallbackSectionId = activeSection?.id || sections[0]?.id || null;
        setMeasurementActiveSectionId(fallbackSectionId);
        setMeasurementOpen(true);
    };

    const closeMeasurementModal = () => {
        setMeasurementOpen(false);
    };

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
        
        console.log(activeSection?.name)
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

        console.log("Measurement save payload:", payload);

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
        case "did-not-eat":
            return "Did Not Eat";
        case "excused":
            return "Excused";
        default:
            return status;
        }
    };

    // Calculate BMI timeline bar heights (percentage of max height)
    const maxBMI = Math.max(...bmiHistory.map((h) => h.bmi));
    const minBMI = Math.min(...bmiHistory.map((h) => h.bmi));
    const bmiRange = maxBMI - minBMI || 1;


    // Form validation
    const validateForm = () => {
        const errors = {};
        
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
        if (!formData.grade.trim()) {
        errors.grade = "Grade level is required";
        }
        if (!formData.section.trim()) {
        errors.section = "Section is required";
        }
        if (!formData.height || parseInt(formData.height) < 1) {
        errors.height = "Valid height is required";
        }
        if (!formData.weight || parseInt(formData.weight) < 1) {
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
        const heightInMeters = parseInt(formData.height) / 100;
        const weightInKg = parseInt(formData.weight);
        const bmi = parseFloat((weightInKg / (heightInMeters * heightInMeters)).toFixed(1));
        
        // Determine BMI status
        let bmiStatus = "normal";
        if (bmi < 16) {
        bmiStatus = "underweight";
        } else if (bmi > 23) {
        bmiStatus = "overweight";
        }
        
        const studentName = `${formData.firstName} ${formData.lastName}`;
        
        const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        sex: formData.sex,
        age: parseInt(formData.age),
        grade: formData.grade.trim(),
        section: formData.section,
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        bmi,
        bmiStatus,
        userId: user.id
        };
        
        console.log(payload)
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

    // Update form section when selected section changes
    const handleSectionChange = (e) => {
        const newSection = e.target.value;
        setSelectedSection(newSection);
        setFormData(prev => ({
        ...prev,
        section: newSection
        }));
    };

    const handleEditStudentClick = (studentId, userId) => {
        const student = students.find((item) => item.id === studentId);
        if (!student) {
            return;
        }

        const nameParts = String(student.name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ");
        const sexValue = student.sex === "Male" ? "M" : student.sex === "Female" ? "F" : "";

        setFormData({
            firstName,
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
        console.log("Edit student payload:", payload);
    };

    const handleUpdateStudent = (e) => {
        e.preventDefault();

        if (isUpdatingStudent) {
            return;
        }

        if (!editingStudentMeta) {
            return;
        }

        const payload = {
            studentId: editingStudentMeta.studentId,
            userId: editingStudentMeta.userId,
            firstName: formData.firstName.trim(),
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

            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const sexLabel = formData.sex === "M" ? "Male" : formData.sex === "F" ? "Female" : "";

            setStudents((prev) =>
                prev.map((student) =>
                    student.id === editingStudentMeta.studentId
                        ? {
                            ...student,
                            name: fullName || student.name,
                            age: formData.age || student.age,
                            sex: sexLabel || student.sex,
                        }
                        : student
                )
            );

            console.log("Update student payload:", payload);
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

        console.log(payload)
        axios.delete("/api/delete_student", { data: payload })
        .then((response) => {
            const data = response.data;
            if (!data?.status) {
                alert("Something went wrong. Try again later!");
                return;
            }

            setStudents((prev) => prev.filter((stu) => stu.id !== selectedStudent.id));
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

        console.log(myLink)

        navigate(`/${myLink}`)
    }

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    if (user == null) {
        return (
            <div className='comp-loading'>
                <Loading />
            </div>
        )
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
                        {sections.map(section => (
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
                                <p className="section-created">Created: {section.createdAt}</p>
                            </div>
                            </div>
                        ))}
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
                                <option value="Pre-elementary">Pre-elementary</option>
                                <option value="Grade 8">Grade 8</option>
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
                                <option value="Pre-elementary">Pre-elementary</option>
                                <option value="Grade 8">Grade 8</option>
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
                                Height (cm)
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
                                onClick={() => setSelectedStudent(student)}
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
                            <th>Height (cm)</th>
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
                                        min="1"
                                        step="0.1"
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
                            <div className="value">{selectedStudent.height} cm</div>
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
                            <div className="value">{selectedStudent.bmi}</div>
                            <span
                            className={`students-bmi-status ${selectedStudent.bmiStatus}`}
                            >
                            {getBMIStatusLabel(selectedStudent.bmiStatus)}
                            </span>
                        </div>
                        <div className="students-bmi-card">
                            <label>Previous BMI</label>
                            <div className="value">16.1</div>
                            <div className="change positive">
                            <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                                />
                            </svg>
                            +0.7 Improved
                            </div>
                        </div>
                        <div className="students-bmi-card">
                            <label>Trend</label>
                            <div className="value">Improving</div>
                            <div className="change positive">
                            <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                            </svg>
                            Positive
                            </div>
                        </div>
                        </div>

                        {/* BMI Timeline */}
                        <div className="students-bmi-timeline">
                        <div className="students-timeline-bars">
                            {bmiHistory.map((record, index) => {
                            const heightPercent =
                                ((record.bmi - minBMI) / bmiRange) * 100;
                            return (
                                <div
                                key={index}
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
                            })}
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
                            {feedingRecords.map((record, index) => (
                            <tr key={index}>
                                <td>{record.date}</td>
                                <td>#{record.session}</td>
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
                                <td>{record.note || "-"}</td>
                            </tr>
                            ))}
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
                            <li>BMI improving steadily - continue monitoring</li>
                            <li>Good feeding participation rate (95%)</li>
                            <li>Parent consultation scheduled for next week</li>
                        </ul>
                        </div>
                    </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="students-modal-actions">
                    <button className="students-action-btn secondary" onClick={handleDeleteStudent}>
                        Delete Student
                    </button>
                    <button className="students-action-btn primary">
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
                    <label className="students-form-label required">Height (cm)</label>
                    <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        className={`students-form-input ${formErrors.height ? "error" : ""}`}
                        placeholder="Enter height in cm"
                        min="1"
                        max="250"
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
