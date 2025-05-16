// Force immediate updates to summary counts
document.addEventListener('DOMContentLoaded', function() {
  console.log("DIRECT FORCE UPDATE SCRIPT RUNNING");
  
  // Direct DOM manipulation to update counts after a delay
  setTimeout(function() {
    // Get all tasks from the API
    fetch('http://127.0.0.1:8000/api/tasks/')
      .then(response => response.json())
      .then(tasks => {
        console.log("DIRECT UPDATE: Got", tasks.length, "tasks");
        
        // Count tasks by category
        const todoCount = tasks.filter(task => 
          task && task.board_category === 'to-do'
        ).length;
        
        const inProgressCount = tasks.filter(task => 
          task && task.board_category === 'in-progress'
        ).length;
        
        const awaitFeedbackCount = tasks.filter(task => 
          task && task.board_category === 'await-feedback'
        ).length;
        
        const doneCount = tasks.filter(task => 
          task && task.board_category === 'done'
        ).length;
        
        const urgentCount = tasks.filter(task => 
          task && task.priority === 'urgent'
        ).length;
        
        // Directly update the DOM elements
        const updateCount = (id, count) => {
          const element = document.getElementById(id);
          if (element) {
            console.log(`DIRECT UPDATE: Setting ${id} to ${count}`);
            element.textContent = count;
          } else {
            console.warn(`DIRECT UPDATE: Element ${id} not found`);
          }
        };
        
        // Update all count elements
        updateCount('toDoCount', todoCount);
        updateCount('inProgressCount', inProgressCount);
        updateCount('awaitFeedbackCount', awaitFeedbackCount);
        updateCount('doneCount', doneCount);
        updateCount('urgentCount', urgentCount);
        updateCount('allTasks', tasks.length);
        
        console.log("DIRECT UPDATE: Summary counts updated");
      })
      .catch(error => {
        console.error("DIRECT UPDATE ERROR:", error);
      });
  }, 1000);
});