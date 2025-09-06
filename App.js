/**
 * @file Momentum App - Main Application Component
 * @description This file contains the entire React application, including all components,
 * state management, Firebase integration, and styling.
 * @author Your Name
 * @version 2.0.0
 */

// --- React and Library Imports ---
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, writeBatch, increment } from 'firebase/firestore';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Firebase Configuration ---
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuKUXjgDdnSnWJrvHTp8QZ0SUInqFtW20",
  authDomain: "my-habit-tracker-ca41a.firebaseapp.com",
  projectId: "my-habit-tracker-ca41a",
  storageBucket: "my-habit-tracker-ca41a.firebasestorage.app",
  messagingSenderId: "863440868314",
  appId: "1:863440868314:web:87c20d4e0c75971642a6e3",
  measurementId: "G-KN2Q787N6S"
};
// --- Firebase Initialization ---
// Initialize Firebase services for the application.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Functions ---
// These utility functions help in generating consistent date-based IDs for Firestore documents.

/**
 * Generates a string ID for the week, starting from Monday.
 * @param {Date} [date=new Date()] - The date to get the week ID for.
 * @returns {string} The week ID in YYYY-MM-DD format (representing Monday's date).
 */
const getWeekId = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(d.setDate(diff));
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
};

/**
 * Generates a string ID for the month.
 * @param {Date} [date=new Date()] - The date to get the month ID for.
 * @returns {string} The month ID in YYYY-MM format.
 */
const getMonthId = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * Generates a string ID for the day.
 * @param {Date} [date=new Date()] - The date to get the day ID for.
 * @returns {string} The day ID in YYYY-MM-DD format.
 */
const getDayId = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Generates an array of date strings for the current week.
 * @param {Date} [date=new Date()] - The date within the week.
 * @returns {string[]} An array of 7 date strings (YYYY-MM-DD) for the week.
 */
const getWeekDates = (date = new Date()) => {
    const weekStart = new Date(getWeekId(date).replace(/-/g, '/')); // Use / for universal date parsing
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return getDayId(d);
    });
};

// --- Icon Components ---
// Self-contained SVG components for the UI to avoid external dependencies.
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>;
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M4.5 12.5A.5.5 0 0 1 5 12h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 8h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM2 2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H2z"/></svg>;
const TodoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z"/><path d="M1.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-13zM1 1.5h14V4H1V1.5z"/></svg>;
const HabitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2zm1 12v-6a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v6h2zM8 14v-4a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v4h2zM5 14v-2a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v2h2z"/></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>;
const CareerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v2A1.5 1.5 0 0 1 14.5 5h-13A1.5 1.5 0 0 1 0 3.5v-2zM1.5 1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-13z"/><path d="M0 8a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 16 8v6a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14V8zm1.5-.5a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V8a.5.5 0 0 0-.5-.5h-13z"/></svg>;
const LifeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>;
const MediaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M0 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.5 6.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5z"/><path d="M12 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-11z"/></svg>;
const AnalyticsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2z"/></svg>;
const AchievementsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0l-3 3 1.5 1L8 2.5 9.5 4 11 3 8 0zM8 16l-3-3 1.5-1L8 13.5l1.5-1.5 1.5 1L8 16zm-5-8l-3 3 1 1.5L2.5 8 4 9.5 3 11 0 8zm13 0l-3-3-1 1.5L13.5 8 12 9.5 13 11l3-3zM8 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>;
const PinIconFilled = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.146.146a.5.5 0 0 1 .708 0l7 7a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708L10.293 8 4.146.854a.5.5 0 0 1 0-.708z"/></svg>;
const HighlightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 12.5a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 1 0v9a.5.5 0 0 1-.5-.5zM12.25 12.5a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 1 0v9a.5.5 0 0 1-.5-.5zM3.75 12.5a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 1 0v9a.5.5 0 0 1-.5-.5z"/></svg>;

// --- Authentication Component ---
/**
 * Handles user authentication (Sign Up and Sign In).
 * Renders a form for email/password and manages auth state.
 */
const AuthComponent = () => {
    // State for form inputs, loading, and error messages
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Function to handle the authentication logic with Firebase
    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSigningUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-background"></div>
            <div className="auth-card">
                <h1 className="auth-brand">Momentum</h1>
                <h2 className="auth-title">{isSigningUp ? 'Create Your Account' : 'Welcome Back'}</h2>
                <p className="auth-subtitle">{isSigningUp ? 'Start your journey.' : 'Sign in to continue.'}</p>
                {error && <p className="auth-error">{error}</p>}
                <form onSubmit={handleAuthAction} className="auth-form">
                    <div className="auth-input-group"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email Address" /></div>
                    <div className="auth-input-group"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" /></div>
                    <button type="submit" className="auth-button" disabled={loading}>{loading ? <div className="loader-small"></div> : (isSigningUp ? 'Sign Up' : 'Sign In')}</button>
                </form>
                <p className="auth-toggle">{isSigningUp ? 'Already have an account?' : "Don't have an account?"}<span onClick={() => setIsSigningUp(!isSigningUp)}>{isSigningUp ? ' Sign In' : ' Sign Up'}</span></p>
            </div>
        </div>
    );
};

// --- In-App Reminder Modal ---
/**
 * A simple modal component to display task reminders.
 * @param {object} props - Component props.
 * @param {object} props.reminder - The task object to display a reminder for.
 * @param {function} props.onDismiss - Function to call when the modal is dismissed.
 */
const ReminderModal = ({ reminder, onDismiss }) => {
    if (!reminder) return null;

    return (
        <div className="reminder-modal-overlay">
            <div className="reminder-modal-content">
                <h3>Reminder!</h3>
                <p className="reminder-task-text">{reminder.text}</p>
                <p className="reminder-due-time">Due at: {reminder.dueTime}</p>
                <button onClick={() => onDismiss(reminder.id)}>Dismiss</button>
            </div>
        </div>
    );
};


// --- #################### PAGE COMPONENTS #################### ---

// --- Notes Page (With Pin/Highlight) ---
/**
 * Renders the Notes page, allowing users to create, delete, pin, and highlight notes.
 */
const NotesPage = ({ user }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');

    // Effect to subscribe to notes data from Firestore
    useEffect(() => {
        if (!user) return;
        const notesRef = doc(db, 'users', user.uid, 'data', 'notes');
        const unsubscribe = onSnapshot(notesRef, (doc) => {
            if (doc.exists()) {
                const notesData = doc.data().list || [];
                // Sort notes to show pinned notes first
                notesData.sort((a, b) => (b.isPinned - a.isPinned) || (b.createdAt - a.createdAt));
                setNotes(notesData);
            }
        });
        return unsubscribe; // Cleanup subscription on unmount
    }, [user]);

    // Handlers for note actions
    const handleAddNote = async (e) => {
        e.preventDefault();
        if (newNote.trim() === '') return;
        const note = { id: Date.now().toString(), text: newNote, createdAt: Date.now(), isPinned: false, isHighlighted: false };
        await setDoc(doc(db, 'users', user.uid, 'data', 'notes'), { list: [note, ...notes] }, { merge: true });
        setNewNote('');
    };

    const handleDeleteNote = async (noteToDelete) => {
        if (!window.confirm(`Are you sure you want to delete the note "${noteToDelete.text.substring(0, 20)}..."?`)) return;
        const updatedNotes = notes.filter(n => n.id !== noteToDelete.id);
        await setDoc(doc(db, 'users', user.uid, 'data', 'notes'), { list: updatedNotes });
    };

    const handleTogglePin = async (noteId) => {
        const updatedNotes = notes.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n);
        await setDoc(doc(db, 'users', user.uid, 'data', 'notes'), { list: updatedNotes });
    };

    const handleToggleHighlight = async (noteId) => {
        const updatedNotes = notes.map(n => n.id === noteId ? { ...n, isHighlighted: !n.isHighlighted } : n);
        await setDoc(doc(db, 'users', user.uid, 'data', 'notes'), { list: updatedNotes });
    };

    return (
        <div className="page-container">
            <header className="page-header"><h1>Notes</h1><p>Capture your thoughts, ideas, and reminders.</p></header>
            <div className="widget-card">
                <form onSubmit={handleAddNote} className="note-add-form">
                    <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Write something down..." />
                    <button type="submit">Add Note</button>
                </form>
            </div>
            <div className="notes-grid">
                {notes.map(note => (
                    <div key={note.id} className={`note-card ${note.isPinned ? 'pinned' : ''} ${note.isHighlighted ? 'highlighted' : ''}`}>
                        <p>{note.text}</p>
                        <div className="note-footer">
                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                            <div className="note-actions">
                                <button onClick={() => handleToggleHighlight(note.id)} title="Highlight"><HighlightIcon /></button>
                                <button onClick={() => handleTogglePin(note.id)} title="Pin"><PinIconFilled /></button>
                                <button onClick={() => handleDeleteNote(note)}>×</button>
                            </div>
                        </div>
                    </div>
                ))}
                {notes.length === 0 && <p className="no-data-text">No notes yet. Add one above!</p>}
            </div>
        </div>
    );
};

// --- To-Do Page (Parent Component for State Management) ---
/**
 * Acts as a container for the To-Do list, managing the view state (list vs. calendar)
 * and passing down the unified task data.
 */
const TodoPage = ({ user, tasks, onAddTask, onUpdateTasks, onTaskComplete }) => {
    const [view, setView] = useState('list'); // Default view is now 'list'

    return (
        <div className="page-container">
            <header className="page-header"><h1>To-Do List</h1><p>Organize your tasks by calendar or lists.</p></header>
            <div className="view-toggle-tabs">
                <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>📋 What's the Plan?</button>
                <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>🗓️ Bonds Planning</button>
            </div>
            {view === 'calendar' ? 
                <VerticalCalendarView user={user} tasks={tasks} onAddTask={onAddTask} onUpdateTasks={onUpdateTasks} onTaskComplete={onTaskComplete} /> : 
                <ListViewComponent user={user} tasks={tasks} onAddTask={onAddTask} onUpdateTasks={onUpdateTasks} onTaskComplete={onTaskComplete}/>
            }
        </div>
    );
};


// --- Vertical Calendar Component (with Recurring Tasks) ---
/**
 * Renders a detailed weekly calendar view for scheduling tasks.
 */
const VerticalCalendarView = ({ user, tasks, onAddTask, onUpdateTasks, onTaskComplete }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // useMemo hooks to efficiently calculate dates for the current week
    const { weekDates, weekStart } = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d.setDate(diff));

        const dates = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            return date;
        });
        return { weekDates: dates, weekStart };
    }, [currentDate]);
    
    // Handlers to interact with the parent's state management functions
    const handleAddTaskLocal = (taskDetails) => {
        const { text, priority, date, time, reminderOffset, recurrence } = taskDetails;
        const dateString = getDayId(date);
        const task = { id: Date.now().toString(), text, priority, completed: false, createdAt: Date.now(), dueDate: dateString, dueTime: time, reminderOffset, type: 'task', recurrence };
        if (recurrence.rule !== 'none') {
            task.originalDueDate = dateString;
            task.completionExceptions = {};
        }
        onAddTask(task);
    };

    const handleToggleTask = (task) => {
        if (task.recurrence && task.recurrence.rule !== 'none') {
            const updatedTask = {
                ...task,
                completionExceptions: { ...task.completionExceptions, [getDayId(currentDate)]: true }
            };
            const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
            onUpdateTasks(updatedTasks);
        } else {
            const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t);
            onUpdateTasks(updatedTasks);
            if (!task.completed) { onTaskComplete(); }
        }
    };

    const handleDeleteTask = (taskToDelete) => {
        if (!window.confirm(`Are you sure you want to delete the task "${taskToDelete.text}"?`)) return;
        const updatedTasks = tasks.filter(t => t.id !== taskToDelete.id);
        onUpdateTasks(updatedTasks);
    };
    
    const changeWeek = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset * 7);
        setCurrentDate(newDate);
    };

    // Sub-component for the new task form
    const AddTaskForm = ({ onAddTask, date }) => {
        const [newTask, setNewTask] = useState('');
        const [priority, setPriority] = useState('white');
        const [time, setTime] = useState('09:00');
        const [reminderOffset, setReminderOffset] = useState(-1);
        const [recurrenceRule, setRecurrenceRule] = useState('none');
        const priorityMap = { red: 'Must', green: 'High', blue: 'Medium', yellow: 'Low', white: 'None' };

        const handleSubmit = (e) => {
            e.preventDefault();
            if (newTask.trim() === '') return;
            onAddTask({ text: newTask, priority, date, time, reminderOffset: parseInt(reminderOffset), recurrence: { rule: recurrenceRule } });
            setNewTask(''); setPriority('white'); setTime('09:00'); setReminderOffset(-1); setRecurrenceRule('none');
        };

        return (
            <form onSubmit={handleSubmit} className="todo-page-form">
                <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="New task..." className="task-input-main"/>
                <div className="task-details-inputs">
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} title="Due time"/>
                    <select value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value)} title="Repeat Task">
                        <option value="none">Does not repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                    <select value={reminderOffset} onChange={e => setReminderOffset(e.target.value)} title="Set reminder">
                        <option value={-1}>No reminder</option>
                        <option value={0}>At time of event</option>
                        <option value={5}>5 minutes before</option>
                        <option value={15}>15 minutes before</option>
                        <option value={60}>1 hour before</option>
                    </select>
                </div>
                <div className="priority-selector">
                    {Object.keys(priorityMap).map(p => (<button key={p} type="button" title={priorityMap[p]} className={`priority-btn ${p} ${priority === p ? 'selected' : ''}`} onClick={() => setPriority(p)} />))}
                </div>
                <button type="submit" className="add-task-btn">+</button>
            </form>
        );
    };
    
    // Logic to calculate and display recurring tasks for the current view
    const visibleTasks = useMemo(() => {
        const dayMap = {};
        const visibleDates = weekDates.map(d => getDayId(d));

        visibleDates.forEach(d => dayMap[d] = []);
        
        tasks.forEach(task => {
            if (!task.recurrence || task.recurrence.rule === 'none') {
                if (dayMap[task.dueDate]) {
                    dayMap[task.dueDate].push(task);
                }
            } else {
                const startDate = new Date(task.originalDueDate.replace(/-/g, '/'));
                weekDates.forEach(day => {
                    const currentDayId = getDayId(day);
                    if (day >= startDate) {
                        if (task.recurrence.rule === 'daily') {
                            dayMap[currentDayId].push({...task, isInstance: true, completed: !!task.completionExceptions?.[currentDayId]});
                        } else if (task.recurrence.rule === 'weekly' && day.getDay() === startDate.getDay()) {
                            dayMap[currentDayId].push({...task, isInstance: true, completed: !!task.completionExceptions?.[currentDayId]});
                        }
                    }
                });
            }
        });

        return dayMap;
    }, [tasks, weekDates]);

    return (
        <>
            <div className="week-nav-header">
                <button onClick={() => changeWeek(-1)}>‹ Prev</button>
                <span>Week of {weekStart.toLocaleDateString()}</span>
                <button onClick={() => changeWeek(1)}>Next ›</button>
            </div>
            <div className="todo-calendar-vertical">
                {weekDates.map(date => {
                    const dateString = getDayId(date);
                    const dayTasks = (visibleTasks[dateString] || []).sort((a,b) => (a.dueTime || "00:00").localeCompare(b.dueTime || "00:00"));
                    return (
                        <div key={dateString} className="widget-card calendar-day-card-vertical">
                            <div className="day-card-header">
                               <h4>{date.toLocaleDateString(undefined, { weekday: 'long' })}</h4>
                               <h5>{date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</h5>
                            </div>
                            <AddTaskForm onAddTask={handleAddTaskLocal} date={date} />
                            <ul className="todo-page-list">
                                {dayTasks.map(task => (
                                    <li key={task.id + dateString} className={`${task.completed ? 'completed' : ''} priority-${task.priority}`}>
                                        <span className="task-time">{task.dueTime}</span>
                                        <span className="task-text" onClick={() => handleToggleTask(task)}>{task.text}</span>
                                        <button className="delete-btn" onClick={() => handleDeleteTask(task)}>×</button>
                                    </li>
                                ))}
                                {dayTasks.length === 0 && <p className="no-data-text-small">No tasks for this day.</p>}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

// --- "What's the Plan?" List View Component ---
/**
 * Renders the high-level list view with separate sections for Today, This Week, and Monthly Milestones.
 */
const ListViewComponent = ({ user, tasks, onAddTask, onUpdateTasks, onTaskComplete }) => {
    // Memoized selectors to filter tasks for each section
    const dailyTasks = useMemo(() => tasks.filter(t => t.type === 'task' && t.dueDate === getDayId(new Date())), [tasks]);
    const weeklyTasks = useMemo(() => {
        const weekDays = getWeekDates(new Date());
        return tasks.filter(t => t.type === 'task' && t.dueDate && weekDays.includes(t.dueDate));
    }, [tasks]);
    const monthlyMilestones = useMemo(() => tasks.filter(t => t.type === 'milestone' && t.monthId === getMonthId(new Date())), [tasks]);
    
    // Handlers for adding new items
    const handleAddTask = (task, priority) => {
        const fullTask = { ...task, type: 'task', dueDate: getDayId(new Date()), priority, dueTime: null, reminderOffset: -1, recurrence: { rule: 'none' } };
        onAddTask(fullTask);
    };
    
    const handleAddMilestone = (task, priority) => {
        const fullTask = { ...task, type: 'milestone', monthId: getMonthId(new Date()), priority, status: 'Not Started' };
        onAddTask(fullTask);
    }

    // Handlers for updating items
    const handleToggleTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task && !task.completed) { onTaskComplete(); }
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        onUpdateTasks(updatedTasks);
    };
    
    const handleMilestoneStatusChange = (taskId, newStatus) => {
         const updatedTasks = tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task);
         if (newStatus === 'Completed') {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== 'Completed') { onTaskComplete(); }
         }
        onUpdateTasks(updatedTasks);
    }

    const handleDeleteTask = (taskToDelete) => {
        if (!window.confirm(`Are you sure you want to delete "${taskToDelete.text}"?`)) return;
        const updatedTasks = tasks.filter(task => task.id !== taskToDelete.id);
        onUpdateTasks(updatedTasks);
    };
    
    return (
        <div className="list-view-container">
            <div className="widget-card">
                 <TodaysJobsList title="Today's Jobs" tasks={dailyTasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />
            </div>
             <div className="widget-card">
                 <ThisWeekList title="This Week" tasks={weeklyTasks} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask}/>
            </div>
             <div className="widget-card">
                 <MonthlyMilestonesList title="Monthly Milestones" milestones={monthlyMilestones} onAddMilestone={handleAddMilestone} onStatusChange={handleMilestoneStatusChange} onDeleteTask={handleDeleteTask}/>
            </div>
        </div>
    );
};

// --- List View Sub-Components ---
/**
 * Renders the "Today's Jobs" section with its own add form.
 */
const TodaysJobsList = ({ title, tasks, onAddTask, onToggleTask, onDeleteTask }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const [priority, setPriority] = useState('white');
    const priorityMap = { red: 'Must', green: 'High', blue: 'Medium', yellow: 'Low', white: 'None' };
    
    const handleAddTask = (e) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            onAddTask({ id: Date.now().toString(), text: newTaskText.trim(), completed: false }, priority);
            setNewTaskText('');
            setPriority('white');
        }
    };
   
    return (
        <div className="todo-list-container">
            <h4>{title}</h4>
            <form onSubmit={handleAddTask} className="original-todo-add-form with-priority">
                <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Add a new job for today..." />
                <div className="priority-selector">
                     {Object.keys(priorityMap).map(p => (<button key={p} type="button" title={priorityMap[p]} className={`priority-btn ${p} ${priority === p ? 'selected' : ''}`} onClick={() => setPriority(p)} />))}
                </div>
                <button type="submit">+</button>
            </form>
            <ul className="original-todo-list">
                {tasks.map(task => (
                    <li key={task.id} className={`${task.completed ? 'completed' : ''} priority-${task.priority || 'white'}`}>
                        <span onClick={() => onToggleTask(task.id)}>{task.text}</span>
                        <div className="todo-actions">
                            <button onClick={() => onDeleteTask(task)} className="delete-todo-btn">×</button>
                        </div>
                    </li>
                ))}
                {tasks.length === 0 && <li className="no-tasks">No jobs for today.</li>}
            </ul>
        </div>
    );
};

/**
 * Renders the read-only "This Week" summary list.
 */
const ThisWeekList = ({ title, tasks, onToggleTask, onDeleteTask }) => {
    const sortedTasks = useMemo(() => tasks.sort((a,b) => a.dueDate.localeCompare(b.dueDate)), [tasks]);
    return (
        <div className="todo-list-container">
            <h4>{title}</h4>
            <p className="list-view-subtitle">A summary of your scheduled tasks for the current week. Add tasks via Bonds Planning.</p>
            <ul className="original-todo-list">
                {sortedTasks.map(task => (
                    <li key={task.id} className={`${task.completed ? 'completed' : ''} priority-${task.priority || 'white'}`}>
                        <span className="task-date-badge">{new Date(task.dueDate.replace(/-/g, '/')).toLocaleDateString('en-US', {weekday: 'short'})}</span>
                        <span onClick={() => onToggleTask(task.id)}>{task.text}</span>
                        <div className="todo-actions">
                            <button onClick={() => onDeleteTask(task)} className="delete-todo-btn">×</button>
                        </div>
                    </li>
                ))}
                {tasks.length === 0 && <li className="no-tasks">No tasks scheduled for this week.</li>}
            </ul>
        </div>
    );
};

/**
 * Renders the "Monthly Milestones" section with its own add form and status tracker.
 */
const MonthlyMilestonesList = ({ title, milestones, onAddMilestone, onStatusChange, onDeleteTask }) => {
    const [newMilestoneText, setNewMilestoneText] = useState('');
    const [priority, setPriority] = useState('white');
    const priorityMap = { red: 'Must', green: 'High', blue: 'Medium', yellow: 'Low', white: 'None' };
    
    const handleAddMilestone = (e) => {
        e.preventDefault();
        if (newMilestoneText.trim()) {
            onAddMilestone({ id: Date.now().toString(), text: newMilestoneText.trim() }, priority);
            setNewMilestoneText('');
            setPriority('white');
        }
    };
    
    return (
        <div className="todo-list-container">
            <h4>{title}</h4>
            <form onSubmit={handleAddMilestone} className="original-todo-add-form with-priority">
                <input type="text" value={newMilestoneText} onChange={(e) => setNewMilestoneText(e.target.value)} placeholder="Add a new milestone..." />
                <div className="priority-selector">
                     {Object.keys(priorityMap).map(p => (<button key={p} type="button" title={priorityMap[p]} className={`priority-btn ${p} ${priority === p ? 'selected' : ''}`} onClick={() => setPriority(p)} />))}
                </div>
                <button type="submit">+</button>
            </form>
            <ul className="original-todo-list">
                {milestones.map(task => (
                    <li key={task.id} className={`priority-${task.priority || 'white'}`}>
                        <span>{task.text}</span>
                        <div className="todo-actions">
                            <select className="milestone-status" value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)}>
                                <option value="Not Started">Not Started</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                            </select>
                            <button onClick={() => onDeleteTask(task)} className="delete-todo-btn">×</button>
                        </div>
                    </li>
                ))}
                {milestones.length === 0 && <li className="no-tasks">No milestones for this month.</li>}
            </ul>
        </div>
    );
};


// --- Habit Tracker Page (With Custom Habits & Streaks) ---
/**
 * Renders the Habit Tracker page.
 */
const HabitTrackerPage = ({ user, onHabitComplete }) => {
    const [habits, setHabits] = useState([]);
    const [habitData, setHabitData] = useState({});
    const [currentDate, setCurrentDate] = useState(new Date());
    const [newHabitName, setNewHabitName] = useState('');

    const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
    
    const weekDates = useMemo(() => {
        const startDate = new Date(weekId.replace(/-/g, '/'));
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            return d;
        });
    }, [weekId]);

    // Fetch habits and their weekly data
    useEffect(() => {
        if (!user) return;
        const habitsDocRef = doc(db, 'users', user.uid, 'settings', 'habits');
        const unsubscribeHabits = onSnapshot(habitsDocRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().list) {
                setHabits(docSnap.data().list);
            } else { 
                const defaultHabits = [
                    { id: 'rise', name: 'Early Morning Rise', type: 'circle' }, { id: 'workout', name: 'Workout', type: 'circle' },
                    { id: 'meditate', name: 'Daily Meditation', type: 'circle' }, { id: 'water', name: 'Drink Water (4x)', type: 'water' },
                ];
                setDoc(habitsDocRef, { list: defaultHabits }); 
                setHabits(defaultHabits); 
            }
        });
        const dataDocRef = doc(db, 'users', user.uid, 'habits', weekId);
        const unsubscribeData = onSnapshot(dataDocRef, (docSnap) => { setHabitData(docSnap.exists() ? docSnap.data() : {}); });
        return () => { unsubscribeHabits(); unsubscribeData(); };
    }, [user, weekId]);

    // Handlers for adding and deleting habits
    const handleAddHabit = async (e) => {
        e.preventDefault();
        if (!newHabitName.trim()) return;
        const newHabit = { id: Date.now().toString(), name: newHabitName.trim(), type: 'circle' };
        const updatedHabits = [...habits, newHabit];
        await setDoc(doc(db, 'users', user.uid, 'settings', 'habits'), { list: updatedHabits });
        setNewHabitName('');
    };

    const handleDeleteHabit = async (habitIdToDelete) => {
        const habitToDelete = habits.find(h => h.id === habitIdToDelete);
        if(!habitToDelete || !window.confirm(`Are you sure you want to delete the habit "${habitToDelete.name}"? This cannot be undone.`)) return;
        const updatedHabits = habits.filter(h => h.id !== habitIdToDelete);
        await setDoc(doc(db, 'users', user.uid, 'settings', 'habits'), { list: updatedHabits });
    };

    // Handler for toggling habit completion
    const handleToggleHabit = useCallback(async (habitId, dayIndex) => {
        if (!user) return;
        const currentHabitWeekData = habitData[habitId] ? [...habitData[habitId]] : Array(7).fill(0);
        const habit = habits.find(h => h.id === habitId); if (!habit) return;
        
        const oldVal = currentHabitWeekData[dayIndex];
        
        if (habit.type === 'circle') { currentHabitWeekData[dayIndex] = currentHabitWeekData[dayIndex] ? 0 : 1; }
        else if (habit.type === 'water') { currentHabitWeekData[dayIndex] = ((currentHabitWeekData[dayIndex] || 0) + 1) % 5; }
        
        const newVal = currentHabitWeekData[dayIndex];

        // Trigger achievement count if a habit was completed
        if (newVal > oldVal) { onHabitComplete(); }
        
        await setDoc(doc(db, 'users', user.uid, 'habits', weekId), { [habitId]: currentHabitWeekData }, { merge: true });
    }, [user, habitData, habits, weekId, onHabitComplete]);
    
    // Navigate between weeks
    const changeWeek = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset * 7);
        setCurrentDate(newDate);
    };

    return (
        <div className="page-container">
            <header className="page-header"><h1>Habit Tracker</h1><p>Build consistency with your daily routines.</p></header>
             <div className="week-nav-header">
                <button onClick={() => changeWeek(-1)}>‹ Prev Week</button>
                <span>Week of {new Date(weekId.replace(/-/g, '/')).toLocaleDateString()}</span>
                <button onClick={() => changeWeek(1)}>Next Week ›</button>
            </div>
            <div className="widget-card tracker-container">
                <main className="tracker">
                    <div className="grid-cell"></div>
                    {weekDates.map(date => (
                        <div className="day-header" key={date.toString()}>
                            <div className="day-name">{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                            <div className="date-number">{`${date.getDate()}`}</div>
                        </div>
                    ))}
                    {habits.map(habit => (
                        <React.Fragment key={habit.id}>
                            <div className="habit-label">
                                {habit.name}
                                <button className="delete-habit-btn" onClick={() => handleDeleteHabit(habit.id)}>×</button>
                            </div>
                            {weekDates.map((_, index) => (
                                <div key={index} className="track-cell">
                                    {habit.type === 'circle' ? (
                                        <div className={`circle ${habitData[habit.id] && habitData[habit.id][index] === 1 ? 'completed' : ''}`} onClick={() => handleToggleHabit(habit.id, index)}></div>
                                    ) : (
                                        <div className="water-tracker" onClick={() => handleToggleHabit(habit.id, index)}>
                                            {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`water-drop ${i < (habitData[habit.id]?.[index] || 0) ? 'completed' : ''}`}></div>)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </main>
            </div>
            <div className="widget-card" style={{marginTop: '1.5rem'}}>
                <h3>Add New Habit</h3>
                <form onSubmit={handleAddHabit} className="add-habit-form">
                    <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="e.g., Read for 15 minutes"/>
                    <button type="submit">Add Habit</button>
                </form>
            </div>
            <WeeklyAnalysis habits={habits} habitData={habitData} user={user} />
        </div>
    );
};

// --- Weekly Analysis Component (with Streak Display) ---
const WeeklyAnalysis = ({ habits, habitData, user }) => {
    // NOTE: This is a simplified streak calculation based only on the current week's visible data.
    // A full implementation would require fetching historical data.
    const calculateStreak = (habitId) => {
        const data = habitData[habitId] || [];
        let currentStreak = 0;
        // Check backwards from today (last element in the week's data)
        for (let i = data.length - 1; i >= 0; i--) {
            if (data[i] > 0) { // Assuming any completion (e.g., 1 for circle, >0 for water) counts
                currentStreak++;
            } else {
                break; // Streak is broken
            }
        }
        return currentStreak;
    };

    const analysis = useMemo(() => {
        if (!habits.length) return { overall: 0, byHabit: [] };
        let totalPossible = 0;
        let totalCompleted = 0;
        const byHabit = habits.map(habit => {
            const data = habitData[habit.id] || [];
            const completedCount = data.reduce((sum, val) => {
                if (habit.type === 'circle') return sum + (val > 0 ? 1 : 0);
                if (habit.type === 'water') return sum + val;
                return sum;
            }, 0);
            const possibleCount = habit.type === 'water' ? 7 * 4 : 7;
            totalPossible += possibleCount;
            totalCompleted += completedCount;
            return {
                id: habit.id, name: habit.name,
                completed: completedCount,
                percentage: possibleCount > 0 ? Math.round((completedCount / possibleCount) * 100) : 0,
                streak: calculateStreak(habit.id) // Calculate streak here
            };
        });
        const overall = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
        return { overall, byHabit };
    }, [habits, habitData]);

    return (
        <div className="widget-card" style={{ marginTop: '1.5rem' }}>
            <h3>Weekly Analysis</h3>
            <div className="analysis-summary">
                <h4>Overall Completion</h4>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${analysis.overall}%` }}>{analysis.overall}%</div>
                </div>
            </div>
            <div className="analysis-details">
                <h4>Habit Consistency</h4>
                {analysis.byHabit.map(habit => (
                   <div key={habit.id} className="chart-row">
                        <div className="chart-label">{habit.name} {habit.streak > 1 && <span className="streak-badge">🔥 {habit.streak}</span>}</div>
                        <div className="chart-bar-bg">
                            <div className="chart-bar-fg" style={{ width: `${habit.percentage}%` }}></div>
                        </div>
                        <div className="chart-value">{habit.percentage}%</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Updated: Red Alert Page (with Details) ---
/**
 * Renders the Red Alerts page, aggregating all high-priority items from across the app.
 */
const RedAlertPage = ({ user }) => {
    const [redAlerts, setRedAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const processPlanData = (planData, type) => {
            let goals = [];
            if (planData.quarterly) goals.push(...planData.quarterly.filter(g => g.isImportant && !g.completed).map(g => ({ ...g, type, planType: "Quarterly Plan" })));
            if (planData.yearly) goals.push(...planData.yearly.filter(g => g.isImportant && !g.completed).map(g => ({ ...g, type, planType: "Yearly Plan" })));
            if (planData.fiveYear) goals.push(...planData.fiveYear.filter(g => g.isImportant && !g.completed).map(g => ({ ...g, type, planType: "5-Year Plan" })));
            return goals;
        };

        const refs = [
            { ref: doc(db, 'users', user.uid, 'data', 'tasks'), alertType: 'task' },
            { ref: doc(db, 'users', user.uid, 'data', 'media'), alertType: 'media' },
            { ref: doc(db, 'users', user.uid, 'data', 'career_plan'), alertType: 'plan-career', type: 'Career Goal' },
            { ref: doc(db, 'users', user.uid, 'data', 'life_plan'), alertType: 'plan-life', type: 'Life Goal' },
        ];

        const unsubs = refs.map(({ ref, alertType, type }) => onSnapshot(ref, (doc) => {
            let items = [];
            if (doc.exists()) {
                const data = doc.data();
                if (alertType === 'task') {
                    items = (data.list || [])
                        .filter(t => t.priority === 'red' && (t.type === 'task' ? !t.completed : t.status !== 'Completed'))
                        .map(i => {
                            let context = '';
                            if (i.type === 'task') context = i.dueDate === getDayId(new Date()) ? "Today's Job" : `Due: ${i.dueDate}`;
                            else if (i.type === 'milestone') context = `Monthly Milestone: ${i.status}`;
                            return { ...i, type: i.type === 'task' ? 'Task' : 'Milestone', context };
                        });
                } else if (alertType === 'media') {
                    items = (data.list || [])
                        .filter(m => m.isImportant && m.status !== 'Completed')
                        .map(i => ({ ...i, text: i.title, type: i.type, context: `Status: ${i.status}` }));
                } else if (alertType.startsWith('plan')) {
                    items = processPlanData(data, type);
                    items = items.map(i => ({ ...i, context: `From: ${i.planType}` }));
                }
            }
            
            setRedAlerts(currentAlerts => {
                const otherAlerts = currentAlerts.filter(a => a.alertType !== alertType);
                return [...otherAlerts, ...items.map(i => ({ ...i, alertType }))];
            });
        }));
        
        setLoading(false);
        return () => unsubs.forEach(unsub => unsub());
    }, [user]);

    return (
        <div className="page-container">
            <header className="page-header"><h1>Red Alerts</h1><p>A central hub for all items you've marked with the highest priority across the app.</p></header>
            <div className="widget-card">
                <h3>Urgent & Important</h3>
                {loading ? <p>Loading alerts...</p> : (
                    <ul className="todo-page-list">
                        {redAlerts.map(item => (
                            <li key={item.id + item.alertType} className="priority-red with-details">
                                <div className="alert-main-info">
                                    <span className="alert-type-badge">{item.type.toUpperCase()}</span>
                                    <span className="task-text">{item.text}</span>
                                </div>
                                <div className="alert-details">
                                    {item.context && <span>{item.context}</span>}
                                    {item.dueTime && <span>at {item.dueTime}</span>}
                                </div>
                            </li>
                        ))}
                        {redAlerts.length === 0 && <p className="no-data-text">No urgent alerts right now. Well done!</p>}
                    </ul>
                )}
            </div>
        </div>
    );
};

// --- Updated: Reusable Plan Page (with Priority) ---
/**
 * Renders the Career and Life Plan pages.
 */
const PlanPage = ({ user, pageTitle, pageSubtitle, collectionName, onGoalComplete }) => {
    const [plans, setPlans] = useState({ quarterly: [], yearly: [], fiveYear: [] });
    const planTypes = { quarterly: "Quarterly Plan", yearly: "Yearly Plan", fiveYear: "Next 5 Years Plan" };

    useEffect(() => {
        if (!user) return;
        const docRef = doc(db, 'users', user.uid, 'data', collectionName);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) { setPlans(doc.data()); }
            else { setDoc(docRef, { quarterly: [], yearly: [], fiveYear: [] }); }
        });
        return unsubscribe;
    }, [user, collectionName]);

    const handleAddGoal = async (text, planType, isImportant) => {
        const goal = { id: Date.now().toString(), text, completed: false, isImportant };
        const updatedList = [goal, ...(plans[planType] || [])];
        await setDoc(doc(db, 'users', user.uid, 'data', collectionName), { ...plans, [planType]: updatedList });
    };

    const handleToggleGoal = async (goalId, planType) => {
        const list = plans[planType] || [];
        const goal = list.find(g => g.id === goalId);
        if (goal && !goal.completed) { onGoalComplete(); }
        const updatedList = list.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g);
        await setDoc(doc(db, 'users', user.uid, 'data', collectionName), { ...plans, [planType]: updatedList });
    };

    const handleDeleteGoal = async (goalToDelete, planType) => {
        if(!window.confirm(`Are you sure you want to delete the goal "${goalToDelete.text}"?`)) return;
        const list = plans[planType] || [];
        const updatedList = list.filter(g => g.id !== goalToDelete.id);
        await setDoc(doc(db, 'users', user.uid, 'data', collectionName), { ...plans, [planType]: updatedList });
    };

    const AddGoalForm = ({ onAdd, planType }) => {
        const [newGoal, setNewGoal] = useState('');
        const [isImportant, setIsImportant] = useState(false);
        const handleSubmit = (e) => { e.preventDefault(); if (newGoal.trim()) { onAdd(newGoal.trim(), planType, isImportant); setNewGoal(''); setIsImportant(false); } };
        return (
            <form onSubmit={handleSubmit} className="plan-add-form">
                <input type="text" value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder="Add a new goal..." />
                <label className="priority-checkbox"><input type="checkbox" checked={isImportant} onChange={e => setIsImportant(e.target.checked)}/> High Priority</label>
                <button type="submit">+</button>
            </form>
        );
    };

    return (
        <div className="page-container">
            <header className="page-header"><h1>{pageTitle}</h1><p>{pageSubtitle}</p></header>
            <div className="plan-layout-grid">
                {Object.entries(planTypes).map(([key, title]) => (
                    <div className="widget-card" key={key}>
                        <h3>{title}</h3>
                        <AddGoalForm onAdd={handleAddGoal} planType={key} />
                        <ul className="todo-page-list">
                            {(plans[key] || []).map(goal => (
                                <li key={goal.id} className={`${goal.completed ? 'completed' : ''} ${goal.isImportant ? 'priority-red' : ''}`}>
                                    <span className="task-text" onClick={() => handleToggleGoal(goal.id, key)}>{goal.text}</span>
                                    <button className="delete-btn" onClick={() => handleDeleteGoal(goal, key)}>×</button>
                                </li>
                            ))}
                            {(plans[key] || []).length === 0 && <p className="no-data-text-small">No goals defined.</p>}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Updated: Book & Movie Page (Separated) ---
const BookMovieListPage = ({ user, onMediaComplete }) => {
    const [media, setMedia] = useState([]);
    const [newItem, setNewItem] = useState({ title: '', link: '', type: 'Book', isImportant: false });

    const books = useMemo(() => media.filter(m => m.type === 'Book'), [media]);
    const movies = useMemo(() => media.filter(m => m.type === 'Movie'), [media]);

    useEffect(() => {
        if (!user) return;
        const docRef = doc(db, 'users', user.uid, 'data', 'media');
        const unsubscribe = onSnapshot(docRef, (doc) => { if (doc.exists()) { setMedia(doc.data().list || []); } });
        return unsubscribe;
    }, [user]);

    const handleAddItem = async (e) => {
        e.preventDefault(); if (newItem.title.trim() === '') return;
        const item = { id: Date.now().toString(), status: 'Not Started Yet', ...newItem };
        await setDoc(doc(db, 'users', user.uid, 'data', 'media'), { list: [item, ...media] }, { merge: true });
        setNewItem({ title: '', link: '', type: 'Book', isImportant: false });
    };

    const handleDeleteItem = async (itemToDelete) => {
        if (!window.confirm(`Are you sure you want to delete "${itemToDelete.title}"?`)) return;
        const updatedMedia = media.filter(m => m.id !== itemToDelete.id);
        await setDoc(doc(db, 'users', user.uid, 'data', 'media'), { list: updatedMedia });
    };

    const handleStatusChange = async (itemId, newStatus) => {
        const item = media.find(m => m.id === itemId);
        if (item && item.status !== 'Completed' && newStatus === 'Completed') {
            onMediaComplete();
        }
        const updatedMedia = media.map(m => m.id === itemId ? { ...m, status: newStatus } : m);
        await setDoc(doc(db, 'users', user.uid, 'data', 'media'), { list: updatedMedia });
    };

    const MediaSection = ({ title, items }) => {
        const mediaByStatus = useMemo(() => {
            return items.reduce((acc, item) => {
                acc[item.status] = [...(acc[item.status] || []), item];
                return acc;
            }, { 'Not Started Yet': [], 'Ongoing': [], 'Completed': [] });
        }, [items]);
        return (
            <div className="media-section">
                <h2>{title}</h2>
                <div className="media-grid">
                    <MediaList title="Not Started Yet" items={mediaByStatus['Not Started Yet']} onStatusChange={handleStatusChange} onDelete={handleDeleteItem} />
                    <MediaList title="Ongoing" items={mediaByStatus['Ongoing']} onStatusChange={handleStatusChange} onDelete={handleDeleteItem} />
                    <MediaList title="Completed" items={mediaByStatus['Completed']} onStatusChange={handleStatusChange} onDelete={handleDeleteItem} />
                </div>
            </div>
        );
    };
    
    const MediaList = ({ title, items, onStatusChange, onDelete }) => (
        <div className="widget-card">
            <h3>{title}</h3>
            <ul className="media-list">
                {(items || []).map(item => (
                    <li key={item.id} className={item.isImportant ? 'important-media' : ''}>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a>
                        <div className="media-item-controls">
                            <select value={item.status} onChange={(e) => onStatusChange(item.id, e.target.value)}>
                                <option value="Not Started Yet">Not Started</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                            </select>
                            <button onClick={() => onDelete(item)}>×</button>
                        </div>
                    </li>
                ))}
                {(items || []).length === 0 && <p className="no-data-text-small">No items in this category.</p>}
            </ul>
        </div>
    );
    
    return (
        <div className="page-container">
            <header className="page-header"><h1>Book & Movie List</h1><p>Your personal library and watchlist.</p></header>
            <div className="widget-card">
                <h3>Add to Your List</h3>
                <form onSubmit={handleAddItem} className="media-form">
                    <input type="text" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} placeholder="Title" />
                    <input type="text" value={newItem.link} onChange={(e) => setNewItem({ ...newItem, link: e.target.value })} placeholder="Link (optional)" />
                    <div className="media-options">
                        <select value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}>
                            <option value="Book">Book</option>
                            <option value="Movie">Movie</option>
                        </select>
                        <label>
                            <input type="checkbox" checked={newItem.isImportant} onChange={(e) => setNewItem({ ...newItem, isImportant: e.target.checked })} />
                            High Priority (Red Alert)
                        </label>
                    </div>
                    <button type="submit">Add Item</button>
                </form>
            </div>
            <MediaSection title="Books" items={books} />
            <hr className="section-divider" />
            <MediaSection title="Movies" items={movies} />
        </div>
    );
};

// --- #################### MAIN APP COMPONENT #################### ---
export default function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activePage, setActivePage] = useState('todo');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [bgImage, setBgImage] = useState(localStorage.getItem('bgImage') || 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2070&auto=format&fit=crop');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    
    const [tasks, setTasks] = useState([]);
    const [activeReminder, setActiveReminder] = useState(null);
    const [shownReminders, setShownReminders] = useState([]);
    const [userStats, setUserStats] = useState({ tasksCompleted: 0, habitsCompleted: 0 });


    useEffect(() => {
        if (!user) return;
        const statsRef = doc(db, 'users', user.uid, 'data', 'stats');
        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                setUserStats(doc.data());
            } else {
                setDoc(statsRef, { tasksCompleted: 0, habitsCompleted: 0 });
            }
        });
        return unsubscribe;
    }, [user]);

    const handleTaskComplete = useCallback(async () => {
        if (!user) return;
        const statsRef = doc(db, 'users', user.uid, 'data', 'stats');
        await setDoc(statsRef, { tasksCompleted: increment(1) }, { merge: true });
    }, [user]);

     const handleHabitComplete = useCallback(async () => {
        if (!user) return;
        const statsRef = doc(db, 'users', user.uid, 'data', 'stats');
        await setDoc(statsRef, { habitsCompleted: increment(1) }, { merge: true });
    }, [user]);

    useEffect(() => {
        document.body.className = theme;
    }, [theme]);

    const handleSetTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    useEffect(() => {
        if (!user) return;
        const tasksRef = doc(db, 'users', user.uid, 'data', 'tasks');
        const unsubscribe = onSnapshot(tasksRef, (doc) => {
            if (doc.exists()) { setTasks(doc.data().list || []); }
        });
        return unsubscribe;
    }, [user]);

    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const dueReminders = tasks.filter(task => {
                if (task.completed || !task.dueDate || !task.dueTime || !task.reminderOffset || task.reminderOffset < 0 || shownReminders.includes(task.id) || task.type !== 'task') {
                    return false;
                }
                const [year, month, day] = task.dueDate.split('-');
                const [hours, minutes] = task.dueTime.split(':');
                const dueDateTime = new Date(year, month - 1, day, hours, minutes);
                const reminderTime = new Date(dueDateTime.getTime() - task.reminderOffset * 60000);
                return now >= reminderTime;
            });

            if (dueReminders.length > 0 && !activeReminder) {
                const nextReminder = dueReminders[0];
                setActiveReminder(nextReminder);
                setShownReminders(prev => [...prev, nextReminder.id]);
            }
        };

        const interval = setInterval(checkReminders, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [tasks, activeReminder, shownReminders]);


    const handleAddTask = async (taskDetails) => {
        const tasksRef = doc(db, 'users', user.uid, 'data', 'tasks');
        await setDoc(tasksRef, { list: [taskDetails, ...tasks] }, { merge: true });
    };

    const handleUpdateTasks = async (updatedTasks) => {
        const tasksRef = doc(db, 'users', user.uid, 'data', 'tasks');
        await setDoc(tasksRef, { list: updatedTasks });
    };

    const handleDismissReminder = (reminderId) => {
        setActiveReminder(null);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setIsLoading(false); });
        return unsubscribe;
    }, []);

    const handleBgUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                setBgImage(dataUrl);
                localStorage.setItem('bgImage', dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleNavClick = (page) => {
        setActivePage(page);
        setIsSidebarOpen(false);
    }

    const renderActivePage = () => {
        switch (activePage) {
            case 'notes': return <NotesPage user={user} />;
            case 'todo': return <TodoPage user={user} tasks={tasks} onAddTask={handleAddTask} onUpdateTasks={handleUpdateTasks} onTaskComplete={handleTaskComplete} />;
            case 'habits': return <HabitTrackerPage user={user} onHabitComplete={handleHabitComplete} />;
            case 'alerts': return <RedAlertPage user={user} />;
            case 'career': return <PlanPage user={user} pageTitle="Career Plan" pageSubtitle="Long-term professional goals and milestones." collectionName="career_plan" />;
            case 'life': return <PlanPage user={user} pageTitle="Life Plan" pageSubtitle="Personal ambitions and life aspirations." collectionName="life_plan" />;
            case 'media': return <BookMovieListPage user={user} />;
            default: return <TodoPage user={user} tasks={tasks} onAddTask={handleAddTask} onUpdateTasks={handleUpdateTasks} onTaskComplete={handleTaskComplete} />;
        }
    };

    if (isLoading) return <div className="loading-screen">Loading Momentum...</div>;
    if (!user) return <AuthComponent />;

    return (
        <>
            <style>{`
                /* --- THEME VARIABLES --- */
                body { transition: background-color 0.3s, color 0.3s; }
                body.dark { --bg-color: #121212; --primary-text: #e0e0e0; --secondary-text: #a0a0a0; --card-bg: rgba(28, 28, 30, 0.8); --border-color: rgba(255, 255, 255, 0.1); --bg-overlay: rgba(18, 18, 18, 0.6); }
                body.light { --bg-color: #f4f4f5; --primary-text: #1a1a1a; --secondary-text: #52525b; --card-bg: rgba(255, 255, 255, 0.7); --border-color: rgba(0, 0, 0, 0.1); --bg-overlay: rgba(244, 244, 245, 0.3); }
                body.nord { --bg-color: #2E3440; --primary-text: #D8DEE9; --secondary-text: #81A1C1; --card-bg: rgba(46, 52, 64, 0.85); --border-color: #4C566A; --bg-overlay: rgba(46, 52, 64, 0.5); }
                body.solarized { --bg-color: #002b36; --primary-text: #839496; --secondary-text: #586e75; --card-bg: rgba(7, 54, 66, 0.85); --border-color: #073642; --bg-overlay: rgba(0, 43, 54, 0.5); }

                
                /* --- Base & Fonts --- */
                :root { --accent-color: #00aaff; --red: #ff4d4d; --green: #33cc33; --blue: #3399ff; --yellow: #ffcc00; --white: #e0e0e0; --font-sans: 'Inter', sans-serif; }
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                body { margin: 0; font-family: var(--font-sans); background-color: var(--bg-color); color: var(--primary-text); }
                * { box-sizing: border-box; } input, textarea, button, select { font-family: var(--font-sans); background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: var(--primary-text); padding: 12px; border-radius: 8px; font-size: 1rem; } a { color: var(--accent-color); text-decoration: none; } a:hover { text-decoration: underline; }
                body.light input, body.light textarea, body.light button, body.light select { background: rgba(255,255,255,0.5); border-color: var(--border-color); color: var(--primary-text); }
                body.nord input, body.nord textarea, body.nord button, body.nord select,
                body.solarized input, body.solarized textarea, body.solarized button, body.solarized select { background: rgba(0,0,0,0.2); }
                body.light .logout-btn { background: rgba(0,0,0,0.05); }

                /* --- Auth & Loaders --- */
                .auth-container { display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; } .auth-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab); background-size: 400% 400%; animation: gradient 15s ease infinite; } @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .auth-card { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.18); padding: 2.5rem; width: 100%; max-width: 400px; text-align: center; color: white; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); margin: 1rem; } .auth-brand { font-size: 3rem; margin-bottom: 0.5rem; } .auth-title { font-weight: 600; font-size: 1.5rem; margin: 0 0 0.5rem; } .auth-subtitle { font-weight: 300; margin-bottom: 2rem; } .auth-form { display: flex; flex-direction: column; gap: 1rem; } .auth-input-group input { width: 100%; padding: 14px; background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 10px; color: white; font-size: 1rem; } .auth-input-group input::placeholder { color: rgba(255, 255, 255, 0.7); } .auth-input-group input:focus { outline: none; background: rgba(255, 255, 255, 0.3); box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5); } .auth-button { padding: 14px; background: white; color: #e73c7e; border: none; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: 600; display: flex; justify-content: center; align-items: center; min-height: 50px; } .auth-toggle { margin-top: 1.5rem; font-size: 0.9rem; } .auth-toggle span { font-weight: 600; cursor: pointer; } .auth-error { color: #111; background-color: rgba(255, 255, 255, 0.8); padding: 10px; border-radius: 5px; margin-bottom: 1rem; font-size: 0.9rem; } .loader-small { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-bottom-color: #fff; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; } @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .loader-small-dark { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-bottom-color: var(--primary-text); border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; }

                /* --- Reminder Modal --- */
                .reminder-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); z-index: 2000; display: flex; justify-content: center; align-items: center; }
                .reminder-modal-content { background: var(--card-bg); border: 1px solid var(--border-color); padding: 2rem; border-radius: 15px; text-align: center; max-width: 400px; width: 90%; animation: fadeIn 0.3s ease; }
                .reminder-modal-content h3 { margin-top: 0; font-size: 1.8rem; color: var(--accent-color); }
                .reminder-task-text { font-size: 1.2rem; margin: 1rem 0; }
                .reminder-due-time { font-size: 1rem; color: var(--secondary-text); margin-bottom: 2rem; }
                .reminder-modal-content button { width: 100%; padding: 14px; background: var(--accent-color); color: white; font-size: 1rem; font-weight: 600; }

                /* --- Main App Layout --- */
                .app-container { position: relative; width: 100vw; height: 100vh; overflow: hidden; } .app-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; z-index: -2; transition: background-image 0.5s ease-in-out; } .app-background::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--bg-overlay); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: -1; } .app-layout { display: flex; height: 100vh; } .main-content { flex-grow: 1; padding: 2rem 3rem; overflow-y: auto; }
                .mobile-header { display: none; }
                
                /* --- Sidebar --- */
                .sidebar { background: rgba(0,0,0,0.2); border-right: 1px solid var(--border-color); padding: 1.5rem; display: flex; flex-direction: column; width: 260px; flex-shrink: 0; transition: transform 0.3s ease-in-out; } body.light .sidebar { background: rgba(255,255,255,0.3); } .sidebar-header { font-size: 2rem; margin: 0 0 2.5rem 0; font-weight: 700; } .sidebar nav { display: flex; flex-direction: column; gap: 0.5rem; } .nav-button { display: flex; align-items: center; gap: 12px; background: none; border: none; color: var(--secondary-text); padding: 12px 15px; border-radius: 8px; font-size: 1rem; font-weight: 600; text-align: left; cursor: pointer; transition: background-color 0.2s, color 0.2s; width: 100%; } .nav-button:hover { background-color: rgba(255,255,255,0.05); color: var(--primary-text); } body.light .nav-button:hover { background-color: rgba(0,0,0,0.05); } .nav-button.active { background-color: var(--accent-color); color: white; } .sidebar-footer { margin-top: auto; } .settings-form { display: flex; gap: 1rem; margin-bottom: 1rem; } .settings-form select, .settings-form label { flex: 1; text-align: center; font-size: 0.9rem; padding: 8px; } .settings-form input[type="file"] { display: none; } .user-profile { font-size: 0.9rem; line-height: 1.4; word-break: break-all; } .logout-btn { background: rgba(255,255,255,0.1); border: none; width: 100%; padding: 10px; border-radius: 8px; font-weight: 600; color: var(--primary-text); cursor: pointer; margin-top: 1rem; }

                /* --- General & Widgets --- */
                .page-container { animation: fadeIn 0.5s ease; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .page-header { margin-bottom: 2rem; } .page-header h1 { font-size: 2.5rem; margin: 0; } .page-header p { color: var(--secondary-text); margin: 0.25rem 0 0; font-size: 1.1rem; } .widget-card { background: var(--card-bg); padding: 1.5rem; border-radius: 15px; border: 1px solid var(--border-color); } .no-data-text { color: var(--secondary-text); font-style: italic; text-align: center; padding: 2rem 0; } .no-data-text-small { color: var(--secondary-text); font-style: italic; text-align: center; padding: 1rem 0; font-size: 0.9rem; } button[type="submit"] { background: var(--accent-color); color: white; border: none; padding: 12px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; } .week-nav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: var(--card-bg); padding: 0.75rem 1.5rem; border-radius: 12px; } .week-nav-header button { background: none; border: 1px solid var(--border-color); }
                
                /* --- Notes Page --- */
                .note-add-form { display: flex; flex-direction: column; gap: 1rem; } .note-add-form textarea { min-height: 80px; resize: vertical; } .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; } .note-card { background: var(--card-bg); padding: 1.5rem; border-radius: 15px; border: 1px solid var(--border-color); display: flex; flex-direction: column; } .note-card p { flex-grow: 1; margin: 0; white-space: pre-wrap; word-wrap: break-word; } .note-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; color: var(--secondary-text); font-size: 0.8rem; } .note-actions { display: flex; gap: 0.5rem; } .note-actions button { background: none; border: none; color: var(--secondary-text); font-size: 1.2rem; cursor: pointer; padding: 0; } .note-card.pinned { border-left: 4px solid var(--accent-color); background: rgba(0, 170, 255, 0.05); } .note-card.highlighted { background: rgba(0, 170, 255, 0.15); }
                
                /* --- ToDo Page with Reminders --- */
                .notification-banner { background: var(--accent-color); color: white; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; } .notification-banner p { margin: 0; } .notification-banner button { background: white; color: var(--accent-color); border: none; }
                .view-toggle-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; } .view-toggle-tabs button { flex-grow: 1; background: rgba(0,0,0,0.3); } .view-toggle-tabs button.active { background: var(--accent-color); color: white; }
                .todo-calendar-vertical { display: flex; flex-direction: column; gap: 1rem; } .calendar-day-card-vertical { display: flex; flex-direction: column; } .day-card-header { text-align: left; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; } .day-card-header h4 { margin: 0; } .day-card-header h5 { margin: 0; color: var(--secondary-text); }
                .todo-page-form { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; margin-bottom: 1rem; } .task-input-main { grid-column: 1 / -1; } .task-details-inputs { display: flex; flex-wrap: wrap; gap: 0.5rem; } .priority-selector { display: flex; align-items: center; justify-self: end; } .add-task-btn { grid-column: 2; grid-row: 2; }
                .priority-btn { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); cursor: pointer; transition: transform 0.2s; padding: 0; background-color: transparent; } .priority-btn.selected { transform: scale(1.2); border-color: var(--accent-color); } .priority-btn.red { background-color: var(--red); } .priority-btn.green { background-color: var(--green); } .priority-btn.blue { background-color: var(--blue); } .priority-btn.yellow { background-color: var(--yellow); } .priority-btn.white { background-color: #555; } .todo-page-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; flex-grow: 1; } .todo-page-list li { display: flex; align-items: center; gap: 1rem; padding: 10px 12px; border-radius: 8px; background: rgba(0,0,0,0.2); border-left: 5px solid transparent; } .todo-page-list li .task-time { font-size: 0.8rem; font-weight: 600; color: var(--secondary-text); } .todo-page-list li.priority-red { border-left-color: var(--red); } .todo-page-list li.priority-green { border-left-color: var(--green); } .todo-page-list li.priority-blue { border-left-color: var(--blue); } .todo-page-list li.priority-yellow { border-left-color: var(--yellow); } .todo-page-list li.priority-white { border-left-color: var(--secondary-text); } .todo-page-list li.completed { opacity: 0.6; } .todo-page-list li.completed .task-text { text-decoration: line-through; } .task-text { flex-grow: 1; cursor: pointer; } .delete-btn { background: none; border: none; color: var(--secondary-text); font-size: 1.2rem; cursor: pointer; padding: 0; }
                
                /* --- Synced List View Styles --- */
                .list-view-container { display: flex; flex-direction: column; gap: 1.5rem; }
                .todo-list-container h4 { margin-top: 0; } .original-todo-add-form { display: flex; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;} .original-todo-add-form input { flex-grow: 1; } .original-todo-add-form.with-priority .priority-selector { margin-left: auto; } .original-todo-add-form button[type="submit"] { background: var(--accent-color); color: white; border: none; padding: 0 15px; font-size: 1.5rem; cursor: pointer; }
                .original-todo-list { list-style: none; padding: 0; margin: 0; } .original-todo-list li:not(.no-tasks) { display: flex; align-items: center; padding: 12px 5px; border-bottom: 1px solid var(--border-color); border-left: 5px solid transparent; } .original-todo-list li span { flex-grow: 1; cursor: pointer; } .original-todo-list li.completed span { text-decoration: line-through; color: var(--secondary-text); }
                .original-todo-list li.priority-red { border-left-color: var(--red); } .original-todo-list li.priority-green { border-left-color: var(--green); } .original-todo-list li.priority-blue { border-left-color: var(--blue); } .original-todo-list li.priority-yellow { border-left-color: var(--yellow); } .original-todo-list li.priority-white { border-left-color: var(--secondary-text); }
                .todo-actions { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; } .delete-todo-btn { background:none; border:none; color:var(--secondary-text); cursor:pointer; font-size:1.2rem; }
                .list-view-subtitle { font-size: 0.9rem; color: var(--secondary-text); margin-top: -1rem; margin-bottom: 1rem; }
                .task-date-badge { font-size: 0.75rem; font-weight: bold; background-color: var(--secondary-text); color: var(--bg-color); padding: 2px 6px; border-radius: 5px; margin-right: 0.5rem;}
                .milestone-status { font-size: 0.8rem; padding: 4px 6px; }

                /* --- Habit Tracker & Analysis --- */
                .tracker-container { overflow-x: auto; } .tracker { width: 100%; display: grid; grid-template-columns: minmax(120px, 1.5fr) repeat(7, 1fr); gap: 10px; align-items: center; min-width: 500px; } .day-header { font-weight: 600; text-align: center; } .date-number { font-size: 1.2em; } .day-name { font-size: 0.8em; color: var(--secondary-text); } .habit-label { font-weight: 400; display: flex; align-items: center; justify-content: space-between; } .delete-habit-btn { background: none; border: none; color: transparent; cursor: pointer; font-size: 1.2rem; } .habit-label:hover .delete-habit-btn { color: var(--secondary-text); } .track-cell { display: flex; justify-content: center; align-items: center; height: 40px; } .circle { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border-color); cursor: pointer; } .circle.completed { background-color: var(--accent-color); border-color: var(--accent-color); } .water-tracker { display: flex; gap: 4px; cursor: pointer; } .water-drop { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid var(--border-color); } .water-drop.completed { background-color: var(--accent-color); border-color: var(--accent-color); } .progress-bar-container { background: rgba(0,0,0,0.3); border-radius: 30px; height: 20px; width: 100%; overflow: hidden; margin: 0.5rem 0; } .progress-bar { background: var(--accent-color); height: 100%; border-radius: 30px; transition: width 0.5s ease-in-out; color: black; font-weight: 600; font-size: 0.8rem; text-align: center; line-height: 20px;} .analysis-details { margin-top: 1.5rem; } .chart-row { display: grid; grid-template-columns: 1fr 2fr auto; align-items: center; gap: 1rem; margin-bottom: 0.5rem; } .chart-label { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .chart-bar-bg { background-color: rgba(0,0,0,0.3); border-radius: 5px; height: 18px; } .chart-bar-fg { background-color: var(--accent-color); height: 100%; border-radius: 5px; transition: width 0.5s ease; } .chart-value { font-size: 0.9rem; font-weight: 600; text-align: right; }
                .add-habit-form { display: flex; gap: 1rem; } .add-habit-form input { flex-grow: 1; }
                .streak-badge { background-color: var(--yellow); color: #111; font-size: 0.7em; padding: 2px 5px; border-radius: 5px; margin-left: 8px; }

                /* --- Plan Page --- */
                .plan-layout-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; } .plan-add-form { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin-bottom: 1rem; } .plan-add-form input[type="text"] { flex-grow: 1; } .priority-checkbox { display: flex; align-items: center; gap: 0.5rem; }

                /* --- Media Page --- */
                .media-section { margin-top: 2rem; } .media-section h2 { font-size: 1.8rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem; } .section-divider { border: 0; height: 1px; background: var(--border-color); margin: 3rem 0; } .media-form { display: flex; flex-direction: column; gap: 1rem; } .media-options { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; } .media-options select, .media-options input { width: auto; } .media-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; } .media-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; } .media-list li { display: flex; align-items: center; gap: 10px; } .media-list li.important-media a { color: var(--red); font-weight: bold; } .media-item-controls { margin-left: auto; display: flex; gap: 0.5rem; align-items: center; } .media-item-controls select { padding: 4px 8px; font-size: 0.8rem; } .media-item-controls button { background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 0; color: var(--secondary-text); }
                
                /* --- Red Alert Page --- */
                .alert-type-badge { background-color: var(--secondary-text); color: var(--bg-color); padding: 2px 6px; font-size: 0.7rem; border-radius: 4px; font-weight: bold; }
                .todo-page-list li.with-details { flex-direction: column; align-items: flex-start; }
                .alert-main-info { display: flex; align-items: center; gap: 1rem; width: 100%;}
                .alert-details { font-size: 0.8rem; color: var(--secondary-text); padding-left: calc(10px + 5px); margin-top: 4px; display: flex; gap: 1rem;}

                /* --- Global Search --- */
                .search-container { padding: 0 1.5rem 1.5rem; }
                .search-input { width: 100%; }
                .search-results { position: absolute; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; width: 300px; max-height: 400px; overflow-y: auto; z-index: 1001; margin-top: 8px;}
                .search-result-item { padding: 10px 15px; border-bottom: 1px solid var(--border-color); cursor: pointer; }
                .search-result-item:hover { background: rgba(255,255,255,0.05); }
                .search-result-item p { margin: 0; font-weight: bold; }
                .search-result-item span { font-size: 0.8rem; color: var(--secondary-text); }

                /* --- Mobile & Tablet Responsive Styles --- */
                @media (max-width: 992px) {
                    .sidebar { position: fixed; top: 0; left: 0; height: 100%; z-index: 1000; transform: translateX(-100%); background: rgba(18,18,18,0.9); }
                    body.light .sidebar { background: rgba(244, 244, 245, 0.9); }
                    .sidebar.open { transform: translateX(0); }
                    .mobile-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--card-bg); }
                    .menu-button { background: none; border: none; color: var(--primary-text); cursor: pointer; padding: 0.5rem; }
                    .mobile-header-title { font-size: 1.5rem; font-weight: bold; }
                    .main-content { padding: 1.5rem 1rem; }
                    .page-header h1 { font-size: 2rem; }
                }
                @media (max-width: 768px) {
                    .chart-row { grid-template-columns: 1fr; }
                    .chart-label { grid-row: 1; } .chart-bar-bg { grid-row: 2; } .chart-value { grid-row: 1; text-align: right; }
                    .todo-tabs button { padding: 10px 15px; font-size: 0.9rem; }
                    .page-header p { font-size: 1rem; }
                    .todo-page-form { grid-template-columns: 1fr; } .add-task-btn { grid-column: 1; justify-self: end; } .priority-selector { justify-self: start; grid-row: 2; }
                }
            `}</style>

            <div className="app-container">
                <ReminderModal reminder={activeReminder} onDismiss={handleDismissReminder} />
                <div className="app-background" style={{ backgroundImage: `url(${bgImage})` }}></div>
                <div className="app-layout">
                    <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                        <h1 className="sidebar-header">Momentum</h1>
                        <nav>
                            <button className={`nav-button ${activePage === 'todo' ? 'active' : ''}`} onClick={() => handleNavClick('todo')}><TodoIcon /> To-Do List</button>
                            <button className={`nav-button ${activePage === 'notes' ? 'active' : ''}`} onClick={() => handleNavClick('notes')}><NoteIcon /> Notes</button>
                            <button className={`nav-button ${activePage === 'habits' ? 'active' : ''}`} onClick={() => handleNavClick('habits')}><HabitIcon /> Habit Tracker</button>
                            <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />
                            <button className={`nav-button alert ${activePage === 'alerts' ? 'active' : ''}`} onClick={() => handleNavClick('alerts')}><AlertIcon /> Red Alerts</button>
                            <button className={`nav-button ${activePage === 'career' ? 'active' : ''}`} onClick={() => handleNavClick('career')}><CareerIcon /> Career Plan</button>
                            <button className={`nav-button ${activePage === 'life' ? 'active' : ''}`} onClick={() => handleNavClick('life')}><LifeIcon /> Life Plan</button>
                            <button className={`nav-button ${activePage === 'media' ? 'active' : ''}`} onClick={() => handleNavClick('media')}><MediaIcon /> Book & Movie Lists</button>
                        </nav>
                        <div className="sidebar-footer">
                             <div className="settings-form">
                                <select value={theme} onChange={(e) => handleSetTheme(e.target.value)}>
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                    <option value="nord">Nord</option>
                                    <option value="solarized">Solarized</option>
                                </select>
                                <label htmlFor="bg-upload">Upload BG</label>
                                <input type="file" id="bg-upload" accept="image/*" onChange={handleBgUpload} />
                            </div>
                            <div className="user-profile">Signed in as:<br /><strong>{user.email}</strong></div>
                            <button className="logout-btn" onClick={() => signOut(auth)}>Log Out</button>
                        </div>
                    </aside>
                    <main className="main-content">
                        <header className="mobile-header">
                            <button className="menu-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><MenuIcon /></button>
                             <h1 className="mobile-header-title">Momentum</h1>
                        </header>
                        {renderActivePage()}
                    </main>
                </div>
            </div>
        </>
    );
}
