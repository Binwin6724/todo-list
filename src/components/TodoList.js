import React, { useState, useEffect } from 'react';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TodoList.css';

const TodoList = () => {
  const [listTitle, setListTitle] = useState(() => {
    const savedTitle = localStorage.getItem('listTitle');
    return savedTitle || 'My Todo List';
  });
  
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  const [newTodo, setNewTodo] = useState({
    name: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    reminder: '',
    tags: [],
    progress: 0,
    category: ''
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    priority: 'all',
    status: 'all',
    category: 'all'
  });
  const [sortOption, setSortOption] = useState('dueDate');
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('ongoing');

  const encouragingMessages = [
    "Ready to start your journey? Add your first task! ",
    "A fresh start awaits! What's your first goal? ",
    "The perfect time to begin is now! Add a task ",
    "Your productivity journey starts here! ",
    "Transform your ideas into tasks! Let's begin ",
    "Clean slate, endless possibilities! What's first? ",
    "Time to make things happen! Add your first task ",
    "Your success story starts with a single task! "
  ];

  const getRandomMessage = () => {
    return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  };

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('listTitle', listTitle);
  }, [listTitle]);

  // Request notification permissions
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          await Notification.requestPermission();
        }
      }
    };
    requestNotificationPermission();
  }, []);

  // Check for overdue tasks and send notifications
  useEffect(() => {
    const checkOverdueTasks = () => {
      if (Notification.permission === 'granted') {
        todos.forEach(todo => {
          if (!todo.completed && todo.dueDate && isBefore(new Date(todo.dueDate), new Date()) && !todo.notified) {
            new Notification('Task Overdue!', {
              body: `The task "${todo.name}" is overdue!`,
              icon: '/favicon.ico'
            });
            // Mark the task as notified
            setTodos(prevTodos =>
              prevTodos.map(t =>
                t.id === todo.id ? { ...t, notified: true } : t
              )
            );
          }
        });
      }
    };

    // Check immediately and then every minute
    checkOverdueTasks();
    const interval = setInterval(checkOverdueTasks, 60000);

    return () => clearInterval(interval);
  }, [todos]);

  const handleTitleChange = (e) => {
    setListTitle(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTodo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newTodo.tags.includes(tagInput.trim())) {
      setNewTodo(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setNewTodo(prev => ({
      ...prev,
      tags: prev.tags.filter((tag, i) => i !== index)
    }));
  };

  const handleProgressChange = (id, newProgress) => {
    // Only allow progress changes when editing
    if (editingTodoId === id) {
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id ? { ...todo, progress: parseInt(newProgress) } : todo
        )
      );
    }
  };

  const startEditing = (todo) => {
    setEditingTodoId(todo.id);
    setNewTodo(todo);
    setIsFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTodo.name.trim() === '') return;
    
    const todoData = {
      id: editingTodoId || Date.now(),
      name: newTodo.name,
      description: newTodo.description,
      dueDate: newTodo.dueDate,
      priority: newTodo.priority,
      reminder: newTodo.reminder,
      tags: newTodo.tags,
      progress: newTodo.progress,
      category: newTodo.category,
      completed: editingTodoId ? todos.find(t => t.id === editingTodoId)?.completed || false : false,
      createdAt: editingTodoId ? todos.find(t => t.id === editingTodoId)?.createdAt : new Date().toISOString(),
      notified: false
    };
    
    if (editingTodoId) {
      setTodos(todos.map(todo => todo.id === editingTodoId ? todoData : todo));
    } else {
      setTodos(prev => [...prev, todoData]);
    }

    setNewTodo({
      name: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      reminder: '',
      tags: [],
      progress: 0,
      category: ''
    });
    setEditingTodoId(null);
    setIsFormOpen(false);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingTodoId(null);
    setNewTodo({
      name: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      reminder: '',
      tags: [],
      progress: 0,
      category: ''
    });
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#dc3545'
    };
    return colors[priority] || colors.medium;
  };

  const getCategories = () => {
    const defaultCategories = ['Work', 'Personal', 'Shopping', 'Health', 'Education'];
    const userCategories = todos
      .map(todo => todo.category)
      .filter(Boolean)
      .filter(category => !defaultCategories.includes(category));
    
    return [...new Set([...defaultCategories, ...userCategories])];
  };

  const getStatistics = () => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const overdue = todos.filter(todo => 
      todo.dueDate && !todo.completed && isBefore(new Date(todo.dueDate), new Date())
    ).length;
    const dueToday = todos.filter(todo => 
      todo.dueDate && !todo.completed && isToday(new Date(todo.dueDate))
    ).length;

    return { total, completed, overdue, dueToday };
  };

  const filterTodos = () => {
    return todos
      .filter(todo => {
        // First filter by tab (completed/ongoing)
        if (activeTab === 'completed' && !todo.completed) return false;
        if (activeTab === 'ongoing' && todo.completed) return false;

        const matchesSearch = searchTerm ? (
          todo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          todo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          todo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        ) : true;
        
        const matchesPriority = filterOptions.priority === 'all' || todo.priority === filterOptions.priority;
        const matchesCategory = filterOptions.category === 'all' || 
          todo.category === filterOptions.category;

        return matchesSearch && matchesPriority && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'dueDate':
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return isAfter(new Date(a.dueDate), new Date(b.dueDate)) ? 1 : -1;
          case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          case 'name':
            return a.name.localeCompare(b.name);
          case 'progress':
            return b.progress - a.progress;
          default:
            return 0;
        }
      });
  };

  const getProgressClass = (progress) => {
    if (progress < 25) return "low";
    if (progress < 50) return "medium-low";
    if (progress < 75) return "medium-high";
    return "high";
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link'
  ];

  const stats = getStatistics();

  return (
    <div className="todo-container">
      <input
        type="text"
        value={listTitle}
        onChange={handleTitleChange}
        className="list-title-input"
      />
      
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Overdue</span>
          <span className="stat-value overdue">{stats.overdue}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Due Today</span>
          <span className="stat-value due-today">{stats.dueToday}</span>
        </div>
      </div>

      <div className="controls-container">
        <div className="search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
            className="search-input"
          />
        </div>

        <div className="filters-container">
          <select
            value={filterOptions.priority}
            onChange={(e) => setFilterOptions(prev => ({ ...prev, priority: e.target.value }))}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={filterOptions.category}
            onChange={(e) => setFilterOptions(prev => ({ ...prev, category: e.target.value }))}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {getCategories().map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="filter-select"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="name">Sort by Name</option>
            <option value="progress">Sort by Progress</option>
          </select>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'ongoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('ongoing')}
        >
          Ongoing Tasks
        </button>
        <button 
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Tasks
        </button>
      </div>

      <button 
        onClick={() => setIsFormOpen(true)} 
        className="add-button"
        style={{ marginBottom: '1rem' }}
      >
        Add New Task
      </button>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="todo-form">
          <div className="form-group">
            <label>Task Name</label>
            <input
              type="text"
              name="name"
              value={newTodo.name}
              onChange={handleInputChange}
              className="todo-input"
              placeholder="Enter task name"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <ReactQuill
              value={newTodo.description}
              onChange={(content) => setNewTodo(prev => ({ ...prev, description: content }))}
              modules={modules}
              formats={formats}
              placeholder="Enter task description..."
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={newTodo.category}
              onChange={handleInputChange}
              className="todo-select"
              required
            >
              <option value="">Select Category</option>
              {getCategories().map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group col-md-4">
              <label>Due Date</label>
              <input
                type="datetime-local"
                name="dueDate"
                value={newTodo.dueDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group col-md-4">
              <label>Priority</label>
              <select
                name="priority"
                value={newTodo.priority}
                onChange={handleInputChange}
                className="todo-select"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group col-md-4">
              <label>Reminder</label>
              <input
                type="datetime-local"
                name="reminder"
                value={newTodo.reminder}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Progress</label>
            <div className="progress-container">
              <input
                type="range"
                className="progress-range"
                min="0"
                max="100"
                step="10"
                value={newTodo.progress}
                onChange={(e) => setNewTodo({ ...newTodo, progress: parseInt(e.target.value) })}
              />
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${getProgressClass(newTodo.progress)}`}
                  style={{ '--progress-width': `${newTodo.progress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                <span className="progress-label">Completion</span>
                <span className={`progress-value ${getProgressClass(newTodo.progress)}`}>
                  {newTodo.progress}%
                </span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className="todo-input tags-input"
                placeholder="Add tags and press Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="tag-add-button"
              >
                Add Tag
              </button>
            </div>
            <div className="tags-container">
              {newTodo.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-buttons">
            <button type="button" onClick={handleCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button">
              {editingTodoId ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      <div className="todo-list">
        {filterTodos().length > 0 ? (
          filterTodos().map(todo => (
            <li key={todo.id} className="todo-item">
              <div className="todo-item-header">
                <div className="todo-item-main">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                  />
                  <span className={todo.completed ? 'completed' : ''}>
                    {todo.name}
                  </span>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(todo.priority) }}
                  >
                    {todo.priority}
                  </span>
                </div>
                <div className="todo-item-actions">
                  <button 
                    onClick={() => startEditing(todo)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteTodo(todo.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {todo.description && (
                <div 
                  className="todo-description"
                  dangerouslySetInnerHTML={{ __html: todo.description }}
                />
              )}

              {todo.category && (
                <div className="todo-category">
                  Category: {todo.category}
                </div>
              )}

              <div className="todo-progress">
                <div className="progress-container">
                  <input
                    type="range"
                    className="progress-range"
                    min="0"
                    max="100"
                    value={todo.progress}
                    onChange={(e) => handleProgressChange(todo.id, e.target.value)}
                    disabled={editingTodoId !== todo.id}
                    style={{ cursor: editingTodoId === todo.id ? 'pointer' : 'not-allowed' }}
                  />
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getProgressClass(todo.progress)}`}
                      style={{ '--progress-width': `${todo.progress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    <span className="progress-label">Progress</span>
                    <span className={`progress-value ${getProgressClass(todo.progress)}`}>
                      {todo.progress}%
                    </span>
                  </div>
                </div>
              </div>

              {todo.tags.length > 0 && (
                <div className="tags-container">
                  {todo.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
              
              <div className="todo-item-footer">
                {todo.dueDate && (
                  <span className="todo-date">
                    Due: {format(new Date(todo.dueDate), 'MMM d, yyyy HH:mm')}
                  </span>
                )}
                {todo.reminder && (
                  <span className="todo-reminder">
                    Reminder: {format(new Date(todo.reminder), 'MMM d, yyyy HH:mm')}
                  </span>
                )}
              </div>
            </li>
          ))
        ) : (
          <div className="empty-state">
            <span className="butterfly">🦋</span>
            <p className="empty-message">
              {activeTab === 'ongoing' 
                ? getRandomMessage()
                : "No completed tasks yet. Keep going! "}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
