import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

// Configure axios defaults
axios.defaults.baseURL = 'https://firesafe-pro.onrender.com';
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Layout Component
const Layout = ({ children, user, onLogout }) => (
  <div className="min-h-screen bg-gray-100 flex flex-col">
    <nav className="bg-red-600 text-white p-4 flex justify-between items-center">
      <div className="text-2xl font-bold">FireSafe Pro</div>
      {user && (
        <div className="flex items-center space-x-4">
          <span>Welcome, {user.name}</span>
          <button
            onClick={onLogout}
            className="bg-white text-red-600 px-3 py-1 rounded hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
    <div className="flex flex-1">
      {children}
    </div>
    <Toaster position="top-right" />
  </div>
);

// Authentication Component
const Authentication = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Trainee'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = `/api/${isRegister ? 'register' : 'login'}`;
      const response = await axios.post(endpoint, formData);

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }

      toast.success(response.data.message);
      onLogin(response.data.user);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center flex-1 p-8">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl mb-6 text-center font-bold text-red-600">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <input
                type="tel"
                placeholder="Mobile Number"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Trainee">Trainee</option>
                <option value="Admin">Admin</option>
              </select>
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <button
            type="submit"
            className={`w-full bg-red-600 text-white p-2 rounded hover:bg-red-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>
        <div className="text-center mt-4">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-red-600 hover:underline transition"
          >
            {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ChatBot Component
const ChatBot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = { text: inputMessage, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    try {
      const response = await axios.post('/api/chat', { message: inputMessage });
      const botMessage = { text: response.data.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error('Failed to get response from chatbot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-300 flex flex-col">
      <div className="bg-red-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <h3 className="font-bold">Fire Safety Assistant</h3>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          ×
        </button>
      </div>
      <div className="p-3 h-64 overflow-y-auto flex-1">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 p-2 rounded ${msg.sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100 mr-auto'}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="text-center">Assistant is typing...</div>}
      </div>
      <div className="p-3 border-t border-gray-300 flex">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your question..."
          className="flex-1 p-2 border rounded-l focus:outline-none"
        />
        <button
          onClick={handleSendMessage}
          className="bg-red-600 text-white p-2 rounded-r hover:bg-red-700"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Timer Component
const Timer = ({ initialTime, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-red-100 p-2 rounded mb-4">
      <p className="text-red-800 font-semibold">
        Time Remaining: {formatTime(timeLeft)}
      </p>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newModule, setNewModule] = useState({
    title: '',
    videos: [],
    reading_document: '',
    mcq_assignment: '',
    reading_time: 5, // minutes
    videos_time: 5, // minutes
    assignment_time: 10 // minutes
  });
  const [activeTab, setActiveTab] = useState('create');
  const [trainees, setTrainees] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const modulesResponse = await axios.get('/api/modules');
        const traineesResponse = await axios.get('/api/trainees');
        const leaderboardResponse = await axios.get('/api/leaderboard');
        
        setModules(modulesResponse.data.modules);
        setTrainees(traineesResponse.data.trainees);
        setLeaderboard(leaderboardResponse.data.leaderboard);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateContent = async () => {
    if (!newModule.title) {
      return toast.error('Please enter a module title');
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/generate-module-content', {
        moduleTitle: newModule.title
      });
      
      setNewModule(prev => ({
        ...prev,
        reading_document: response.data.reading_document,
        mcq_assignment: response.data.mcq_assignment
      }));

      toast.success('Content generated successfully');
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideoLink = () => {
    setNewModule(prev => ({
      ...prev,
      videos: [...prev.videos, '']
    }));
  };

  const handleVideoLinkChange = (index, value) => {
    const updatedVideos = [...newModule.videos];
    updatedVideos[index] = value;
    setNewModule(prev => ({
      ...prev,
      videos: updatedVideos
    }));
  };

  const handleCreateModule = async () => {
    if (!newModule.title || !newModule.reading_document || !newModule.mcq_assignment) {
      return toast.error('Please complete all module details');
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/modules', newModule);
      toast.success('Module created successfully');
      setNewModule({
        title: '',
        videos: [],
        reading_document: '',
        mcq_assignment: '',
        reading_time: 5,
        videos_time: 5,
        assignment_time: 10
      });
      // Refresh modules list
      const modulesResponse = await axios.get('/api/modules');
      setModules(modulesResponse.data.modules);
    } catch (error) {
      toast.error('Failed to create module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      <h1 className="text-3xl mb-6 font-bold">Admin Dashboard</h1>
      
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 ${activeTab === 'create' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'}`}
        >
          Create Module
        </button>
        <button
          onClick={() => setActiveTab('trainees')}
          className={`px-4 py-2 ${activeTab === 'trainees' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'}`}
        >
          Trainees Progress
        </button>
        {/* <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 ${activeTab === 'leaderboard' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'}`}
        >
          Leaderboard
        </button> */}
      </div>

      {activeTab === 'create' && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl mb-4 font-semibold">Create New Module</h2>
          <input
            type="text"
            placeholder="Module Title"
            value={newModule.title}
            onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
            className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block mb-1">Reading Time (min)</label>
              <input
                type="number"
                value={newModule.reading_time}
                onChange={(e) => setNewModule({ ...newModule, reading_time: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                min="1"
              />
            </div>
            <div>
              <label className="block mb-1">Videos Time (min)</label>
              <input
                type="number"
                value={newModule.videos_time}
                onChange={(e) => setNewModule({ ...newModule, videos_time: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                min="1"
              />
            </div>
            <div>
              <label className="block mb-1">Assignment Time (min)</label>
              <input
                type="number"
                value={newModule.assignment_time}
                onChange={(e) => setNewModule({ ...newModule, assignment_time: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Video Links</h3>
            {newModule.videos.map((video, index) => (
              <input
                key={index}
                type="text"
                placeholder="YouTube Video Link"
                value={video}
                onChange={(e) => handleVideoLinkChange(index, e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            ))}
            <button
              onClick={handleAddVideoLink}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
            >
              Add Video Link
            </button>
          </div>

          <div className="flex space-x-4 mt-4">
            <button
              onClick={generateContent}
              disabled={loading || !newModule.title}
              className={`bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Generating...' : 'Generate Content'}
            </button>
            <button
              onClick={handleCreateModule}
              disabled={loading || !newModule.reading_document || !newModule.mcq_assignment}
              className={`bg-green-500 text-white p-2 rounded hover:bg-green-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Module'}
            </button>
          </div>
          <div>
          <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md max mx-auto">
      <h2 className="text-lg font-semibold mb-2">Quiz Format</h2>
      <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
        {`{
  "quiz": [
    {
      "question": "Example question?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answer": "Option 1"
    }
  ]
}`}
      </pre>
      <p className="text-xs text-gray-400 mt-2">
        Ensure AI-generated content strictly follows this format without extra content.
      </p>
    </div>
          </div>

          {newModule.reading_document && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Generated Reading Document</h3>
              <textarea
                value={newModule.reading_document}
                onChange={(e) => setNewModule(prev => ({ ...prev, reading_document: e.target.value }))}
                className="w-full p-2 border rounded h-48 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {newModule.mcq_assignment && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Generated MCQ Assignment</h3>
              <textarea
                value={newModule.mcq_assignment}
                onChange={(e) => setNewModule(prev => ({ ...prev, mcq_assignment: e.target.value }))}
                className="w-full p-2 border rounded h-48 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'trainees' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl mb-4 font-semibold">Trainees Progress</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Trainee</th>
                    <th className="py-2 px-4 border-b">Module</th>
                    <th className="py-2 px-4 border-b">Attempts</th>
                    <th className="py-2 px-4 border-b">Best Score</th>
                    <th className="py-2 px-4 border-b">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {trainees.map((trainee) => (
                    trainee.modules.map((module, idx) => (
                      <tr key={`${trainee._id}-${module.module_id}`} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4 border-b">{trainee.name}</td>
                        <td className="py-2 px-4 border-b">{module.module_title}</td>
                        <td className="py-2 px-4 border-b">{module.attempts.length}</td>
                        <td className="py-2 px-4 border-b">
                          {module.attempts.length > 0 ? 
                            `${Math.max(...module.attempts.map(a => a.score))}%` : 
                            'N/A'}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {module.completed ? '✅' : '❌'}
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl mb-4 font-semibold">Leaderboard</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry._id}
                  className="flex justify-between p-3 rounded items-center"
                  style={{
                    backgroundColor: index % 2 === 0 ? '#f0f0f0' : 'transparent',
                  }}
                >
                  <div className="flex items-center">
                    <span className="font-bold w-8">{index + 1}.</span>
                    <span>{entry.name}</span>
                  </div>
                  <div className="flex space-x-4">
                    <span>Score: {entry.score}%</span>
                    <span>Modules: {entry.modules_completed}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Module View Component
const ModuleView = () => {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('reading');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState(null);
  const [showChatBot, setShowChatBot] = useState(false);
  const [sectionCompleted, setSectionCompleted] = useState({
    reading: false,
    videos: false,
    assignment: false
  });
  const [sectionTimes, setSectionTimes] = useState({
    reading: 0,
    videos: 0,
    assignment: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const moduleId = localStorage.getItem('current_module_id');
        const response = await axios.get(`/api/modules/${moduleId}`);
        setModule(response.data.module);

        // Set section times (convert minutes to seconds)
        setSectionTimes({
          reading: response.data.module.reading_time * 60,
          videos: response.data.module.videos_time * 60,
          assignment: response.data.module.assignment_time * 60
        });

        // Parse the MCQ assignment from JSON
        if (response.data.module.mcq_assignment) {
          try {
            const parsedMcq = JSON.parse(response.data.module.mcq_assignment);
            setQuestions(parsedMcq.quiz || []);
          } catch (error) {
            console.error("Failed to parse mcq_assignment:", error);
            setQuestions([]);
            toast.error('Failed to parse MCQ assignment');
          }
        }

        // Check if user has already completed any sections
        const progressResponse = await axios.get(`/api/modules/${moduleId}/progress`);
        setSectionCompleted(progressResponse.data.progress);

        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch module');
        setLoading(false);
      }
    };

    fetchModule();
  }, []);

  const handleAnswerChange = (questionIndex, selectedOption) => {
    setAnswers({
      ...answers,
      [questionIndex]: selectedOption,
    });
  };

  const getNextSection = (currentSection) => {
    if (currentSection === 'reading') return 'videos';
    if (currentSection === 'videos') return 'assignment';
    return null;
  };

  const handleSectionComplete = async (section) => {
    try {
      const moduleId = localStorage.getItem('current_module_id');
      await axios.post(`/api/modules/${moduleId}/complete-section`, { section });
      setSectionCompleted(prev => ({ ...prev, [section]: true }));
      toast.success(`Section ${section} completed!`);

      // Automatically set the next section as active
      const nextSection = getNextSection(section);
      if (nextSection && !sectionCompleted[nextSection]) {
        setActiveSection(nextSection);
      }
    } catch (error) {
      toast.error('Failed to mark section as completed');
    }
  };

  const onReadingTimerComplete = () => {
    handleSectionComplete('reading');
    if (!sectionCompleted.videos) {
      setActiveSection('videos');
    }
  };

  const onVideosTimerComplete = () => {
    handleSectionComplete('videos');
    if (!sectionCompleted.assignment) {
      setActiveSection('assignment');
    }
  };

  const handleAssignmentSubmit = async () => {
    try {
      setLoading(true);
      const moduleId = localStorage.getItem('current_module_id');

      // Calculate score
      let correctAnswers = 0;
      questions.forEach((question, index) => {
        if (answers[index] === question.answer) {
          correctAnswers++;
        }
      });

      const score = (correctAnswers / questions.length) * 100;
      const passed = score >= 70;

      // Submit to backend
      const response = await axios.post(`/api/modules/${moduleId}/submit-assignment`, {
        answers: Object.values(answers)
      });

      setReport({
        score: score,
        passed: passed,
        message: passed ? 'Congratulations! You passed the assignment.' : 'Sorry, you failed the assignment. Please try again.',
      });

      setSubmitted(true);
      toast.success(passed ? 'Congratulations! You passed the assignment.' : 'Sorry, you failed the assignment.');
    } catch (error) {
      toast.error('Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!module) return <div>No module found</div>;

  return (
    <div className="flex-1 p-8">
      <button 
        onClick={() => navigate(-1)}
        className="mb-4 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
      >
        Back to Dashboard
      </button>
      
      <h1 className="text-3xl mb-6 font-bold">{module.title}</h1>
      <div className="flex">
        <div className="w-1/4 pr-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Module Sections</h2>
            <button
              onClick={() => setActiveSection('reading')}
              className={`w-full text-left p-2 rounded mb-2 ${activeSection === 'reading' ? 'bg-red-600 text-white' : 'hover:bg-gray-100'} ${!sectionCompleted.reading ? 'font-bold' : ''}`}
              disabled={sectionCompleted.reading}
            >
              Reading Document {sectionCompleted.reading && '✓'}
            </button>
            <button
              onClick={() => setActiveSection('videos')}
              className={`w-full text-left p-2 rounded mb-2 ${activeSection === 'videos' ? 'bg-red-600 text-white' : 'hover:bg-gray-100'} ${!sectionCompleted.videos && !sectionCompleted.reading ? 'opacity-50 cursor-not-allowed' : ''} ${!sectionCompleted.videos && sectionCompleted.reading ? 'font-bold' : ''}`}
              disabled={!sectionCompleted.reading || sectionCompleted.videos}
            >
              Training Videos {sectionCompleted.videos && '✓'}
            </button>
            <button
              onClick={() => setActiveSection('assignment')}
              className={`w-full text-left p-2 rounded mb-2 ${activeSection === 'assignment' ? 'bg-red-600 text-white' : 'hover:bg-gray-100'} ${!sectionCompleted.assignment && (!sectionCompleted.videos || !sectionCompleted.reading) ? 'opacity-50 cursor-not-allowed' : ''} ${!sectionCompleted.assignment && sectionCompleted.videos ? 'font-bold' : ''}`}
              disabled={!sectionCompleted.videos || sectionCompleted.assignment}
            >
              Assignment {sectionCompleted.assignment && '✓'}
            </button>
            <button
              onClick={() => setShowChatBot(true)}
              className="w-full text-left p-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Ask Assistant
            </button>
          </div>
        </div>
        <div className="w-3/4">
          {activeSection === 'reading' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Reading Document</h2>
              {!sectionCompleted.reading && (
                <Timer 
                  initialTime={sectionTimes.reading} 
                  onComplete={onReadingTimerComplete}
                />
              )}
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: module.reading_document.replace('/\n/g', '<br>') }} />
            </div>
          )}

          {activeSection === 'videos' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Training Videos</h2>
              {!sectionCompleted.videos && (
                <Timer 
                  initialTime={sectionTimes.videos} 
                  onComplete={onVideosTimerComplete}
                />
              )}
              {module.videos.map((videoLink, index) => (
                <div key={index} className="mb-4">
                  <iframe
                    width="100%"
                    height="400"
                    src={videoLink.replace('watch?v=', 'embed/')}
                    title={`Video ${index + 1}`}
                    allowFullScreen
                    className="rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'assignment' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Module Assignment</h2>
              {!sectionCompleted.assignment && !submitted && (
                <Timer 
                  initialTime={sectionTimes.assignment} 
                  onComplete={() => {}} 
                />
              )}
              {!submitted ? (
                <>
                  {questions.map((question, index) => (
                    <div key={index} className="mb-4">
                      <p className="font-semibold">{`${index + 1}. ${question.question}`}</p>
                      {question.options.map((option, optIndex) => (
                        <label key={optIndex} className="block">
                          <input
                            type="radio"
                            name={`q${index}`}
                            value={option}
                            checked={answers[index] === option}
                            onChange={() => handleAnswerChange(index, option)}
                            className="mr-2"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  ))}
                  <button
                    onClick={handleAssignmentSubmit}
                    className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
                    disabled={loading || Object.keys(answers).length < questions.length}
                  >
                    {loading ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </>
              ) : (
                report && (
                  <div className={`p-4 rounded ${report.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <p className="font-bold">Score: {report.score.toFixed(2)}%</p>
                    <p>Status: {report.passed ? 'Passed' : 'Failed'}</p>
                    <p>{report.message}</p>
                    {!report.passed && (
                      <button
                        onClick={() => {
                          setSubmitted(false);
                          setAnswers({});
                        }}
                        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
      {showChatBot && <ChatBot onClose={() => setShowChatBot(false)} />}
    </div>
  );
};

// Trainee Dashboard
const TraineeDashboard = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const modulesResponse = await axios.get('/api/modules');
        setModules(modulesResponse.data.modules);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch modules');
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  const handleStartModule = (moduleId) => {
    localStorage.setItem('current_module_id', moduleId);
    navigate('/module');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex-1 p-8">
      <h1 className="text-3xl mb-6 font-bold">My Modules</h1>
      {modules.map((module) => (
        <div key={module.id} className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold">{module.title}</h2>
          <div className="flex justify-between mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${module.progress}%` }}
              ></div>
            </div>
            <span className="ml-2">{module.progress.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between mt-2">
            <span>{module.completed ? 'Completed' : 'In Progress'}</span>
            <button
              onClick={() => handleStartModule(module.id)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
            >
              {module.completed ? 'Review Module' : module.progress > 0 ? 'Continue' : 'Start Module'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for token in local storage on app load
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      axios.get('/api/verify-token')
        .then(response => {
          if (response.data.user) {
            setUser(response.data.user);
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
        })
        .catch(error => {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          setUser(null);
        });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (user) {
    // If user is an admin, render the AdminDashboard
    if (user.role === 'Admin') {
      return (
        <Router>
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </Router>
      );
    }
    // If user is a trainee, render the TraineeDashboard
    return (
      <Router>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<TraineeDashboard />} />
            <Route path="/module" element={<ModuleView />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    );
  }

  // If no user is logged in, render the Authentication component
  return (
    <Layout user={null} onLogout={null}>
      <Authentication onLogin={handleLogin} />
    </Layout>
  );
};

export default App;