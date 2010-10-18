// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals sc_static Tasks CoreTasks */

/** 

  Task details editor.
  
  @extends SC.View
  @author Suvajit Gupta
*/
Tasks.editorHelper = SC.Object.create({
  
  _listTypes: function() {
     var ret = [];
     ret.push({ name: CoreTasks.TASK_TYPE_FEATURE, value: CoreTasks.TASK_TYPE_FEATURE, icon: 'task-icon-feature' });
     ret.push({ name: CoreTasks.TASK_TYPE_BUG, value: CoreTasks.TASK_TYPE_BUG, icon: 'task-icon-bug' });
     ret.push({ name: CoreTasks.TASK_TYPE_OTHER, value: CoreTasks.TASK_TYPE_OTHER, icon: 'task-icon-other' });
     return ret;
  },

  _listPriorities: function() {
     var ret = [];
     ret.push({ name: '<span class=task-priority-high>' + CoreTasks.TASK_PRIORITY_HIGH.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_HIGH });
     ret.push({ name: '<span class=task-priority-medium>' + CoreTasks.TASK_PRIORITY_MEDIUM.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_MEDIUM });
     ret.push({ name: '<span class=task-priority-low>' + CoreTasks.TASK_PRIORITY_LOW.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_LOW });
     return ret;
  },

  _listStatuses: function() {
     var ret = [];
     ret.push({ name: '<span class=status-planned>' + CoreTasks.STATUS_PLANNED.loc() + '</span>', value: CoreTasks.STATUS_PLANNED });
     ret.push({ name: '<span class=status-active>' + CoreTasks.STATUS_ACTIVE.loc() + '</span>', value: CoreTasks.STATUS_ACTIVE });
     ret.push({ name: '<span class=status-done>' + CoreTasks.STATUS_DONE.loc() + '</span>', value: CoreTasks.STATUS_DONE });
     ret.push({ name: '<span class=status-risky>' + CoreTasks.STATUS_RISKY.loc() + '</span>', value: CoreTasks.STATUS_RISKY });
     return ret;
  },

  _listValidations: function() {
     var ret = [];
     ret.push({ name: '<span class=task-validation-untested>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_UNTESTED });
     ret.push({ name: '<span class=task-validation-passed>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_PASSED });
     ret.push({ name: '<span class=task-validation-failed>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_FAILED });
     return ret;
  },

  _usersCountBinding: SC.Binding.oneWay('Tasks.usersController*arrangedObjects.length'),
  _listUsers: function() {
    // console.log('DEBUG: _listUsers');
    var usersList = Tasks.usersController.get('content');
    var ret1 = [], ret2 = [];
    if(usersList) {
      var users = usersList.toArray();
      for(var i=0, len = users.get('length'); i < len; i++) {
        var user = users.objectAt(i);
        ret1.push(user);
        if(user.get('role') !== CoreTasks.USER_ROLE_GUEST) ret2.push(user);
      }
      var unassigned = { id: '0', displayName: "_Unassigned".loc(), icon: sc_static('blank') };
      ret1.push(unassigned);
      ret2.push(unassigned);
    }
    this.set('usersList', ret1);
    this.set('nonGuestsList', ret2);
  }.observes('_usersCount'),
  usersList: null,
  nonGuestsList: null,

  _projectsCountBinding: SC.Binding.oneWay('Tasks.projectsController*arrangedObjects.length'),
  _listProjects: function() {
    // console.log('DEBUG: _listProjects');
    var projectsList = Tasks.projectsController.get('content');
    var ret = [];
    if(projectsList) {
      ret = projectsList.toArray();
      // Remove system projects from list since you cannot assign to them
      var idx = ret.indexOf(CoreTasks.get('allTasksProject'));
      if(idx !== -1) ret.splice(idx, 1);
      idx = ret.indexOf(CoreTasks.get('unassignedTasksProject'));
      if(idx !== -1) ret.splice(idx, 1);
      idx = ret.indexOf(CoreTasks.get('unallocatedTasksProject'));
      if(idx !== -1) {
        ret.splice(idx, 1);
        ret.push({ id: '0', icon: CoreTasks.getPath('unallocatedTasksProject.icon'), displayName: "_UnallocatedTasks".loc() });
      }
    }
    this.set('projectsList', ret);
  }.observes('_projectsCount'),
  projectsList: null
  
});

// TODO: [SG] make hitting return close slide-out editor when not in fields
Tasks.TaskEditorView = SC.View.extend(
/** @scope Tasks.SummaryView.prototype */ {
  
  task: null,
  titleBarHeight: 40,
  minWidth: 725,
  minHeight: 310,
  
  _preEditing: function() {
    var task = this.get('task');
    var editor = this.get('editor');
    editor.setPath('idLabel.value', "_Task".loc() + ' ' + task.get('displayId'));
    this._watches = CoreTasks.getTaskWatches(task);
    var watchCount = this._watches.length;
    editor.setPath('watchersButton.isVisible', watchCount > 0);
    editor.setPath('watchersButton.title', watchCount);
    var name = task.get('name');
    editor.setPath('nameField.value', name);
    var copyPattern = new RegExp("_Copy".loc() + '$');
    // Put focus in name field of new or copied tasks in task editor
    if((name === CoreTasks.NEW_TASK_NAME.loc() || copyPattern.exec(name)) && Tasks.getPath('tasksController.isEditable')) {
      // TODO: [SG/JL] put focus in text field without using invokeLater()
      this.invokeLater(function() { Tasks.getPath('mainPage.taskEditor.editor.nameField').becomeFirstResponder(); }, 400);
    }
    editor.setPath('typeField.value', task.get('type'));
    editor.setPath('priorityField.value', task.get('priority'));
    editor.setPath('statusField.value', task.get('developmentStatus'));
    editor.setPath('validationField.value', task.get('validation'));
    editor.setPath('effortField.value', task.get('effort'));
    editor.setPath('projectField.value', task.get('projectValue'));
    editor.setPath('submitterField.value', task.get('submitterValue'));
    editor.setPath('assigneeField.value', task.get('assigneeValue'));
    editor.setPath('descriptionField.value', task.get('description'));
    editor.setPath('createdAtLabel.value', task.get('displayCreatedAt'));
    editor.setPath('updatedAtLabel.value', task.get('displayUpdatedAt'));
  },
  _postEditing: function() {
    var task = this.get('task');
    var editor = this.get('editor');
    task.setIfChanged('type', editor.getPath('typeField.value'));
    task.setIfChanged('priority', editor.getPath('priorityField.value'));
    task.setIfChanged('developmentStatus', editor.getPath('statusField.value'));
    task.setIfChanged('validation', editor.getPath('validationField.value'));
    task.setIfChanged('effortValue', editor.getPath('effortField.value'));
    task.setIfChanged('projectValue', editor.getPath('projectField.value'));
    task.setIfChanged('submitterValue', editor.getPath('submitterField.value'));
    task.setIfChanged('assigneeValue', editor.getPath('assigneeField.value'));
    task.setIfChanged('displayName', editor.getPath('nameField.value'));
    task.setIfChanged('description',  editor.getPath('descriptionField.value'));
  },
  _statusDidChange: function() {
    var editor = this.get('editor');
    var status = editor.getPath('statusField.value');
    var isDone = (status === CoreTasks.STATUS_DONE);
    editor.setPath('validationField.isEnabled', isDone);
    if(!isDone) editor.setPath('validationField.value', CoreTasks.TASK_VALIDATION_UNTESTED);
  }.observes('.editor.statusField*value'),
  
  popup: function(task) {
    this.set('task', task);
    Tasks.setPath('mainPage.mainPane.tasksSceneView.nowShowing', 'taskEditor');
    Tasks.set('editorPoppedUp', Tasks.TASK_EDITOR);
    this._preEditing();
    // reselect task since selection is lost when tasksList slides out of view
    this.invokeLast(function() { Tasks.tasksController.selectObject(task); });
  },
  close: function() {
    Tasks.set('editorPoppedUp', null);
    var task = this.get('task');
    if(!task) return;
    this._postEditing();
    if(task.get('name') === CoreTasks.NEW_TASK_NAME.loc()) {
      task.destroy(); // blow away unmodified new task
      Tasks.deselectTasks();
    }
    if(Tasks.assignmentsRedrawNeeded) Tasks.assignmentsController.showAssignments();
    if(CoreTasks.get('autoSave') && !CoreTasks.get('isSaving')) Tasks.saveData();
    Tasks.setPath('mainPage.mainPane.tasksSceneView.nowShowing', 'tasksList');
  },
  
 showWatchers: function() {
   var store = CoreTasks.get('store');
   this._watchers = [];
   var watchesCount = this._watches.length;
   for(var i = 0; i < watchesCount; i++) {
     var watch = this._watches[i];
     var watcher = store.find(CoreTasks.User, watch.get('userId'));
     // console.log('Watcher: ' + watcher.get('name'));
     if(watcher) this._watchers.push(watcher);
   }
   // FIXME: [SC] fix Picker Pane popping up with mangled pointer on SC ToT
   var pane = SC.PickerPane.create({
     layout: { width: 272, height: 100 },
     contentView: SC.View.extend({
       childViews: 'scrollView'.w(),
       scrollView: SC.ScrollView.design({
         contentView: SC.ListView.design({
           contentValueKey: 'displayName',
           content: this._watchers.sort(Tasks.nameAlphaSort),
           localize: YES,
           rowHeight: 24,
           hasContentIcon: YES,
           contentIconKey: 'icon',
           isSelectable: NO,
           isEditable: NO
         })
       })
     })
   });
   pane.popup(this.getPath('editor.watchersButton'), SC.PICKER_POINTER);
 },
 
 previousTask: function() {
   this._postEditing();
   SC.RunLoop.begin();
   Tasks.mainPage.getPath('tasksList.contentView').selectPreviousItem();
   SC.RunLoop.end();
   this.set('task', Tasks.tasksController.getPath('selection.firstObject'));
   this._preEditing();
 },
 nextTask: function() {
   this._postEditing();
   SC.RunLoop.begin();
   Tasks.mainPage.getPath('tasksList.contentView').selectNextItem();
   SC.RunLoop.end();
   this.set('task', Tasks.tasksController.getPath('selection.firstObject'));
   this._preEditing();
 },
  
 childViews: 'editor'.w(),
 
 editor: SC.View.design({
   
   layout: { left: 0, right: 0, top: 0, bottom: 0},
   childViews: 'idLabel backButton previousButton nextButton nameLabel nameField typeLabel typeField priorityLabel priorityField statusLabel statusField validationLabel validationField effortLabel effortField effortHelpLabel projectLabel projectField submitterLabel submitterField assigneeLabel assigneeField descriptionLabel descriptionField createdAtLabel updatedAtLabel watchersButton'.w(),
   classNames: ['task-editor'],

   idLabel: SC.LabelView.design({
     layout: { left: 0, right: 0, top: 0, height: 24 },
     classNames: ['title-bar']
   }),
   
   // backButton: SC.ButtonView.design({
   //   layout: { top: 0, left: 10, width: 80, height: 24 },
   //   title: "_Back".loc(),
   //   target: 'Tasks.mainPage.taskEditor',
   //   action: 'close'
   // }),
   backButton: SC.View.design(SCUI.SimpleButton, {
     layout: { top: 2, left: 10, width: 32, height: 19 },
     classNames: ['back-icon'],
     toolTip: "_GoBackToTasksList".loc(),
     target: 'Tasks.mainPage.taskEditor',
     action: 'close'
    }),

   previousButton: SC.View.design(SCUI.SimpleButton, {
     layout: { top: 3, right: 40, width: 17, height: 16 },
     classNames: ['previous-icon'],
     toolTip: "_ShowPreviousTask".loc(),
     target: 'Tasks.mainPage.taskEditor',
     action: 'previousTask',
     isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                              var task = value.getPath('firstObject');
                                              var tasksList = Tasks.getPath('tasksController.arrangedObjects');
                                              if(!tasksList) return false;
                                              var idx = tasksList.indexOf(task);
                                              if(idx === 1) return false;
                                              return true;
                                            }).from('Tasks*tasksController.selection')
   }),
   nextButton: SC.View.design(SCUI.SimpleButton, {
     layout: { top: 3, right: 10, width: 17, height: 16 },
     classNames: ['next-icon'],
     toolTip: "_ShowNextTask".loc(),
     target: 'Tasks.mainPage.taskEditor',
     action: 'nextTask',
     isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                              var task = value.getPath('firstObject');
                                              var tasksList = Tasks.getPath('tasksController.arrangedObjects');
                                              if(!tasksList) return false;
                                              var idx = tasksList.indexOf(task);
                                              var len = tasksList.get('length') - 1;
                                              if(idx === len) return false;
                                              return true;
                                            }).from('Tasks*tasksController.selection')
   }),

   nameLabel: SC.LabelView.design({
     layout: { top: 40, left: 0, height: 24, width: 55 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Name".loc()
   }),
   nameField: SC.TextFieldView.design({
     layout: { top: 39, left: 60, right: 10, height: 24 },
     isEnabledBinding: 'Tasks.tasksController.isEditable'
   }),

   typeLabel: SC.LabelView.design({
     layout: { top: 74, left: 0, height: 24, width: 55 },
     isVisibleBinding: 'Tasks.softwareMode',
     textAlign: SC.ALIGN_RIGHT,
     value: "_Type".loc()
   }),
   typeField: SC.SelectButtonView.design({
     layout: { top: 72, left: 60, height: 24, width: 120 },
     classNames: ['square'],
     localize: YES,
     isVisibleBinding: 'Tasks.softwareMode',
     isEnabledBinding: 'Tasks.tasksController.isEditable',
     objects: Tasks.editorHelper._listTypes(),
     nameKey: 'name',
     valueKey: 'value',
     iconKey: 'icon',
     toolTip: "_TypeTooltip".loc()
   }),

   priorityLabel: SC.LabelView.design({
     layout: { top: 74, left: 170, height: 24, width: 55 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Priority".loc()
   }),
   priorityField: SC.SelectButtonView.design({
     layout: { top: 72, left: 230, height: 24, width: 120 },
     classNames: ['square'],
     localize: YES,
     isEnabledBinding: 'Tasks.tasksController.isEditable',
     objects: Tasks.editorHelper._listPriorities(),
     nameKey: 'name',
     valueKey: 'value',
     toolTip: "_PriorityTooltip".loc()
   }),

   statusLabel: SC.LabelView.design({
     layout: { top: 74, right: 285, height: 24, width: 50 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Status".loc()
   }),
   statusField: SC.SelectButtonView.design({
     layout: { top: 72, right: 190, height: 24, width: 120 },
     classNames: ['square'],
     localize: YES,
     isEnabledBinding: 'Tasks.tasksController.isEditable',
     objects: Tasks.editorHelper._listStatuses(),
     nameKey: 'name',
     valueKey: 'value',
     toolTip: "_StatusTooltip".loc()
   }),

   validationLabel: SC.LabelView.design({
     layout: { top: 74, right: 105, height: 24, width: 70 },
     textAlign: SC.ALIGN_RIGHT,
     isVisibleBinding: 'Tasks.softwareMode',
     value: "_Validation".loc()
   }),
   validationField: SC.SelectButtonView.design({
     layout: { top: 72, right: 10, height: 24, width: 120 },
     classNames: ['square'],
     localize: YES,
     isVisibleBinding: 'Tasks.softwareMode',
     objects: Tasks.editorHelper._listValidations(),
     nameKey: 'name',
     valueKey: 'value',
     toolTip: "_ValidationTooltip".loc()
   }),

   effortLabel: SC.LabelView.design({
     layout: { top: 111, left: 0, height: 24, width: 55 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Effort:".loc()
   }),
   effortField: SC.TextFieldView.design({
     layout: { top: 109, left: 60, width: 95, height: 24 },
     isEnabledBinding: 'Tasks.tasksController.isEditable'
   }),
   effortHelpLabel: SC.LabelView.design({
     layout: { top: 109, left: 160, height: 30, width: 225 },
     escapeHTML: NO,
     classNames: [ 'onscreen-help'],
     value: "_EffortOnscreenHelp".loc()
   }),

   projectLabel: SC.LabelView.design({
     layout: { top: 148, left: 0, height: 24, width: 55 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Project:".loc()
   }),
   projectField: SCUI.ComboBoxView.design({
     layout: { top: 146, left: 60, width: 270, height: 24 },
     objectsBinding: SC.Binding.oneWay('Tasks.editorHelper*projectsList'),
     nameKey: 'displayName',
     valueKey: 'id',
     iconKey: 'icon',
     isEnabledBinding: 'Tasks.tasksController.isReallocatable'
   }),

   submitterLabel: SC.LabelView.design({
     layout: { top: 111, right: 285, height: 24, width: 75 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Submitter:".loc()
   }),
   submitterField: SCUI.ComboBoxView.design({
     layout: { top: 109, right: 10, width: 272, height: 24 },
     objectsBinding: SC.Binding.oneWay('Tasks.editorHelper*usersList'),
     nameKey: 'displayName',
     valueKey: 'id',
     iconKey: 'icon',
     isEnabledBinding: 'Tasks.tasksController.isEditable'
   }),

   assigneeLabel: SC.LabelView.design({
     layout: { top: 148, right: 285, height: 24, width: 75 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Assignee:".loc()
   }),
   assigneeField: SCUI.ComboBoxView.design({
     layout: { top: 146, right: 10, width: 272, height: 24 },
     objectsBinding: SC.Binding.oneWay('Tasks.editorHelper*nonGuestsList'),
     nameKey: 'displayName',
     valueKey: 'id',
     iconKey: 'icon',
     isEnabledBinding: 'Tasks.tasksController.isEditable'
   }),

   descriptionLabel: SC.LabelView.design({
     layout: { top: 179, left: 10, height: 17, width: 100 },
     icon: 'description-icon',
     value: "_Description:".loc()
   }),
   descriptionField: SC.TextFieldView.design({
     layout: { top: 202, left: 10, right: 10, bottom: 40 },
     hint: "_DescriptionHint".loc(),
     maxLength: 500000,
     isTextArea: YES,
     isEnabled: YES
   }),

   createdAtLabel: SC.LabelView.design({
     layout: { left: 10, bottom: 13, height: 17, width: 250 },
     classNames: [ 'date-time'],
     textAlign: SC.ALIGN_LEFT
   }),
   updatedAtLabel: SC.LabelView.design({
     layout: { right: 10, bottom: 13, height: 17, width: 250 },
     classNames: [ 'date-time'],
     textAlign: SC.ALIGN_RIGHT
   }),

   watchersButton: SC.ButtonView.design({
     layout: { centerX: 0, bottom: 8, height: 24, width: 80 },
     icon: 'watches-icon',
     fontWeight: SC.BOLD_WEIGHT,
     action: 'showWatchers',
     toolTip: "_TaskWatchersTooltip".loc()
   })
   
  })
  
});