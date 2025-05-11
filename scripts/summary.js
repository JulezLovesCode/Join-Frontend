


const BOARD_CATEGORIES = {
  TODO: "to-do",
  IN_PROGRESS: "in-progress",
  AWAIT_FEEDBACK: "await-feedback",
  DONE: "done"
};


let tasks = [];


const REFRESH_INTERVAL = 500; 


const DEBUG_MODE = true;


async function initializeDashboard() {
  if (DEBUG_MODE) {
    console.log("%cSummary: Initializing dashboard...", "color: blue; font-weight: bold; font-size: 14px");
  }
  
  
  setupUserInfo();
  
  
  const countElements = ['toDoCount', 'inProgressCount', 'awaitFeedbackCount', 'doneCount', 'urgentCount', 'allTasks'];
  countElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = '0';
  });
  
  
  let loadSuccess = false;
  const maxRetries = 3;
  
  for (let i = 0; i < maxRetries && !loadSuccess; i++) {
    try {
      if (i > 0) console.log(`Retry ${i} loading tasks...`);
      await loadTasks();
      loadSuccess = true;
    } catch (error) {
      console.error(`Error loading tasks (attempt ${i+1}/${maxRetries}):`, error);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  
  updateAllCounts();
  updateDeadlineInfo();
  
  
  setInterval(refreshDashboard, REFRESH_INTERVAL);
  
  
  window.addEventListener('storage', function(e) {
    if (e.key === 'mockTasks') {
      console.log("%cStorage event: mockTasks changed in another tab!", "color: red; font-weight: bold");
      loadTasks().then(() => {
        updateAllCounts();
        updateDeadlineInfo();
      });
    }
  });
  
  
  if (DEBUG_MODE) {
    console.log("%cSummary: Dashboard initialization complete", "color: green; font-weight: bold");
  }
}


async function refreshDashboard() {
  
  await loadTasks();
  updateAllCounts();
  updateDeadlineInfo();
}


async function loadTasks() {
  if (DEBUG_MODE) {
    console.log("%cSummary: Loading tasks...", "color: purple; font-weight: bold");
  }
  
  
  try {
    const storedTasks = localStorage.getItem('mockTasks');
    if (storedTasks) {
      if (DEBUG_MODE) console.log("Found mockTasks in localStorage");
      
      try {
        const parsedTasks = JSON.parse(storedTasks);
        
        if (Array.isArray(parsedTasks)) {
          if (DEBUG_MODE) {
            console.log("%cSummary: Using tasks from localStorage", "color: green", parsedTasks.length, "items");
            
            
            const todoCount = parsedTasks.filter(t => t.board_category === BOARD_CATEGORIES.TODO).length;
            const inProgressCount = parsedTasks.filter(t => t.board_category === BOARD_CATEGORIES.IN_PROGRESS).length;
            const awaitFeedbackCount = parsedTasks.filter(t => t.board_category === BOARD_CATEGORIES.AWAIT_FEEDBACK).length;
            const doneCount = parsedTasks.filter(t => t.board_category === BOARD_CATEGORIES.DONE).length;
            
            console.log("%cTasks by category in localStorage:", "color: blue", {
              [BOARD_CATEGORIES.TODO]: todoCount,
              [BOARD_CATEGORIES.IN_PROGRESS]: inProgressCount,
              [BOARD_CATEGORIES.AWAIT_FEEDBACK]: awaitFeedbackCount,
              [BOARD_CATEGORIES.DONE]: doneCount,
              total: parsedTasks.length
            });
            
            
            if (parsedTasks.length > 0) {
              console.log("First task:", parsedTasks[0]);
            }
          }
          
          
          tasks = parsedTasks;
          return;
        } else {
          console.warn("mockTasks is not an array:", parsedTasks);
        }
      } catch (parseError) {
        console.error("Error parsing mockTasks JSON:", parseError);
      }
    } else {
      if (DEBUG_MODE) console.log("No mockTasks found in localStorage");
    }
  } catch (error) {
    console.error("Error accessing localStorage:", error);
  }
  
  
  if (DEBUG_MODE) console.log("Falling back to API...");
  
  try {
    const response = await apiGet('api/tasks/');
    if (response && Array.isArray(response)) {
      if (DEBUG_MODE) console.log("%cSummary: Using tasks from API", "color: green", response.length, "items");
      tasks = response;
      
      
      try {
        localStorage.setItem('mockTasks', JSON.stringify(response));
        if (DEBUG_MODE) console.log("Saved API tasks to localStorage");
      } catch (saveError) {
        console.error("Error saving to localStorage:", saveError);
      }
    } else {
      console.warn("Invalid API response format");
      
      tasks = [];
    }
  } catch (error) {
    console.error("API request failed:", error);
    
    tasks = [];
  }
}


function updateAllCounts() {
  
  const todoCount = getTaskCountByCategory(BOARD_CATEGORIES.TODO);
  const inProgressCount = getTaskCountByCategory(BOARD_CATEGORIES.IN_PROGRESS);
  const awaitFeedbackCount = getTaskCountByCategory(BOARD_CATEGORIES.AWAIT_FEEDBACK);
  const doneCount = getTaskCountByCategory(BOARD_CATEGORIES.DONE);
  const urgentCount = getTaskCountByPriority("urgent");
  const totalCount = tasks.length;
  
  
  if (DEBUG_MODE) {
    console.log("%cSummary: Updating counts", "color: green; font-weight: bold");
    console.log("%cCurrent counts:", "color: blue", {
      [BOARD_CATEGORIES.TODO]: todoCount,
      [BOARD_CATEGORIES.IN_PROGRESS]: inProgressCount,
      [BOARD_CATEGORIES.AWAIT_FEEDBACK]: awaitFeedbackCount,
      [BOARD_CATEGORIES.DONE]: doneCount,
      urgent: urgentCount,
      total: totalCount
    });
  }
  
  
  
  const todoElement = document.getElementById('toDoCount');
  const inProgressElement = document.getElementById('inProgressCount');
  const awaitFeedbackElement = document.getElementById('awaitFeedbackCount');
  const doneElement = document.getElementById('doneCount');
  const urgentElement = document.getElementById('urgentCount');
  const totalElement = document.getElementById('allTasks');
  
  if (todoElement) {
    todoElement.textContent = todoCount;
    if (DEBUG_MODE) console.log(`Updated todoCount to ${todoCount}`);
  } else if (DEBUG_MODE) {
    console.error("Could not find toDoCount element");
  }
  
  if (inProgressElement) {
    inProgressElement.textContent = inProgressCount;
    if (DEBUG_MODE) console.log(`Updated inProgressCount to ${inProgressCount}`);
  } else if (DEBUG_MODE) {
    console.error("Could not find inProgressCount element");
  }
  
  if (awaitFeedbackElement) {
    awaitFeedbackElement.textContent = awaitFeedbackCount;
    if (DEBUG_MODE) console.log(`Updated awaitFeedbackCount to ${awaitFeedbackCount}`);
  } else if (DEBUG_MODE) {
    console.error("Could not find awaitFeedbackCount element");
  }
  
  if (doneElement) {
    doneElement.textContent = doneCount;
    if (DEBUG_MODE) console.log(`Updated doneCount to ${doneCount}`);
  } else if (DEBUG_MODE) {
    console.error("Could not find doneCount element");
  }
  
  if (urgentElement) {
    urgentElement.textContent = urgentCount;
    if (DEBUG_MODE) console.log(`Updated urgentCount to ${urgentCount}`);
  } else if (DEBUG_MODE) {
    console.error("Could not find urgentCount element");
  }
  
  if (totalElement) {
    totalElement.textContent = totalCount;
    if (DEBUG_MODE) console.log(`Updated allTasks to ${totalCount}`);
  } else if (DEBUG_MODE) {
    console.error("Could not find allTasks element");
  }
}


function updateCountElement(elementId, count) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = count;
  }
}


function getTaskCountByCategory(category) {
  if (!tasks || !Array.isArray(tasks)) {
    if (DEBUG_MODE) console.warn("getTaskCountByCategory: tasks is not an array", tasks);
    return 0;
  }
  
  if (!category) {
    if (DEBUG_MODE) console.warn("getTaskCountByCategory: category is undefined");
    return 0;
  }
  
  const categoryLower = category.toLowerCase();
  
  
  const count = tasks.filter(task => {
    if (!task) return false;
    
    
    
    const boardCategory = task.board_category || task.boardCategory || task.category || "";
    const taskCategory = typeof boardCategory === 'string' ? boardCategory.toLowerCase() : "";
    
    
    if (categoryLower === 'to-do' || categoryLower === 'todo') {
      return taskCategory === 'to-do' || taskCategory === 'todo';
    }
    
    if (categoryLower === 'in-progress' || categoryLower === 'in_progress' || categoryLower === 'inprogress') {
      return taskCategory === 'in-progress' || taskCategory === 'in_progress' || taskCategory === 'inprogress';
    }
    
    if (categoryLower === 'await-feedback' || categoryLower === 'await_feedback' || categoryLower === 'awaitfeedback') {
      return taskCategory === 'await-feedback' || taskCategory === 'await_feedback' || taskCategory === 'awaitfeedback';
    }
    
    
    return taskCategory === categoryLower;
  }).length;
  
  if (DEBUG_MODE) console.log(`%cCategory count for ${category}: ${count}`, "color: purple");
  
  
  if (category === BOARD_CATEGORIES.TODO && count === 0) {
    
    const possibleTodoTasks = tasks.filter(task => {
      if (!task) return false;
      
      
      const cat = String(task.board_category || task.boardCategory || task.category || "").toLowerCase();
      return cat.includes("todo") || cat.includes("to-do") || cat.includes("to_do");
    }).length;
    
    if (possibleTodoTasks > 0) {
      console.warn(`Found ${possibleTodoTasks} possible todo tasks with non-standard formatting`);
    }
  }
  
  return count;
}


function getTaskCountByPriority(priority) {
  if (!tasks || !Array.isArray(tasks)) {
    if (DEBUG_MODE) console.warn("getTaskCountByPriority: tasks is not an array", tasks);
    return 0;
  }
  
  if (!priority) {
    if (DEBUG_MODE) console.warn("getTaskCountByPriority: priority is undefined");
    return 0;
  }
  
  const priorityLower = priority.toLowerCase();
  
  return tasks.filter(task => {
    if (!task) return false;
    
    
    const taskPriority = task.priority || task.urgency || task.importance || "";
    const priorityValue = typeof taskPriority === 'string' ? taskPriority.toLowerCase() : "";
    
    return priorityValue === priorityLower;
  }).length;
}


function setupUserInfo() {
  const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || 'Guest';
  
  
  const hour = new Date().getHours();
  let greeting = 'Good ';
  
  if (hour >= 5 && hour < 12) {
    greeting += 'morning';
  } else if (hour >= 12 && hour < 18) {
    greeting += 'afternoon';
  } else if (hour >= 18 && hour < 22) {
    greeting += 'evening';
  } else {
    greeting += 'night';
  }
  
  
  const greetingContainer = document.getElementById('greeting-container');
  if (greetingContainer) {
    greetingContainer.innerHTML = `
      <span class="greet-text">${greeting},</span>
      <span class="greet-user-name">${userName}</span>
    `;
  }
  
  
  setupUserAvatar(userName);
}


function setupUserAvatar(userName) {
  const avatarElement = document.getElementById('profileAvatar');
  if (!avatarElement) return;
  
  
  let initials = 'G'; 
  if (userName && userName !== 'Guest') {
    const nameParts = userName.split(/[\s_.@]+/).filter(part => part.length > 0);
    if (nameParts.length > 1) {
      initials = nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0);
    } else if (nameParts.length === 1) {
      initials = nameParts[0].charAt(0);
    }
    initials = initials.toUpperCase();
  }
  
  
  avatarElement.textContent = initials;
  
  
  const colorIndex = userName.charCodeAt(0) % avatarColors.length;
  avatarElement.style.backgroundColor = avatarColors[colorIndex];
  
  
  avatarElement.addEventListener('click', function() {
    const profilePanel = document.getElementById('profilePanel');
    if (profilePanel) {
      profilePanel.classList.toggle('show');
    }
  });
}


const avatarColors = [
  '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
  '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701'
];


function updateDeadlineInfo() {
  const upcomingDateElement = document.getElementById('upcomingDate');
  if (!upcomingDateElement) return;
  
  
  const urgentTasks = tasks.filter(task => 
    task.priority && task.priority.toLowerCase() === 'urgent' && task.due_date
  );
  
  if (urgentTasks.length === 0) {
    upcomingDateElement.textContent = '';
    return;
  }
  
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let closestTask = null;
  let closestDiff = Infinity;
  
  urgentTasks.forEach(task => {
    if (!task.due_date) return;
    
    
    let dueDate;
    try {
      dueDate = new Date(task.due_date);
      
      if (isNaN(dueDate.getTime())) {
        const parts = task.due_date.split(/[-/]/);
        if (parts.length === 3) {
          
          dueDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
    } catch (e) {
      console.error("Summary: Error parsing date", task.due_date, e);
      return;
    }
    
    if (isNaN(dueDate.getTime())) {
      console.warn("Summary: Invalid date format", task.due_date);
      return;
    }
    
    const diff = dueDate.getTime() - today.getTime();
    
    
    if (diff >= 0 && diff < closestDiff) {
      closestTask = task;
      closestDiff = diff;
    }
  });
  
  
  if (closestTask && closestTask.due_date) {
    const dueDate = new Date(closestTask.due_date);
    
    
    const formattedDate = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    upcomingDateElement.textContent = formattedDate;
  } else {
    upcomingDateElement.textContent = '';
  }
}


function configureInitialState() {
  const animationScreen = document.getElementById('animationScreen');
  const contentContainer = document.querySelector('.summary-card-container');
  
  if (window.innerWidth >= 800) {
    
    localStorage.setItem('greetingShown', 'true');
    if (contentContainer) contentContainer.classList.add('visible');
  } else {
    
    if (!localStorage.getItem('greetingShown')) {
      localStorage.setItem('greetingShown', 'true');
      showWelcomeAnimation();
    } else {
      if (contentContainer) contentContainer.classList.add('visible');
    }
  }
}


function showWelcomeAnimation() {
  const animationScreen = document.getElementById('animationScreen');
  if (!animationScreen) return;
  
  const userName = localStorage.getItem('userName') || 
                 sessionStorage.getItem('userName') || 'Guest';
  
  
  const hour = new Date().getHours();
  let timeOfDay = 'night';
  
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
  
  
  animationScreen.innerHTML = `
    <div class="greeting-user-animation">
      <span class="greet-text">Good ${timeOfDay},</span>
      <span class="greet-user-name">${userName}</span>
    </div>
  `;
  
  
  animationScreen.classList.remove('d-none');
  animationScreen.classList.add('fadeIn');
  
  
  setTimeout(() => {
    animationScreen.classList.remove('fadeIn');
    animationScreen.classList.add('fadeOut');
    
    setTimeout(() => {
      animationScreen.classList.add('hidden');
      const contentContainer = document.querySelector('.summary-card-container');
      if (contentContainer) contentContainer.classList.add('visible');
    }, 1000);
  }, 2000);
}


function terminateUserSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  sessionStorage.clear();
  window.location.href = 'index.html';
}


function debugSummary() {
  console.log("=========== SUMMARY DEBUG ===========");
  
  
  try {
    const mockTasksStr = localStorage.getItem('mockTasks');
    console.log("mockTasks in localStorage exists:", !!mockTasksStr);
    
    if (mockTasksStr) {
      const mockTasks = JSON.parse(mockTasksStr);
      console.log("mockTasks parsed successfully:", !!mockTasks);
      console.log("mockTasks is array:", Array.isArray(mockTasks));
      console.log("mockTasks length:", mockTasks ? mockTasks.length : 0);
      
      if (Array.isArray(mockTasks) && mockTasks.length > 0) {
        console.log("First task:", mockTasks[0]);
        
        
        const todoCount = mockTasks.filter(t => t.board_category === BOARD_CATEGORIES.TODO).length;
        const inProgressCount = mockTasks.filter(t => t.board_category === BOARD_CATEGORIES.IN_PROGRESS).length;
        const awaitFeedbackCount = mockTasks.filter(t => t.board_category === BOARD_CATEGORIES.AWAIT_FEEDBACK).length;
        const doneCount = mockTasks.filter(t => t.board_category === BOARD_CATEGORIES.DONE).length;
        
        console.log("Category counts in localStorage:", {
          [BOARD_CATEGORIES.TODO]: todoCount,
          [BOARD_CATEGORIES.IN_PROGRESS]: inProgressCount,
          [BOARD_CATEGORIES.AWAIT_FEEDBACK]: awaitFeedbackCount,
          [BOARD_CATEGORIES.DONE]: doneCount,
          total: mockTasks.length
        });
      }
    }
  } catch (error) {
    console.error("Error debugging localStorage:", error);
  }
  
  
  console.log("Current tasks array:", tasks);
  console.log("Current counts in memory:", {
    [BOARD_CATEGORIES.TODO]: getTaskCountByCategory(BOARD_CATEGORIES.TODO),
    [BOARD_CATEGORIES.IN_PROGRESS]: getTaskCountByCategory(BOARD_CATEGORIES.IN_PROGRESS),
    [BOARD_CATEGORIES.AWAIT_FEEDBACK]: getTaskCountByCategory(BOARD_CATEGORIES.AWAIT_FEEDBACK),
    [BOARD_CATEGORIES.DONE]: getTaskCountByCategory(BOARD_CATEGORIES.DONE),
    total: tasks.length
  });
  
  
  console.log("DOM counter elements:", {
    todoElement: document.getElementById('toDoCount'),
    inProgressElement: document.getElementById('inProgressCount'),
    awaitFeedbackElement: document.getElementById('awaitFeedbackCount'),
    doneElement: document.getElementById('doneCount'),
    totalElement: document.getElementById('allTasks')
  });
  
  console.log("======= END SUMMARY DEBUG =======");
  
  
  loadTasks().then(() => {
    updateAllCounts();
  });
}


function forceUpdate() {
  console.log("Force updating dashboard...");
  return loadTasks().then(() => {
    updateAllCounts();
    updateDeadlineInfo();
    console.log("Force update complete!");
    return true;
  });
}


window.debugSummary = debugSummary;
window.forceUpdate = forceUpdate;


document.addEventListener('DOMContentLoaded', function() {
  console.log("DOMContentLoaded event fired in summary.js");
  
});


console.log("Summary.js loaded - initializing now");
setTimeout(() => {
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("Document ready, initializing dashboard");
    initializeDashboard();
  }
}, 100);