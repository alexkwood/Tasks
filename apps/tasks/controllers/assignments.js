// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  This controller manages what is displayed in the Tasks detail screen.
  This is affected by the selected Project/User and the search criteria.
  
  @extends SC.ArrayController
  @author Joshua Holt
  @author Suvajit Gupta
*/
Tasks.assignmentsController = SC.ArrayController.create(
/** @scope Tasks.assignmentsController.prototype */ {
  
  contentBinding: 'Tasks.projectController.tasks',
  assignedTasks: null,
  assigneeSelection: null,
  searchFilter: null,
  
  showAssignments: function() { // show tasks for selected user that matches search filter

    var sf = this.get('searchFilter');
    sf = this._escapeMetacharacters(sf);
    var rx = new RegExp(sf, 'i');
    
    var assignees = {}, assigneeName, assignee, assignmentNodes = [];
    this.forEach( // group tasks by user & separate unassigned tasks
      function(task){
        assignee = task.get('assignee');
        assigneeName = assignee? assignee.get('displayName') : CoreTasks.USER_UNASSIGNED;
        var assigneeObj = assignees[assigneeName];
        if(!assigneeObj) {
          assigneeObj = { assignee: assignee, tasks: [] };
          assignees[assigneeName] = assigneeObj;
        }
        var taskName = task.get('name');
        if(taskName.match(rx)) { // filter tasks that match search filter
          assigneeObj.tasks.push(task);
        }
      }, this);
  
    var selectedAssignee = this.get('assigneeSelection');
    if(selectedAssignee){ // only show tasks for selected user
      
      var selectedUserName = CoreTasks.get('store').find(CoreTasks.User, selectedAssignee.id).get('displayName');

      for(assigneeName in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assigneeName) && assigneeName === selectedUserName) {
          assignmentNodes.push(this._createAssignmentNode(assigneeName, assignees[assigneeName]));
        }
      }
      
    } else { // show tasks for all users
      
      for(assigneeName in assignees){ // list unassigned tasks first
        if(assignees.hasOwnProperty(assigneeName) && assigneeName === CoreTasks.USER_UNASSIGNED) {
          assignmentNodes.push(this._createAssignmentNode(assigneeName, assignees[assigneeName]));
        }
      }
      
      for(assigneeName in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assigneeName) && assigneeName !== CoreTasks.USER_UNASSIGNED) {
          assignmentNodes.push(this._createAssignmentNode(assigneeName, assignees[assigneeName]));
        }
      }
      
    }
      
    this.set('assignedTasks', SC.Object.create({ treeItemChildren: assignmentNodes, treeItemIsExpanded: YES }));
    
  },
  
  _escapeMetacharacters: function(str){
    var metaCharacters = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ];
    var s = new RegExp('(\\' + metaCharacters.join('|\\') + ')', 'g');
    return str? str.replace(s, '\\$1') : '';
  },
  
  /**
   * Create a node in the tree showing a user's tasks.
   *
   * @param {String} assignee name.
   * @param {Object} a hash of assignee ID and tasks array.
   * @returns {Object) return a node to be inserted into the tree view.
   */
  _createAssignmentNode: function(assigneeName, assigneeObj) {
    
    var displayName = assigneeName;
    
    // FIXME: [SG] need to trigger content changes after a task is in-cell edited or it's priority changed since these may affect the user's totalEffort
    var effortString, totalEffortMin = 0, totalEffortMax = 0, effortMin, effortMax;
    var task, tasks = assigneeObj.tasks;
    var len = tasks.get('length');
    for (var i = 0; i < len; i++) {
      task = tasks.objectAt(i);
      effortString = task.get('effort');
      if(effortString && task.get('priority') !== CoreTasks.TASK_PRIORITY_LOW) {
        // sum up effort for High/Medium priority tasks
        effortMin = parseInt(effortString, 10);
        var idx = effortString.indexOf('-'); // see if effort is a range
        if(idx === -1) { // not a range
          effortMax = effortMin;
        }
        else { // effort IS a range, extract max
          effortMax = parseInt(effortString.slice(idx+1), 10);
        }
        totalEffortMin += effortMin;
        totalEffortMax += effortMax;
      }
    }
    if(totalEffortMin !== 0) {
      var totalEffort = '' + totalEffortMin;
      if (totalEffortMax !== totalEffortMin) {
        totalEffort += '-' + totalEffortMax;
      }
      displayName = displayName + ' {' + totalEffort + '}';
    }
    
    return SC.Object.create({
      displayName: displayName,
      assignee: assigneeObj.assignee,
      treeItemChildren: tasks,
      treeItemIsExpanded: YES
    });
  },
  
  _contentHasChanged: function() {
    this.showAssignments();
  }.observes('[]'),
  
  _assigneeHasChanged: function() {
    this.showAssignments();
  }.observes('assigneeSelection'),
  
  _searchFilterHasChanged: function() {
    this.showAssignments();
  }.observes('searchFilter')
  
});